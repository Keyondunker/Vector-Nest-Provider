import { createPublicClient, http } from "viem";
import { config } from "./config";

export const rpcClient = createPublicClient({
  chain: config.CHAIN,
  transport: http(`http://${config.RPC_HOST}`),
});
