import { BaseResourceDetails } from "./details";
import { Agreement, PipeMethod, PipeResponseCode } from "@forestprotocols/sdk";
import { AbstractProvider } from "@/abstract/AbstractProvider";
import { marketplace } from "@/clients";

/**
 * Base provider that defines what kind of actions needs to be implemented for the product category.
 * @responsible Product Category Owner
 */
export abstract class BaseProvider extends AbstractProvider<BaseResourceDetails> {
  /**
   * An example function that all of the providers of this product category need to implement.
   * @param agreement
   */
  abstract resetCredentials(
    agreement: Agreement,
    requester: string
  ): Promise<any>;

  async init() {
    await super.init();

    // Example product specific pipe routes.
    // Product category owner has to define purpose of the routes.

    // NOTE: It would increase the readability if you add structured comments like below:
    /**
     * Resets the credentials of a resource
     * method: GET
     * path: /reset
     * params:
     *  id: number -> ID of the resource
     */
    this.pipe.route(PipeMethod.GET, "/reset", async (req) => {
      const agreementId = req.params!.id; // NOTE: Before using the params, be sure they are exists
      const agreement = await marketplace.getAgreement(agreementId);
      const newCredentials = await this.resetCredentials(
        agreement,
        req.requester
      );

      return {
        code: PipeResponseCode.OK,
        body: {
          credentials: newCredentials,
        },
      };
    });
  }
}
