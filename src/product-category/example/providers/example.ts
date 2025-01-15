import { DbOffer, Resource } from "@/database/schema";
import {
  ExampleBaseProvider,
  ExampleResourceDetails,
} from "@/product-category/example/base-provider";
import { Agreement } from "@forest-protocols/sdk";

/**
 * The main class that implements provider specific actions.
 * @responsible Provider
 */
export class ExampleProvider extends ExampleBaseProvider {
  /**
   * Implement the below methods according to your custom
   * logics and base provider definition.
   */
  async resetCredentials(
    agreement: Agreement,
    resource: Resource
  ): Promise<any> {
    throw new Error("Method not implemented.");
  }

  async create(
    agreement: Agreement,
    offer: DbOffer
  ): Promise<ExampleResourceDetails> {
    throw new Error("Method not implemented.");
  }

  async getDetails(
    agreement: Agreement,
    resource: Resource
  ): Promise<ExampleResourceDetails> {
    throw new Error("Method not implemented.");
  }

  async delete(
    agreement: Agreement,
    resource: Resource
  ): Promise<ExampleResourceDetails> {
    throw new Error("Method not implemented.");
  }
}
