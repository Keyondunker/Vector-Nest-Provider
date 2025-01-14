import { ResourceDetails } from "@forestprotocols/sdk";

/**
 * The details gathered by the provider from the resource source.
 * @responsible Product Category Owner
 */
export interface BaseResourceDetails extends ResourceDetails {
  httpAddress: string;
  authKey: string;
}
