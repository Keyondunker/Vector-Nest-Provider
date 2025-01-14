import { config } from "@/config";
import { BaseProvider } from "@/product-category/BaseProvider";
import { BaseResourceDetails } from "@/product-category/details";
import { Agreement, XMTPPipe } from "@forestprotocols/sdk";
import { Address } from "viem";

/**
 * The main class that implements provider specific actions.
 */
export class Provider extends BaseProvider {
  /**
   * Don't edit this section.
   * @responsible Product Category Owner
   */
  pipe = new XMTPPipe(config.OPERATOR_WALLET_PRIVATE_KEY as Address);

  async init() {
    await this.pipe.init({
      chain: config.CHAIN,
      rpcHost: config.RPC_HOST,
      env: "dev",
    });

    await super.init();
  }

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
