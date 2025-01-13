import { BaseResourceDetails } from "./details";
import {
  AbstractProvider,
  Agreement,
  Marketplace,
  PipeMethod,
  PipeResponseCode,
} from "forestprotocol";
import { config } from "@/config";

/**
 * Base provider that defines what kind of actions needs to be implemented for the product category.
 * @responsible Product Category Owner
 */
export abstract class BaseProvider extends AbstractProvider<BaseResourceDetails> {
  /**
   * An example function that all of the providers of this product category need to implement.
   * @param agreement On-chain agreement of the resource
   */
  abstract generateAuthentication(
    agreement: Agreement
  ): Promise<BaseResourceDetails>;

  /**
   * Another example function.
   * @param agreement
   */
  abstract resetCredentials(agreement: Agreement): Promise<any>;

  async init() {
    /**
     * If the product has some interactions, product category owner has to define
     * which "paths" will be responsible for those interactions and what kind of
     * request-response should be sent/received from them.
     */
    this.pipe.route(PipeMethod.GET, "/reset", async (req) => {
      const marketplace = Marketplace.create(config.CHAIN, config.RPC_HOST);
      const body: { agreementId: number } = req.body;

      return {
        code: PipeResponseCode.OK,
        body: {
          credentials: await this.resetCredentials(
            await marketplace.getAgreement(body.agreementId)
          ),
        },
      };
    });
  }
}
