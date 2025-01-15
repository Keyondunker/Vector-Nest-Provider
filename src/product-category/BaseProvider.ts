import { Agreement, PipeMethod, PipeResponseCode } from "@forest-protocols/sdk";
import { AbstractProvider } from "@/abstract/AbstractProvider";
import { marketplace } from "@/clients";
import { LocalStorage } from "@/database/LocalStorage";
import { logger } from "@/logger";
import { NotFound } from "@/errors/NotFound";
import { Resource } from "@/database/schema";
import { ResourceDetails } from "@/types";

/**
 * The details gathered by the provider from the resource source.
 * @responsible Product Category Owner
 */
export interface ExampleResourceDetails extends ResourceDetails {
  exampleHttpAddress: string;
  exampleAuthKey: string;
}

/**
 * Base provider that defines what kind of actions needs to be implemented for the product category.
 * @responsible Product Category Owner
 */
export abstract class ExampleBaseProvider extends AbstractProvider<ExampleResourceDetails> {
  /**
   * An example function that all of the providers of this product category need to implement.
   * @param agreement
   */
  abstract resetCredentials(
    agreement: Agreement,
    resource: Resource
  ): Promise<any>;

  async init() {
    await super.init();

    // Example product specific pipe routes.
    // Product category owner has to define purpose of the routes.

    // NOTE: It would increase the readability if you add structured comments like below:
    /**
     * Resets the credentials of the database.
     * method: GET
     * path: /reset
     * params:
     *  id: number -> ID of the resource.
     */
    this.pipe.route(PipeMethod.GET, "/reset", async (req) => {
      if (!req.params?.id) {
        return {
          code: PipeResponseCode.BAD_REQUEST,
          message: `Missing "id" param`,
        };
      }

      try {
        const agreementId = req.params?.id;
        const resource = await LocalStorage.instance.getResource(
          agreementId,
          req.requester
        );
        const agreement = await marketplace.getAgreement(agreementId);

        // Call the provider implemented function
        const newCredentials = await this.resetCredentials(agreement, resource);

        return {
          code: PipeResponseCode.OK,
          body: {
            credentials: newCredentials,
          },
        };
      } catch (err: any) {
        if (err instanceof NotFound) {
          return {
            code: PipeResponseCode.NOT_FOUND,
            message: "Resource not found",
          };
        }
        logger.error(err.stack);
      }

      return {
        code: PipeResponseCode.INTERNAL_SERVER_ERROR,
        body: {
          message: "Internal server error",
        },
      };
    });
  }
}
