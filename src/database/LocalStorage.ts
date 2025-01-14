import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { config } from "@/config";
import { generateCID, NotInitialized } from "@forest-protocols/sdk";
import { and, desc, eq, sql } from "drizzle-orm";
import { NotFound } from "@/errors/NotFound";
import * as schema from "./schema";
import pg from "pg";

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

  private checkClient() {
    if (!this.client) {
      throw new NotInitialized("Local storage client");
    }
  }
}
