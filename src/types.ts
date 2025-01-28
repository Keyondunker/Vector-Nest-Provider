import { DeploymentStatus } from "@forest-protocols/sdk";
import { Address } from "viem";

/**
 * The base details that should be gathered by
 * the provider from the actual resource source.
 */
export type ResourceDetails = {
  status: DeploymentStatus;

  /**
   * Name of the resource. If it is undefined,
   * a random name will be assigned to the resource. */
  name?: string;
  [key: string]: any;
};

/**
 * Offer details from the database.
 */
export type OfferDetails = {
  id: number;
  details: any;
  deploymentParams: any;
  productCategory: Address;
};

/**
 * Resource details from the database.
 */
export type Resource = {
  id: number;
  name: string;
  deploymentStatus: DeploymentStatus;
  details: any;
  groupName: string;
  isActive: boolean;
  ownerAddress: Address;
  offer: {
    id: number;
    details: any;
    productCategory: Address;
    provider: {
      id: number;
      details: any;
      ownerAddress: Address;
    };
  };
};
