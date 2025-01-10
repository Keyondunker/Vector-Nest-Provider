import { ResourceDetails } from "@/types";

/**
 * The details gathered by the provider from the resource source.
 * @responsible Product Category Owner
 */
export interface BaseResourceDetails extends ResourceDetails {
  httpAddress: string;
  authKey: string;
}
