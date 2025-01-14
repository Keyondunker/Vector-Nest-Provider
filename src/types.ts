import { DeploymentStatus } from "@forest-protocols/sdk";

/**
 * The base details should be gathered by the provider from the actual resource source.
 */
export type ResourceDetails = {
  status: DeploymentStatus;
  [key: string]: any;
};
