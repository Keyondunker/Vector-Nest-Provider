import { config } from "@/config";
import { BaseProvider } from "@/product/BaseProvider";
import { BaseResourceDetails } from "@/product/details";
import {
  OnChainResource,
  PipeMethod,
  PipeResponseCode,
  XMTPPipe,
} from "forest-js";

/**
 * The main class the should be implemented by the provider.
 * @responsible Provider
 */
export class Provider extends BaseProvider {
  pipe: XMTPPipe = new XMTPPipe("0x<provider operator private ket>");

  async generateAuthentication(
    onChainResource: OnChainResource
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

  async create(onChainResource: OnChainResource): Promise<BaseResourceDetails> {
    throw new Error("Method not implemented.");
  }

  async getDetails(
    onChainResource: OnChainResource
  ): Promise<BaseResourceDetails> {
    throw new Error("Method not implemented.");
  }

  async delete(onChainResource: OnChainResource): Promise<BaseResourceDetails> {
    throw new Error("Method not implemented.");
  }

  async checkBalance(
    onChainResource: OnChainResource
  ): Promise<BaseResourceDetails> {
    throw new Error("Method not implemented.");
  }
}
