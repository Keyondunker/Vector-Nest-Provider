import { rpcClient } from "@/clients";
import { config } from "@/config";
import { DB } from "@/database/DB";
import { DbOffer, Resource } from "@/database/schema";
import { NotFound } from "@/errors/NotFound";
import { logger } from "@/logger";
import { ResourceDetails } from "@/types";
import { Provider } from "@forest-protocols/sdk";
import {
  Agreement,
  PipeError,
  PipeMethod,
  PipeResponseCode,
  ProductCategory,
  Registry,
  XMTPPipe,
} from "@forest-protocols/sdk";
import { red } from "ansis";
import { Account, Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { z } from "zod";

/**
 * Abstract provider that needs to be extended by the Product Category Owner.
 * @responsible Admin
 */
export abstract class AbstractProvider<
  T extends ResourceDetails = ResourceDetails
> {
  /**
   * Communication pipe to let users to interact with their resources.
   */
  pipe!: XMTPPipe;

  registry!: Registry;

  productCategories: { [address: string]: ProductCategory } = {};

  account!: Account;

  info!: Provider;

  /**
   * Initializes the provider if it needs some async operation to be done before start to use it.
   */
  async init(providerTag: string): Promise<void> {
    const providerInfo = config.providers[providerTag];

    if (!providerInfo) {
      logger.error(
        `Provider details not found for provider tag "${providerTag}". Please check your data/providers.json and providers list in src/index.ts`
      );
      process.exit(1);
    }

    // Initialize pipe
    this.pipe = new XMTPPipe(providerInfo.operatorWalletPrivateKey as Address);

    // Disable console.info to get rid out of "XMTP dev" warning
    const consoleInfo = console.info;
    console.info = () => {};

    // Use dev env only for local and sepolia chains
    await this.pipe.init(config.CHAIN === "optimism" ? "production" : "dev");

    // Revert back console.info
    console.info = consoleInfo;

    // Setup provider account
    this.account = privateKeyToAccount(
      providerInfo.providerWalletPrivateKey as Address
    );

    // Initialize Forest Protocols clients
    this.registry = Registry.createWithClient(rpcClient, this.account);

    const provider = await this.registry.getActor(this.account.address);
    if (!provider) {
      logger.error(
        red(
          `Provider address "${this.account.address}" is not registered in the protocol. Please register the provider and try again.`
        )
      );
      process.exit(1);
    }

    this.info = provider;

    const productCategories = await this.registry.getRegisteredPCsOfProvider(
      provider.id
    );

    for (const pcAddress of productCategories) {
      this.productCategories[pcAddress.toLowerCase()] =
        ProductCategory.createWithClient(
          rpcClient,
          pcAddress as Address,
          this.account
        );
    }

    // A shorthand for global local storage
    const localStorage = DB.instance;

    // Setup pipe standard pipe routes

    /**
     * Retrieve all of the offers that made by the provider.
     * method: GET
     * path: /offers
     */
    this.pipe.route(PipeMethod.GET, "/offers", async (req) => {
      return {
        code: PipeResponseCode.OK,
        body: await localStorage.getOffers(),
      };
    });

    /**
     * Retrieve details about provider itself.
     * method: GET
     * path: /details
     */
    this.pipe.route(PipeMethod.GET, "/details", async (req) => {
      const details = await localStorage.getProviderDetails(
        this.account!.address
      );

      return {
        code: PipeResponseCode.OK,
        body: details,
      };
    });

    /**
     * Retrieve details (e.g credentials) of a resource.
     * method: GET
     * path: /resource
     * params:
     *  id: number -> ID of the resource
     */
    this.pipe.route(PipeMethod.GET, "/resource", async (req) => {
      const paramsSchema = z.object({
        id: z.number(),
      });
      const paramsValidation = paramsSchema.safeParse(req.params);
      const params = paramsValidation.data!;

      if (paramsValidation.error) {
        throw new PipeError(PipeResponseCode.BAD_REQUEST, {
          message: "Validation error",
          errors: paramsValidation.error.issues,
        });
      }

      // NOTE:
      // Since XMTP has its own authentication layer, we don't need to worry about
      // if this request really sent by the owner of the resource. So if the sender is
      // different from owner of the resource, basically the resource won't be found because
      // we are looking to the local database with an agreement id + requester address pair.
      const resource = await localStorage.getResource(params.id, req.requester);

      if (!resource) {
        throw new NotFound(`Resource ${params.id}`);
      }

      // Filter fields that starts with underscore.
      const details: any = {};
      for (const [name, value] of Object.entries(resource.details)) {
        if (name.startsWith("_")) {
          continue;
        }

        details[name] = value;
      }

      return {
        code: PipeResponseCode.OK,
        body: {
          ...resource,
          details, // Use filtered details
        },
      };
    });
  }

  /**
   * Creates the actual resource based. Called based on the blockchain agreement creation event.
   * @param agreement On-chain agreement of the resource
   * @param offer Offer details stored in the database
   */
  abstract create(agreement: Agreement, offer: DbOffer): Promise<T>;

  /**
   * Fetches/retrieves the details about the resource from the resource itself
   * @param agreement On-chain agreement of the resource
   * @param resource The details stored inside the database
   */
  abstract getDetails(agreement: Agreement, resource: Resource): Promise<T>;

  /**
   * Deletes the actual resource based. Called based on the blockchain agreement closing event.
   * @param agreement On-chain agreement of the resource
   * @param resource The details stored inside the database
   */
  abstract delete(agreement: Agreement, resource: Resource): Promise<T>;
}
