import { z } from "zod";
import { red } from "ansis";
import { anvil, optimism, optimismSepolia } from "viem/chains";
import { readFileSync } from "fs";
import { join } from "path";
import { getForestContractAddress } from "@forest-protocols/sdk";
import { nonEmptyStringSchema, privateKeySchema } from "./validation/schemas";

function checkErrors(parseResult: z.SafeParseReturnType<any, any>) {
  if (parseResult.error) {
    const formattedErrors = parseResult.error.format((err) => err.message);

    console.error(red("Errors while parsing environment variables:"));
    for (const [name, _errors] of Object.entries(formattedErrors)) {
      if (name === "_errors") {
        continue;
      }

      let formattedMessage = "";
      if (Array.isArray(_errors)) {
        formattedMessage = _errors.join(", ");
      } else {
        formattedMessage = (_errors as any)._errors.join(", ");
      }
      console.error(red(`  ${name}: ${formattedMessage}`));
    }
    process.exit(1);
  }
}

const environmentSchema = z.object({
  DATABASE_URL: nonEmptyStringSchema,
  LOG_LEVEL: z.enum(["error", "warning", "info", "debug"]).default("debug"),
  NODE_ENV: z.enum(["dev", "production"]).default("dev"),
  RPC_HOST: z.string().nonempty("Empty variable"),
  CHAIN: z
    .enum(["anvil", "optimism", "optimismSepolia"])
    .default("anvil")
    .transform((value) => ({ anvil, optimism, optimismSepolia }[value])),
});
const providerSchema = z.object({
  name: nonEmptyStringSchema,
  description: nonEmptyStringSchema,
  homepage: nonEmptyStringSchema,
  providerWalletPrivateKey: privateKeySchema,
  billingWalletPrivateKey: privateKeySchema,
  operatorWalletPrivateKey: privateKeySchema,
});

/**
 * Parse environment variables
 */
const parsedEnv = environmentSchema.safeParse(process.env, {});
checkErrors(parsedEnv);

/**
 * Parse providers JSON file
 */
const providers: {
  [providerName: string]: z.infer<typeof providerSchema>;
} = {};

try {
  const fileContent = readFileSync(
    join(process.cwd(), "data/providers.json")
  ).toString();
  const rootObject = JSON.parse(fileContent);

  for (const [name, info] of Object.entries(rootObject)) {
    // Validate each provider object
    const provider = providerSchema.safeParse(info, {});
    checkErrors(provider);

    providers[name] = provider.data!;
  }
} catch (err: any) {
  console.error(red`Invalid providers JSON:`, err.message);
  process.exit(1);
}

export const config = {
  ...parsedEnv.data!,
  providers,
  contractAddress: getForestContractAddress(parsedEnv.data!.CHAIN),
};
