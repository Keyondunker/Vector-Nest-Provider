import {
  addressSchema,
  Agreement,
  PipeMethod,
  PipeResponseCode,
  validateBodyOrParams,
} from "@forest-protocols/sdk";
import { AbstractProvider } from "@/abstract/AbstractProvider";
import { ResourceDetails } from "@/types";
import { Resource } from "@/database/schema";
import { LocalStorage } from "@/database/LocalStorage";
import { NotFound } from "@/errors/NotFound";
import { z } from "zod";

/**
 * The details gathered by the provider from the resource source.
 * This is the "details" type of each resource and it is stored in the database.
 * @responsible Product Category Owner
 */
export type VectorDBDetails = ResourceDetails & {
  _credentials: any;
};

const conditionValueSchema = z
  .string()
  .or(z.number())
  .or(z.boolean())
  .or(
    z.object({
      operator: z.enum([
        "=",
        ">",
        "<",
        ">=",
        "<=",
        "!=",
        "LIKE",
        "like",
        "in",
        "IN",
      ]),
      value: z.any(),
    })
  );

const fieldSchema = z.object({
  name: z.string().min(1),
  type: z.enum([
    "String",
    "Integer32",
    "Integer64",
    "Float",
    "Vector",
    "Boolean",
  ]),
  properties: z
    .object({
      isPrimary: z.boolean().optional(),
      default: z.any().optional(),
      dimension: z.number().optional(),
    })
    .optional(),
});

type Field = z.infer<typeof fieldSchema>;

type ConditionValue = z.infer<typeof conditionValueSchema>;

/**
 * Base provider that defines what kind of actions needs to be implemented for the product category.
 * @responsible Product Category Owner
 */
export abstract class BaseVectorDBProvider extends AbstractProvider<VectorDBDetails> {
  /**
   * Retrieves the nearest neighbors for the given embeddings.
   * @param agreement On-chain agreement data.
   * @param resource Resource record of the agreement.
   * @param collection Collection name.
   * @param vectorField Vector field/column name.
   * @param embeddings Embeddings to be searched.
   * @param options Additional options for search process.
   */
  abstract search(
    agreement: Agreement,
    resource: Resource,
    collection: string,
    vectorField: string,
    embeddings: any[],
    options?: {
      /**
       * Total result count.
       */
      limit?: number;
    }
  ): Promise<any[]>;

  /**
   * Insert data into a collection
   * @param agreement On-chain agreement data.
   * @param resource Resource record of the agreement
   * @param collection Collection name.
   * @param data
   */
  abstract insertData(
    agreement: Agreement,
    resource: Resource,
    collection: string,
    data: { [field: string]: any }[]
  ): Promise<void>;

  /**
   * Deletes data from a collection
   * @param agreement On-chain agreement data.
   * @param resource Resource record of the agreement
   * @param collection Collection name.
   * @param conditions Conditions will be used to filter which records are going to be deleted.
   */
  abstract deleteData(
    agreement: Agreement,
    resource: Resource,
    collection: string,
    conditions: { [field: string]: ConditionValue }
  ): Promise<void>;

  /**
   * Creates a new collection.
   * @param agreement On-chain agreement data.
   * @param resource Resource record of the agreement.
   * @param name Name of the collection.
   * @param fields Columns of the collection.
   * @param options Additional option for the creation process
   */
  abstract createCollection(
    agreement: Agreement,
    resource: Resource,
    name: string,
    fields: Field[]
  ): Promise<void>;

  /**
   * Deletes a collection.
   * @param agreement On-chain agreement data.
   * @param resource Resource record of the agreement
   * @param name Name of the collection
   */
  abstract deleteCollection(
    agreement: Agreement,
    resource: Resource,
    name: string
  ): Promise<void>;

