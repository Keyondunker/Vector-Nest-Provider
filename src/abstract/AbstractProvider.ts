import { config } from "@/config";
import { LocalStorage } from "@/database/LocalStorage";
import { ResourceDetails } from "@/types";
import {
  Agreement,
  PipeMethod,
  PipeResponseCode,
  XMTPPipe,
} from "@forestprotocols/sdk";
import { Address } from "viem";

/**
 * Abstract provider that needs to be extended by the Product Category Owner.
 * @responsible Admin
 */
export abstract class AbstractProvider<T extends ResourceDetails> {
  /**
   * Communication pipe to let users to interact with their resources.
   */
  pipe = new XMTPPipe(config.OPERATOR_WALLET_PRIVATE_KEY as Address);

  /**
   * Initializes the provider if it needs some async operation to be done before start to use it.
   */
  async init(): Promise<void> {
    // Init pipe
    await this.pipe.init({
      chain: config.CHAIN,
      rpcHost: config.RPC_HOST,
      env: "dev",
    });

    // A shorthand for global local storage
    const localStorage = LocalStorage.instance;

    /**
     * Setup pipe routes to retrieve data from provider
     */

    // Retrieve details about provider itself
    this.pipe.route(PipeMethod.GET, "/details", async (req) => {
      const details = await localStorage.getProviderDetails();

      return {
        code: PipeResponseCode.OK,
        body: details,
      };
    });
  }

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
