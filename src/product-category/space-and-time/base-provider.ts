import { Agreement, PipeMethod, PipeResponseCode } from "@forest-protocols/sdk";
import { AbstractProvider } from "@/abstract/AbstractProvider";
import { ResourceDetails } from "@/types";
import { Resource } from "@/database/schema";
import { LocalStorage } from "@/database/LocalStorage";

/**
 * The details gathered by the provider from the resource source.
 * @responsible Product Category Owner
 */
export interface SxTResourceDetails extends ResourceDetails {
  endpoint: string;
  apiKey: string;
}

/**
 * Base provider that defines what kind of actions needs to be implemented for the product category.
 * @responsible Product Category Owner
 */
export abstract class BaseSxTProvider extends AbstractProvider<SxTResourceDetails> {
  /**
   * Resets the credentials of the SQL endpoint.
   * @param agreement On-chain agreement data.
   */
  abstract resetCredentials(
    agreement: Agreement,
    resource: Resource
  ): Promise<any>;

  /**
   * Runs an SQL query and returns the results.
   * @param agreement On-chain agreement data.
   * @param requester Caller of the function
   * @param query SQL query
   */
  abstract sqlQuery(
    agreement: Agreement,
    resource: Resource,
    query: string
  ): Promise<any[]>;

  async init(providerTag: string) {
    await super.init(providerTag);

    /**
     * Resets the credentials of a resource
     * method: GET
     * path: /reset
     * params:
     *  id: number -> ID of the resource
     */
    this.pipe!.route(PipeMethod.GET, "/reset", async (req) => {
      const agreementId = req.params!.id; // NOTE: Before using the params, be sure they are exists
      const resource = await LocalStorage.instance.getResource(
        agreementId,
        req.requester
      );
      const agreement = await this.marketplace.getAgreement(agreementId);
      const newCredentials = await this.resetCredentials(agreement, resource);

      return {
        code: PipeResponseCode.OK,
        body: {
          credentials: newCredentials,
        },
      };
    });

    /**
     * Makes an SQL query
     * method: POST
     * path: /query
     * params:
     *  id: number -> ID of the resource
     * body:
     *  sql: string -> The SQL query that is going to be executed
     */
    this.pipe!.route(PipeMethod.POST, "/query", async (req) => {
      const agreementId = req.params!.id;
      const resource = await LocalStorage.instance.getResource(
        agreementId,
        req.requester
      );
      const agreement = await this.marketplace.getAgreement(agreementId);
      const queryData = await this.sqlQuery(agreement, resource, req.body!.sql);

      return {
        code: PipeResponseCode.OK,
        body: {
          results: queryData,
        },
      };
    });
  }
}
