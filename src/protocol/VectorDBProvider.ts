import { Agreement } from "@forest-protocols/sdk";
import {
  BaseVectorDBProvider,
  ConditionValue,
  Field,
  MetricType,
  VectorDBDetails,
} from "./base-provider";
import { DetailedOffer, Resource } from "../types";
import { Pinecone } from "@pinecone-database/pinecone";
import { DeploymentStatus } from "@forest-protocols/sdk";

export class VectorDBProvider extends BaseVectorDBProvider {
  private client: Pinecone;
  
  constructor() {
    super();
    this.client = new Pinecone();
  }

  async initialize(apiKey: string, environment: string) {
    this.client = new Pinecone({ apiKey });
  }

  async checkCallLimit(agreement: Agreement, offer: DetailedOffer): Promise<any> {
    throw new Error("Method not implemented");
  }

  async create(
    agreement: Agreement,
    offer: DetailedOffer
  ): Promise<VectorDBDetails> {
    const indexName = `index_${agreement.id}`.replace(/\s+/g, "_").toLowerCase();
    try {
      await this.client.createIndex({
        name: indexName,
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-west-2"
          }
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create index: ${error.message}`);
      }
      throw new Error('Failed to create index: Unknown error');
    }
    return {
      status: DeploymentStatus.Running,
      indexName,
      _credentials: {}
    };
  }

  async getDetails(
    agreement: Agreement,
    offer: DetailedOffer,
    resource: Resource
  ): Promise<VectorDBDetails> {
    try {
      const index = await this.client.describeIndex(resource.details.indexName);
      return {
        ...resource.details,
        status: resource.deploymentStatus,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get index details: ${error.message}`);
      }
      throw new Error('Failed to get index details: Unknown error');
    }
  }

  async delete(
    agreement: Agreement,
    offer: DetailedOffer,
    resource: Resource
  ): Promise<void> {
    try {
      await this.client.deleteIndex(resource.details.indexName);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete index: ${error.message}`);
      }
      throw new Error('Failed to delete index: Unknown error');
    }
  }

  async search(
    agreement: Agreement,
    resource: Resource,
    collection: string,
    vectorField: string,
    embeddings: number[],
    options?: { limit?: number; metricType?: MetricType }
  ): Promise<any[]> {
    try {
      const index = this.client.Index(resource.details.indexName);
      const result = await index.query({
        vector: embeddings,
        topK: options?.limit || 10,
        includeMetadata: true,
      });
      return result.matches || [];
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to search index: ${error.message}`);
      }
      throw new Error('Failed to search index: Unknown error');
    }
  }

  async insertData(
    agreement: Agreement,
    resource: Resource,
    collection: string,
    data: { [field: string]: any }[]
  ): Promise<void> {
    try {
      const index = this.client.Index(resource.details.indexName);
      await index.upsert(
        data.map((item) => ({
          id: item.id.toString(),
          values: item.embeddings,
          metadata: item.metadata,
        }))
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to insert data: ${error.message}`);
      }
      throw new Error('Failed to insert data: Unknown error');
    }
  }

  async deleteData(
    agreement: Agreement,
    resource: Resource,
    collection: string,
    conditions: { [field: string]: ConditionValue }
  ): Promise<void> {
    try {
      const index = this.client.Index(resource.details.indexName);
      const idsToDelete = Object.values(conditions).map(String);
      await index.deleteMany(idsToDelete);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete data: ${error.message}`);
      }
      throw new Error('Failed to delete data: Unknown error');
    }
  }

  async createCollection(
    agreement: Agreement,
    resource: Resource,
    name: string,
    fields: Field[]
  ): Promise<void> {
    try {
      await this.client.createIndex({
        name,
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-west-2"
          }
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create collection: ${error.message}`);
      }
      throw new Error('Failed to create collection: Unknown error');
    }
  }

  async deleteCollection(
    agreement: Agreement,
    resource: Resource,
    name: string
  ): Promise<void> {
    try {
      await this.client.deleteIndex(name);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete collection: ${error.message}`);
      }
      throw new Error('Failed to delete collection: Unknown error');
    }
  }
}
