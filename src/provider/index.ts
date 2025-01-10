import { config } from "@/config";
import { BaseProvider } from "@/product-category/BaseProvider";
import { BaseResourceDetails } from "@/product-category/details";
import { Agreement, PipeMethod, PipeResponseCode, XMTPPipe } from "forest-js";

/**
 * The main class that should be implemented by the provider.
 * @responsible Provider
 */
export class Provider extends BaseProvider {
  pipe = new XMTPPipe("0x<provider operator private key>");

  async generateAuthentication(
    agreement: Agreement
  ): Promise<BaseResourceDetails> {
    throw new Error("Method not implemented.");
  }

  async init() {
    await this.pipe.init({
      chain: config.CHAIN,
      rpcHost: config.RPC_HOST,
      env: "dev",
    });

    await this.pipe.route(PipeMethod.GET, "/", (req) => {
      if (req.body?.name == "example-1") {
        return {
          code: PipeResponseCode.OK,
          body: {
            status: "ok",
          },
        };
      }
    });
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

  async checkBalance(agreement: Agreement): Promise<BaseResourceDetails> {
    throw new Error("Method not implemented.");
  }
}
