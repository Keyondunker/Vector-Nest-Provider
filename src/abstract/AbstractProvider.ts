import { LocalStorage } from "@/database/LocalStorage";
import { ResourceDetails } from "@/types";
import { AbstractPipe, Agreement, PipeMethod } from "@forestprotocols/sdk";

/**
 * Abstract provider that needs to be extended by the Product Category Owner.
 * @responsible Admin
 */
export abstract class AbstractProvider<T extends ResourceDetails> {
  constructor() {
    if (this.init === AbstractProvider.prototype.init) {
      throw new Error(
        "super.init() must be called at the end of the init() method"
      );
    }
  }

  /**
   * Communication pipe to let users to interact with their resources.
   */
  abstract pipe: AbstractPipe;

  /**
   * Initializes the provider if it needs some async operation to be done before start to use it.
   */
  abstract init(): Promise<void> | void;

  /**
   * Creates the actual resource based
   * @param agreement On-chain agreement of the resource
   */
  abstract create(agreement: Agreement): Promise<T>;

  /**
   * Fetches/retrieves the details about the resource from e.g cloud/local database/resource.
   * @param agreement On-chain agreement of the resource
   */
  abstract getDetails(agreement: Agreement): Promise<T>;

  /**
   * Deletes the actual resource based
   * @param agreement On-chain agreement of the resource
   */
  abstract delete(agreement: Agreement): Promise<T>;
}
