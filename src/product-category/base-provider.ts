import {
  Agreement,
  PipeError,
  PipeMethod,
  PipeResponseCode,
} from "@forest-protocols/sdk";
import { AbstractProvider } from "@/abstract/AbstractProvider";
import { ResourceDetails } from "@/types";
import { Resource } from "@/database/schema";
import { DB } from "@/database/DB";
import { NotFound } from "@/errors/NotFound";

/**
 * The details gathered by the provider from the resource source.
 * @responsible Product Category Owner
 */
export type PostgreSQLDatabaseDetails = ResourceDetails & {
  Connection_String?: string;
  Username?: string;
  Password?: string;
  Port?: string;
  Database_Name?: string;
  Hostname?: string;
};

/**
 * Base provider that defines what kind of actions needs to be implemented for the product category.
 * @responsible Product Category Owner
 */
export abstract class BasePostgreSQLDatabaseProvider extends AbstractProvider<PostgreSQLDatabaseDetails> {
  /**
   * Resets the credentials of admin user's credentials
   * @param agreement On-chain agreement data.
   */
  abstract resetCredentials(
    agreement: Agreement,
    resource: Resource
  ): Promise<any>;

  /**
   * Runs an SQL query and returns the results.
   * @param agreement On-chain agreement data.
   * @param resource Resource record of the agreement
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
     * Resets the credentials of the base resource
     * method: POST
     * path: /reset
     * body:
     *  id: number -> ID of the resource
     */
    this.pipe!.route(PipeMethod.POST, "/reset", async (req) => {
      if (!req.body?.id) {
        throw new PipeError(PipeResponseCode.NOT_FOUND, {
          message: 'Missing "id" param',
        });
      }

      const agreementId = req.body.id;
      const resource = await DB.instance.getResource(
        agreementId,
        req.requester
      );

      if (!resource || !resource.isActive) {
        throw new NotFound("Resource");
      }

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
     * Executes an SQL query in the database
     * method: POST
     * path: /query
     * body:
     *  id: number -> ID of the resource
     *  sql: string -> The SQL query that is going to be executed
     */
    this.pipe!.route(PipeMethod.POST, "/query", async (req) => {
      if (!req.body?.id) {
        throw new PipeError(PipeResponseCode.NOT_FOUND, {
          message: 'Missing "id" param',
        });
      }

      const agreementId = req.body.id;
      const resource = await DB.instance.getResource(
        agreementId,
        req.requester
      );

      if (!resource || !resource.isActive) {
        throw new NotFound("Resource");
      }

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
