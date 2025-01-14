import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { config } from "@/config";
import { NotInitialized } from "@forestprotocols/sdk";
import { and, desc, eq } from "drizzle-orm";
import pg from "pg";

export class LocalStorage {
  private static _instance: LocalStorage;

  client: NodePgDatabase<typeof schema> | undefined;

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
