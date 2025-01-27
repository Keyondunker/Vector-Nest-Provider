import { z } from "zod";
import { red } from "ansis";
import { readFileSync } from "fs";
import { join } from "path";
import {
  getForestRegistryAddress,
  privateKeySchema,
} from "@forest-protocols/sdk";
import { nonEmptyStringSchema } from "./validation/schemas";
import { fromError } from "zod-validation-error";

function parseEnv() {
  const environmentSchema = z.object({
    DATABASE_URL: nonEmptyStringSchema,
    LOG_LEVEL: z.enum(["error", "warning", "info", "debug"]).default("debug"),
    NODE_ENV: z.enum(["dev", "production"]).default("dev"),
    RPC_HOST: nonEmptyStringSchema,
    CHAIN: z.enum(["anvil", "optimism", "optimism-sepolia"]).default("anvil"),
  });
  const parsedEnv = environmentSchema.safeParse(process.env, {});

  if (parsedEnv.error) {
    console.error(red(fromError(parsedEnv).toString()));
    process.exit(1);
  }

  return parsedEnv.data;
}

function parseProviders() {
  const providerSchema = z.object({
    details: z.object({
      name: nonEmptyStringSchema,
      description: nonEmptyStringSchema,
      homepage: nonEmptyStringSchema,
    }),
    providerWalletPrivateKey: privateKeySchema,
    billingWalletPrivateKey: privateKeySchema,
    operatorWalletPrivateKey: privateKeySchema,
  });

  const providers: {
    [providerTag: string]: z.infer<typeof providerSchema>;
  } = {};

  try {
    const fileContent = readFileSync(
      join(process.cwd(), "data/providers.json")
    ).toString();
    const rootObject = JSON.parse(fileContent);

    for (const [name, info] of Object.entries(rootObject)) {
      // Validate each provider object
      const provider = providerSchema.safeParse(info, {});
      if (provider.error) {
        console.error(red(fromError(provider.error)).toString());
        process.exit(1);
      }

      providers[name] = provider.data!;
    }
  } catch (err: any) {
    console.error(red("Invalid providers.json file:"), err.message);
    process.exit(1);
  }

  return providers;
}

const env = parseEnv();
const providers = parseProviders();

export const config = {
  ...env,
  providers,
  contractAddress: getForestRegistryAddress(env.CHAIN),
};
