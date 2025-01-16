import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { config } from "@/config";
import {
  DeploymentStatus,
  generateCID,
  NotInitialized,
} from "@forest-protocols/sdk";
import { z } from "zod";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { NotFound } from "@/errors/NotFound";
import { OfferParameterType } from "@/constants";
import * as schema from "./schema";
import pg from "pg";
import { Address, privateKeyToAccount } from "viem/accounts";
import { logger } from "@/logger";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { nonEmptyStringSchema } from "@/validation/schemas";

export type DatabaseClientType = NodePgDatabase<typeof schema>;

export class LocalStorage {
  private static _instance: LocalStorage;

  client: DatabaseClientType | undefined;

  private constructor() {}

  static get instance() {
    if (!LocalStorage._instance) {
      LocalStorage._instance = new LocalStorage();
    }

    return LocalStorage._instance;
  }

  async init() {
    const pool = new pg.Pool({
      connectionString: config.DATABASE_URL,
    });

    this.client = drizzle(pool, {
      schema,
    });

    await this.syncProviderData();
  }

  /**
   * Creates a new resource record.
   */
  async createResource(values: schema.DbResourceInsert) {
    this.checkClient();
    await this.client!.insert(schema.resourcesTable).values(values);
  }

  /**
   * Updates an existing resource record with the given values.
   */
  async updateResource(id: number, values: Partial<schema.Resource>) {
    this.checkClient();
    await this.client!.update(schema.resourcesTable)
      .set(values)
      .where(eq(schema.resourcesTable.id, id));
  }

  /**
   * Marks a resource record as deleted (not active) and deletes its details.
   */
  async deleteResource(id: number) {
    await this.updateResource(id, {
      isActive: false,
      deploymentStatus: DeploymentStatus.Closed,
      details: {}, // TODO: Should we delete all the details (including credentials)?
    });
  }

  /**
   * Retrieves details of a resource
   * @param id
   */
  async getResource(id: number, ownerAddress: string) {
    this.checkClient();
    const [resource] = await this.client!.select()
      .from(schema.resourcesTable)
      .where(
        and(
          eq(schema.resourcesTable.id, id),
          eq(schema.resourcesTable.ownerAddress, ownerAddress)
        )
      );

    if (!resource) {
      throw new NotFound("Resource");
    }

    return resource;
  }

  /**
   * Retrieves an offer details from the database.
   * @param id
   */
  async getOffer(id: number): Promise<schema.DbOffer> {
    const [offer] = await this.offerQuery().where(
      eq(schema.offersTable.id, id)
    );

    if (!offer) {
      throw new NotFound(`Offer ${id}`);
    }

    // This casting is needed because of the fullJoin drizzle
    // defines typeof of the always available fields as optional
    return offer as schema.DbOffer;
  }

  /**
   * Retrieves all of the offers that this provider have
   */
  async getOffers(): Promise<schema.DbOffer[]> {
    return (await this.offerQuery()) as schema.DbOffer[];
  }

  /**
   * Retrieve all of the details about the provider itself
   */
  async getProviderDetails(ownerAddress: string) {
    this.checkClient();
    const [result] = await this.client!.select()
      .from(schema.providersTable)
      .where(eq(schema.providersTable.ownerAddress, ownerAddress));

    if (!result) {
      return {};
    }

    result.details.cid = result.cid;
    return result.details;
  }

  /**
   * Returns the latest processed block height for a provider.
   */
  async getLatestProcessedBlockHeight(): Promise<bigint | undefined> {
    this.checkClient();
    const [lastBlock] = await this.client!.select()
      .from(schema.blockchainTxsTable)
      .orderBy(desc(schema.blockchainTxsTable.height))
      .limit(1);

    return lastBlock?.height;
  }

  async getProvider(ownerAddress: string) {
    this.checkClient();
    const [provider] = await this.client!.select()
      .from(schema.providersTable)
      .where(eq(schema.providersTable.ownerAddress, ownerAddress));

    if (!provider) {
      throw new NotFound(`Provider ${ownerAddress}`);
    }

    return provider;
  }

  /**
   * Retrieves a transaction from the database.
   * @param blockHeight
   * @param hash
   */
  async getTransaction(blockHeight: bigint, hash: string) {
    this.checkClient();
    const [tx] = await this.client!.select()
      .from(schema.blockchainTxsTable)
      .where(
        and(
          eq(schema.blockchainTxsTable.height, blockHeight),
          eq(schema.blockchainTxsTable.hash, hash)
        )
      );

    return tx;
  }

  /**
   * Saves a transaction as processed
   * @param blockHeight
   */
  async saveTxAsProcessed(blockHeight: bigint, hash: string) {
    this.checkClient();
    await this.client!.transaction(async (tx) => {
      const [transaction] = await tx
        .select()
        .from(schema.blockchainTxsTable)
        .where(eq(schema.blockchainTxsTable.height, blockHeight));

      if (!transaction) {
        await tx.insert(schema.blockchainTxsTable).values({
          height: blockHeight,
          isProcessed: true,
          hash,
        });
      } else if (transaction.isProcessed === false) {
        await tx
          .update(schema.blockchainTxsTable)
          .set({ isProcessed: true })
          .where(eq(schema.blockchainTxsTable.height, blockHeight));
      }
    });
  }

  /**
   * Synchronizes the provider data from .json file to the database
   */
  private async syncProviderData() {
    this.checkClient();
    await this.client!.transaction(async (tx) => {
      for (const [_, info] of Object.entries(config.providers)) {
        logger.info("Providers data synching with the database");

        // NOTE: This is where we store the additional data about the provider inside the database
        const details = {
          name: info.name,
          description: info.description,
          homepage: info.homepage,
        };

        const account = privateKeyToAccount(
          info.providerWalletPrivateKey as Address
        );
        const cid = await generateCID(details);

        const [provider] = await tx
          .select()
          .from(schema.providersTable)
          .where(eq(schema.providersTable.ownerAddress, account.address));

        if (provider) {
          await tx
            .update(schema.providersTable)
            .set({
              cid: cid.toString(),
              details,
            })
            .where(eq(schema.providersTable.ownerAddress, account.address));
        } else {
          await tx.insert(schema.providersTable).values({
            cid: cid.toString(),
            details,
            ownerAddress: account.address,
          });
        }
      }
    });
  }

  /**
   * Generates a base "offer" query
   * @returns Dynamic query
   */
  private offerQuery() {
    this.checkClient();
    return this.client!.select({
      id: schema.offersTable.id,
      name: schema.offersTable.name,
      deploymentParams: schema.offersTable.deploymentParams,
      cid: schema.offersTable.cid,
      providerId: schema.offersTable.providerId,
      parameters: sql<
        {
          name: string;
          value: string;
          type: OfferParameterType;
        }[]
      >`
      COALESCE(
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'name', ${schema.offerParametersTable.name},
            'value', ${schema.offerParametersTable.value},
            'type', ${schema.offerParametersTable.type}
          )
        ) FILTER (WHERE ${isNotNull(schema.offerParametersTable.offerId)}),
        '[]'::jsonb
      )`,
    })
      .from(schema.offersTable)
      .fullJoin(
        schema.offerParametersTable,
        eq(schema.offersTable.id, schema.offerParametersTable.offerId)
      )
      .groupBy(schema.offersTable.id)
      .$dynamic();
  }

  /**
   * Checks if the client is initialized or not
   */
  private checkClient() {
    if (!this.client) {
      throw new NotInitialized("Local storage client");
    }
  }
}
