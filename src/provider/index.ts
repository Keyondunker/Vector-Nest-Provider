import { BaseProvider } from "@/product-category/BaseProvider";
import { BaseResourceDetails } from "@/product-category/details";
import { Agreement, XMTPPipe } from "@forestprotocols/sdk";

/**
 * The main class that implements provider specific actions.
 */
export class Provider extends BaseProvider {
  /**
   * Implement the below methods according to your custom logics
   * @responsible Provider
   */
  async generateAuthentication(
    agreement: Agreement
  ): Promise<BaseResourceDetails> {
    throw new Error("Method not implemented.");
  }

  async resetCredentials(agreement: Agreement): Promise<any> {
    throw new Error("Method not implemented.");
  }

  async create(agreement: Agreement): Promise<BaseResourceDetails> {
    throw new Error("Method not implemented.");
  }

  async getDetails(agreement: Agreement): Promise<BaseResourceDetails> {
    throw new Error("Method not implemented.");
  }

  async delete(agreement: Agreement): Promise<BaseResourceDetails> {
    throw new Error("Method not implemented.");
  }
}
