import { AbstractProvider } from "@/abstract/AbstractProvider";
import { OnChainResource } from "forest-js";
import { BaseResourceDetails } from "./details";

/**
 * Base provider that defines what kind of actions needs to be implemented for the product category.
 * @responsible Product Category Owner
 */
export abstract class BaseProvider extends AbstractProvider<BaseResourceDetails> {
  /**
   * An example special function that all of the providers of this product category need to implement.
   * @param onChainResource Information about the resource
   * @responsible Product Category Owner
   */
  abstract generateAuthentication(
    onChainResource: OnChainResource
  ): Promise<BaseResourceDetails>;
}
