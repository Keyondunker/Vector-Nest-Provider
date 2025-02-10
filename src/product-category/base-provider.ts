import {
  addressSchema,
  Agreement,
  PipeMethod,
  PipeResponseCode,
  validateBodyOrParams,
} from "@forest-protocols/sdk";
import { AbstractProvider } from "@/abstract/AbstractProvider";
import { Resource, ResourceDetails } from "@/types";
import { z } from "zod";
import { Address } from "viem";

/**
 * The details gathered by the Provider from the resource source.
 * This is the "details" type of each resource and it is stored in the database.
 * @responsible Product Category Owner
 */
export type ExampleProductDetails = ResourceDetails & {
  Example_Detail: number;

  /* A detail provided by the resource but won't be sent when the user requested it */
  _examplePrivateDetailWontSentToUser: string;
};

/**
 * Base Provider that defines what kind of actions needs to be implemented for the Product Category.
 * @responsible Product Category Owner
 */
export abstract class BaseExampleProductProvider extends AbstractProvider<ExampleProductDetails> {
  /**
   * An example function that represents product specific action. This
   * function has to be implemented by all of the Providers that wants
   * to provide this product.
   *
   * The definition is up to Product Category Owner. So if some of the
   * arguments are not needed, they can be deleted. Like `agreement` or
   * `resource` can be deleted if they are unnecessary for the implementation.
   * @param agreement On-chain agreement data.
   * @param resource Resource information stored in the database.
   * @param additionalArgument Extra argument that related to the functionality (if needed).
   */
  abstract doSomething(
    agreement: Agreement,
    resource: Resource,
    additionalArgument: string
  ): Promise<{ stringResult: string; numberResult: number }>;

  async init(providerTag: string) {
    // Base class' `init` function must be called.
    await super.init(providerTag);

    /**
     * If your product has some functionalities/interactions (like "doSomething" method)
     * you can define "Pipe" routes to map the incoming requests from end users to the
     * corresponding methods.
     *
     * Pipe is a simple abstraction layer that allow the participants to communicate
     * HTTP like request-response style communication between them.
     *
     * Take a look at the example below:
     */

    /** Calls "doSomething" method. */
    this.route(PipeMethod.GET, "/do-something", async (req) => {
      /**
       * Validates the params/body of the request. If they are not valid
       * request will reply back to the user with a validation error message
       * and bad request code automatically.
       */
      const body = validateBodyOrParams(
        req.body,
        z.object({
          /** ID of the resource. */
          id: z.number(),

          /** Product Category address that the resource created in. */
          pc: addressSchema, // A pre-defined Zod schema for smart contract addresses.

          /** Additional argument for the method. */
          argument: z.string(),
        })
      );

      /**
       * Retrieve the resource from the database.
       *
       * IMPORTANT NOTE:
       * We need to authorize the user (to be sure that he is the actual owner
       * of the resource) before processing the request. To do this, we can
       * use `this.getResource`. This method tries to find the resource data
       * in the database based on the requester and throws proper errors if it cannot.
       * If the requester is not the owner of the resource, it won't be found.
       *
       * So even you don't need to use resource data, you need to call `this.getResource`
       * to be sure that user is actual owner of the resource.
       */
      const { agreement, resource } = await this.getResource(
        body.id,
        body.pc as Address,
        req.requester
      );

      // Call the actual method and store the results of it.
      const result = await this.doSomething(agreement, resource, body.argument);

      // Return the response with the results.
      return {
        code: PipeResponseCode.OK,
        body: result,
      };
    });
  }
}
