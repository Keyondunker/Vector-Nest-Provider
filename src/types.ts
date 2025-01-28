import { DeploymentStatus, ProviderDetails } from "@forest-protocols/sdk";
import { Address } from "viem";

/**
 * The base details that should be gathered by
 * the provider from the actual resource source.
 */
export type ResourceDetails = {
  status: DeploymentStatus;
  name: string;
  [key: string]: any;
};

export type OfferDetails = {
  id: number;
  details: any;
  deploymentParams: any;
  productCategory: Address;
};

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
