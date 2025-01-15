import { Agreement } from "@forest-protocols/sdk";
import { BaseSxTProvider, SxTResourceDetails } from "../base-provider";
import { Resource } from "@/database/schema";

/**
 * The main class that implements provider specific actions.
 * @responsible Provider
 */
export class SxTExampleProvider extends BaseSxTProvider {
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
     * TODO: Implement how an SQL query run and return the results.
     */
    throw new Error("Method not implemented.");
  }

  async create(agreement: Agreement): Promise<SxTResourceDetails> {
    /**
     * TODO: Implement the resource creation process.
     */
    throw new Error("Method not implemented.");
  }

  async getDetails(agreement: Agreement): Promise<SxTResourceDetails> {
    /**
     * TODO: Implement how to gather details from the resource.
     */
    throw new Error("Method not implemented.");
  }

  async delete(agreement: Agreement): Promise<SxTResourceDetails> {
    /**
     * TODO: Implement the resource deletion process.
     */
    throw new Error("Method not implemented.");
  }
}
