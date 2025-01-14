import { DbOffer, DbResourceSelect } from "@/database/schema";
import { BaseProvider } from "@/product-category/BaseProvider";
import { BaseResourceDetails } from "@/product-category/details";
import { Agreement } from "@forest-protocols/sdk";

/**
 * The main class that implements provider specific actions.
 * @responsible Provider
 */
export class Provider extends BaseProvider {
  /**
   * Implement the below methods according to your custom
   * logics and base provider definition.
   */
  async resetCredentials(
    agreement: Agreement,
    requester: string
  ): Promise<any> {
    throw new Error("Method not implemented.");
  }

  async create(
    agreement: Agreement,
    offer: DbOffer
  ): Promise<BaseResourceDetails> {
    throw new Error("Method not implemented.");
  }

  async getDetails(
    agreement: Agreement,
    resource: DbResourceSelect
  ): Promise<BaseResourceDetails> {
    throw new Error("Method not implemented.");
  }

  async delete(
    agreement: Agreement,
    resource: DbResourceSelect
  ): Promise<BaseResourceDetails> {
    throw new Error("Method not implemented.");
  }
}
