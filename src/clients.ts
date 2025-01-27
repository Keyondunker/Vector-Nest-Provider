import { createPublicClient, http } from "viem";
import { config } from "./config";
import { forestChainToViemChain } from "@forest-protocols/sdk";

export const rpcClient = createPublicClient({
  chain: forestChainToViemChain(config.CHAIN),
  transport: http(`http://${config.RPC_HOST}`),
});