  async init(providerTag: string) {
    // Base class' `init` function must be called.
    await super.init(providerTag);

    /**
     * Validates the request body according to the given Zod schema.
     */
    const validateBody = <T>(body: any, schema: z.Schema<T>) => {
      const bodyValidation = schema.safeParse(body);
      if (bodyValidation.error) {
        throw new PipeError(PipeResponseCode.BAD_REQUEST, {
          message: "Validation error",
          body: bodyValidation.error.issues,
        });
      }

      return bodyValidation.data;
    };

    /**
     * Retrieves resource details from local storage and blockchain
     * and checks the existence of the resource.
     */
    const getResourceDetails = async (
      agreementId: number,
      requester: string
    ) => {
      const resource = await LocalStorage.instance.getResource(
        agreementId,
        requester
      );

      if (!resource || !resource.isActive) {
        throw new NotFound("Resource");
      }

      const agreement = await this.marketplace.getAgreement(agreementId);

      return { resource, agreement };
    };

    /**
     * Creates a new collection
     * method: POST
     * path: /collection
     * body:
     *  id: number -> ID of the resource.
     *  name: string -> Name of the collection.
     *  fields: Array<Field> -> Fields/columns of the collection.
     */
    this.pipe!.route(PipeMethod.POST, "/collection", async (req) => {
      const bodySchema = z.object({
        id: z.number(),
        name: z.string(),
        fields: z.array(fieldSchema).min(1),
      });
      const body = validateBody(req.body, bodySchema);
      const { resource, agreement } = await getResourceDetails(
        body.id,
        req.requester
      );

      await this.createCollection(agreement, resource, body.name, body.fields);

      return {
        code: PipeResponseCode.OK,
      };
    });

    /**
     * Deletes a collection
     * method: DELETE
     * path: /collection
     * body:
     *  id: number -> ID of the resource.
     *  name: string -> Name of the collection.
     */
    this.pipe!.route(PipeMethod.DELETE, "/collection", async (req) => {
      const bodySchema = z.object({
        id: z.number(),
        name: z.string(),
      });
      const body = validateBody(req.body, bodySchema);
      const { resource, agreement } = await getResourceDetails(
        body.id,
        req.requester
      );

      await this.deleteCollection(agreement, resource, body.name);

      return {
        code: PipeResponseCode.OK,
      };
    });

    /**
     * Gets the nearest neighbors for the given embeddings.
     * method: POST
     * path: /search
     * body:
     *  id: number -> ID of the resource.
     *  collection: string -> Name of the collection.
     *  vectorField: string -> Name of the vector column.
     *  embeddings: any[] -> Embeddings to be searched
     *  options?: {
     *    limit?: number -> Total result count.
     *    [option: string]: any -> Additional options if there is any
     *  } -> Additional options if there is any (mostly depends on the implementation).
     */
    this.pipe!.route(PipeMethod.POST, "/search", async (req) => {
      const bodySchema = z.object({
        id: z.number(),
        collection: z.string(),
        vectorField: z.string(),
        embeddings: z.array(z.any()).min(1),
        options: z
          .object({
            limit: z.number().optional(),
          })
          .optional(),
      });
      const body = validateBody(req.body, bodySchema);
      const { resource, agreement } = await getResourceDetails(
        body.id,
        req.requester
      );

      const result = await this.search(
        agreement,
        resource,
        body.collection,
        body.vectorField,
        body.embeddings,
        body.options
      );

      return {
        code: PipeResponseCode.OK,
        body: result,
      };
    });

    /**
     * Insert data into a collection
     * method: POST
     * path: /data
     * body:
     *  id: number -> ID of the resource.
     *  collection: string -> Name of the collection.
     *  data: { [column: string]: any }[] -> Data to be inserted
     */
    this.pipe!.route(PipeMethod.POST, "/data", async (req) => {
      const bodySchema = z.object({
        id: z.number(),
        collection: z.string(),
        data: z.array(z.record(z.string(), z.any())).min(1),
      });
      const body = validateBody(req.body, bodySchema);
      const { resource, agreement } = await getResourceDetails(
        body.id,
        req.requester
      );

      await this.insertData(agreement, resource, body.collection, body.data);

      return {
        code: PipeResponseCode.OK,
      };
    });

    /**
     * Delete data from a collection
     * method: DELETE
     * path: /data
     * body:
     *  id: number -> ID of the resource.
     *  collection: string -> Name of the collection.
     *  conditions: { [key: string]: ConditionValue } -> The records will select based on the conditions
     */
    this.pipe!.route(PipeMethod.DELETE, "/data", async (req) => {
      const bodySchema = z.object({
        id: z.number(),
        collection: z.string(),
        conditions: z.record(z.string(), conditionValueSchema),
      });
      const body = validateBody(req.body, bodySchema);
      const { resource, agreement } = await getResourceDetails(
        body.id,
        req.requester
      );

      await this.deleteData(
        agreement,
        resource,
        body.collection,
        body.conditions
      );

      // Return the response with the results.
      return {
        code: PipeResponseCode.OK,
      };
    });
  }
}
