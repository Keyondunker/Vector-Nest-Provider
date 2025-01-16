import { Agreement } from "@forest-protocols/sdk";
import { DbOffer, Resource } from "@/database/schema";
import {
  BasePostgreSQLDatabaseProvider,
  PostgreSQLDatabaseDetails,
} from "./base-provider";

/**
 * The main class that implements provider specific actions.
 * @responsible Provider
 */
export class PostgreSQLDatabaseProvider extends BasePostgreSQLDatabaseProvider {
  async resetCredentials(
    agreement: Agreement,
    resource: Resource
  ): Promise<any> {
    /**
     * TODO: Implement how the credentials would be reset.
     */
    throw new Error("Method not implemented.");
  }

  async sqlQuery(
    agreement: Agreement,
    resource: Resource,
    query: string
  ): Promise<any[]> {
    /**
     * TODO: Implement how an SQL query would be executed and return the results.
     */
    throw new Error("Method not implemented.");
  }

  async create(
    agreement: Agreement,
    offer: DbOffer
  ): Promise<PostgreSQLDatabaseDetails> {
    /**
     * TODO: Implement the resource creation process.
     */
    throw new Error("Method not implemented.");
  }
  async getDetails(
    agreement: Agreement,
    resource: Resource
  ): Promise<PostgreSQLDatabaseDetails> {
    /**
     * TODO: Implement how to gather details from the resource.
     */
    throw new Error("Method not implemented.");
  }
  async delete(
    agreement: Agreement,
    resource: Resource
  ): Promise<PostgreSQLDatabaseDetails> {
    /**
     * TODO: Implement the resource deletion process.
     */
    throw new Error("Method not implemented.");
  }
}
