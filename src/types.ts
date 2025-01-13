import { DeploymentStatus } from "forestprotocol";

/**
 * The base details should be gathered by the provider from the actual resource source.
 */
export interface ResourceDetails {
  status: DeploymentStatus;
  [key: string]: any;
}
