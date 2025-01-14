import { createPublicClient, http } from "viem";
import { config } from "./config";
import { Marketplace } from "@forestprotocols/sdk";
import { privateKeyToAccount } from "viem/accounts";

export const rpcClient = createPublicClient({
  chain: config.CHAIN,
  transport: http(`http://${config.RPC_HOST}`),
});

export const providerAccount = privateKeyToAccount(
  config.PROVIDER_WALLET_PRIVATE_KEY as `0x${string}`
);

export const marketplace = Marketplace.createWithClient(
  rpcClient,
  providerAccount
);
