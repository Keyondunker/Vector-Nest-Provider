import { AbstractProvider } from "@/abstract/AbstractProvider";
import { BaseResourceDetails } from "./details";
import { Agreement } from "forest-js";

/**
 * Base provider that defines what kind of actions needs to be implemented for the product category.
 * @responsible Product Category Owner
 */
export abstract class BaseProvider extends AbstractProvider<BaseResourceDetails> {
  /**
   * An example function that all of the providers of this product category need to implement.
   * @param agreement On-chain agreement of the resource
   * @responsible Product Category Owner
   */
  abstract generateAuthentication(
    agreement: Agreement
  ): Promise<BaseResourceDetails>;
}
