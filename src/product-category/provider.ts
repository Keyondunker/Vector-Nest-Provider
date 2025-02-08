import { Agreement } from "@forest-protocols/sdk";
import {
  BaseExampleProductProvider,
  ExampleProductDetails,
} from "./base-provider";
import { DetailedOffer, Resource } from "@/types";

/**
 * The main class that implements provider specific actions.
 * @responsible Provider
 */
export class MainProviderImplementation extends BaseExampleProductProvider {
  async doSomething(
    agreement: Agreement,
    resource: Resource,
    additionalArgument: string
  ): Promise<{ stringResult: string; numberResult: number }> {
    /**
     * TODO: Implement the logic to achieve purpose of this function.
     */

    // An example;

    // Some important logic....

    return {
      numberResult: agreement.id,
      stringResult: `${resource.name}-${additionalArgument}`,
    };
  }

  async create(
    agreement: Agreement,
    offer: DetailedOffer
  ): Promise<ExampleProductDetails> {
    /**
     * TODO: Implement how the resource will be created.
     */
    // If there is no additional action need for creation, you can
    // just leave this method as empty and return mandatory details:
    /*  return {
      status: DeploymentStatus.Running,
      _examplePrivateDetailWontSentToUser: "fasfa",
      Example_Detail: 42,
    }; */

    throw new Error("Method not implemented.");
  }

  async getDetails(
    agreement: Agreement,
    offer: DetailedOffer,
    resource: Resource
  ): Promise<ExampleProductDetails> {
    /**
     * TODO: Implement how the details retrieved from the resource source.
     */
    // If there is no details, you can just return the existing ones;
    /* return {
      ...resource.details,
      status: resource.deploymentStatus,
    }; */
    throw new Error("Method not implemented.");
  }

  async delete(
    agreement: Agreement,
    offer: DetailedOffer,
    resource: Resource
  ): Promise<ExampleProductDetails> {
    /**
     * TODO: Implement how the resource will be deleted.
     */

    // If there is no additional action need for the deletion, you can
    // just leave this method as empty and return following:
    /* return {
      ...resource.details,
      status: resource.deploymentStatus,
    }; */
    throw new Error("Method not implemented.");
  }
}
