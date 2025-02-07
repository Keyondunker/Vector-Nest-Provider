import { Agreement } from "@forest-protocols/sdk";
import {
  BaseVectorDBProvider,
  ConditionValue,
  Field,
  MetricType,
  VectorDBDetails,
} from "./base-provider";
import { DbOffer, Resource } from "@/types";

/**
 * The main class that implements provider specific actions.
 * @responsible Provider
 */
export class VectorDBProvider extends BaseVectorDBProvider {
  async search(
    agreement: Agreement,
    resource: Resource,
    collection: string,
    vectorField: string,
    embeddings: any[],
    options?: {
      limit?: number;
      metricType?: MetricType;
    }
  ): Promise<any[]> {
    /**
     * TODO: Implement how to retrieve closest embeddings.
     */
    throw new Error("Method not implemented.");
  }

  async insertData(
    agreement: Agreement,
    resource: Resource,
    collection: string,
    data: { [field: string]: any }[]
  ): Promise<void> {
    /**
     * TODO: Implement how to insert data into a collection.
     */
    throw new Error("Method not implemented.");
  }

  async deleteData(
    agreement: Agreement,
    resource: Resource,
    collection: string,
    conditions: { [field: string]: ConditionValue }
  ): Promise<void> {
    /**
     * TODO: Implement how to delete data from a collection.
     */
    throw new Error("Method not implemented.");
  }

  async createCollection(
    agreement: Agreement,
    resource: Resource,
    name: string,
    fields: Field[]
  ): Promise<void> {
    /**
     * TODO: Implement how to create a collection.
     */
    throw new Error("Method not implemented.");
  }

  async deleteCollection(
    agreement: Agreement,
    resource: Resource,
    name: string
  ): Promise<void> {
    /**
     * TODO: Implement how to delete a collection.
     */
    throw new Error("Method not implemented.");
  }

  async create(agreement: Agreement, offer: DbOffer): Promise<VectorDBDetails> {
    /**
     * TODO: Implement how the resource will be created.
     */
    // If there is no additional action need for the deletion, you can
    // just leave this method as empty.
    throw new Error("Method not implemented.");
  }

  async getDetails(
    agreement: Agreement,
    resource: Resource
  ): Promise<VectorDBDetails> {
    /**
     * TODO: Implement how the details retrieved from the resource source.
     */

    // If there is no details, you can just return the existing details;
    // return resource.details;
    throw new Error("Method not implemented.");
  }

  async delete(
    agreement: Agreement,
    resource: Resource
  ): Promise<VectorDBDetails> {
    /**
     * TODO: Implement how the resource will be deleted.
     */

    // If there is no additional action need for the deletion, you can
    // just leave this method as empty.
    throw new Error("Method not implemented.");
  }
}
