import { BaseProvider } from "@/product/base-provider";
import { BaseResourceDetails } from "@/product/details";
import { OnChainResource } from "forest-js";

/**
 * The main class the should be implemented by the provider.
 * @responsible Provider
 */
export class Provider extends BaseProvider {
  generateAuthentication(
    onChainResource: OnChainResource
  ): Promise<BaseResourceDetails> {
    throw new Error("Method not implemented.");
  }
  create(onChainResource: OnChainResource): Promise<BaseResourceDetails> {
    throw new Error("Method not implemented.");
  }
  getDetails(onChainResource: OnChainResource): Promise<BaseResourceDetails> {
    throw new Error("Method not implemented.");
  }
  delete(onChainResource: OnChainResource): Promise<BaseResourceDetails> {
    throw new Error("Method not implemented.");
  }
  checkBalance(onChainResource: OnChainResource): Promise<BaseResourceDetails> {
    throw new Error("Method not implemented.");
  }
}
