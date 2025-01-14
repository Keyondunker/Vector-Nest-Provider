import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { config } from "@/config";
import {
  DeploymentStatus,
  generateCID,
  NotInitialized,
} from "@forest-protocols/sdk";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { NotFound } from "@/errors/NotFound";
import * as schema from "./schema";
import pg from "pg";
import { OfferParameterType } from "@/constants";

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
  async updateResource(id: number, values: Partial<schema.DbResourceSelect>) {
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
  async getOffer(id: number) {
    const [offer] = await this.offerQuery().where(
      eq(schema.offersTable.id, id)
    );

    if (!offer) {
      throw new NotFound("Offer");
    }

    return offer;
  }

  /**
   * Retrieves all of the offers that this provider have
   */
  async getOffers() {
    return await this.offerQuery();
  }

  /**
   * Retrieve all of the details about the provider itself
   */
  async getProviderDetails() {
    this.checkClient();
    const [result] = await this.client!.select({
      details: sql<{
        [key: string]: string;
      }>`jsonb_object_agg(${schema.providerDetailsTable.name}, ${schema.providerDetailsTable.value})`,
    }).from(schema.providerDetailsTable);

    if (!result) {
      return {};
    }

    if (result.details.cid === undefined) {
      result.details.cid = (await generateCID(result.details)).toString();
    }

    return result.details;
  }

  /**
   * Adds or updates a provider detail
   * @param name
   * @param value
   * @returns
   */
  async setProviderDetail(name: string, value: string) {
    this.checkClient();
    return await this.client!.transaction(async (tx) => {
      const [detail] = await tx
        .select()
        .from(schema.providerDetailsTable)
        .where(eq(schema.providerDetailsTable.name, name));

      if (detail) {
        // Do we really need to update it?
        if (detail.value != value) {
          await tx
            .update(schema.providerDetailsTable)
            .set({
              value,
            })
            .where(eq(schema.providerDetailsTable.name, name));
          return await this.updateProviderDetailsCID(tx);
        }
      } else {
        await tx.insert(schema.providerDetailsTable).values({
          name,
          value,
        });
        return await this.updateProviderDetailsCID(tx);
      }
    });
  }

  /**
   * Returns the latest processed block height.
   */
  async getLatestProcessedBlockHeight(): Promise<bigint | undefined> {
    this.checkClient();
    const [lastBlock] = await this.client!.select()
      .from(schema.blockchainTxsTable)
      .orderBy(desc(schema.blockchainTxsTable.height))
      .limit(1);

    return lastBlock?.height;
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
   * Calculates CID of the provider details
   * @param tx DB client, can be a TX or client itself.
   */
  private async updateProviderDetailsCID(tx: DatabaseClientType) {
    const [results] = await tx
      .select({
        details: sql<{
          [key: string]: string;
        }>`jsonb_object_agg(${schema.providerDetailsTable.name}, ${schema.providerDetailsTable.value})`,
      })
      .from(schema.providerDetailsTable);

    const details = results?.details || {};
    const cidExists = details.cid !== undefined;

    // CID itself also stored as a detail but not included in the calculation
    if (cidExists) {
      delete details.cid;
    }

    details.cid = (await generateCID(details)).toString();

    // Save calculated CID to the database
    if (cidExists) {
      await tx
        .update(schema.providerDetailsTable)
        .set({ value: details.cid })
        .where(eq(schema.providerDetailsTable.name, "cid"));
    } else {
      await tx.insert(schema.providerDetailsTable).values({
        name: "cid",
        value: details.cid,
      });
    }

    return details;
  }

  private checkClient() {
    if (!this.client) {
      throw new NotInitialized("Local storage client");
    }
  }
}
