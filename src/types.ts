import { DeploymentStatus } from "forest-js";

/**
 * The details gathered by the provider from the actual resource source.
 */
export interface ResourceDetails {
  status: DeploymentStatus;
  [key: string]: any;
}
