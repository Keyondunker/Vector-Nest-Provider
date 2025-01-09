import { MethodNotImplemented } from "@/errors/MethodNotImplemented";
import { ResourceDetails } from "@/types";
import { OnChainResource } from "forest-js";

/**
 * Abstract provider that needs to be extended by the Product Category Owner.
 * @responsible Admin
 */
export abstract class AbstractProvider<T extends ResourceDetails> {
  /**
   * Creates the actual resource based
   * @param onChainResource Information about the resource
   */
  abstract create(onChainResource: OnChainResource): Promise<T>;

  /**
   * Fetches/retrieves the details about the resource from e.g cloud/local database/resource.
   * @param onChainResource Information about the resource
   */
  abstract getDetails(onChainResource: OnChainResource): Promise<T>;

  /**
   * Deletes the actual resource based
   * @param onChainResource Information about the resource
   */
  abstract delete(onChainResource: OnChainResource): Promise<T>;

  /**
   * This function is called in an interval and checks if the end user still has some balance for the resource. If it doesn't, sends force delete request to blockchain and deletes the actual resource.
   * @param onChainResource Information about the resource
   */
  abstract checkBalance(onChainResource: OnChainResource): Promise<T>;

  /**
   * Consumes a service resource provided by this provider.
   * @param onChainResource Information about the service resource
   * @param args Arguments to use resource
   * @returns Consumed response from the service
   */
  async consume(onChainResource: OnChainResource, args?: any): Promise<any> {
    throw new MethodNotImplemented();
  }

  /**
   * Depends on the implementation, resets somethings the resource has.
   * @param onChainResource Information about the resource
   * @param args Arguments about what reset operation will be done (depends on the implementation)
   * @returns Information about what is reset
   */
  async reset(onChainResource: OnChainResource, args?: any): Promise<any> {
    throw new MethodNotImplemented();
  }
}
