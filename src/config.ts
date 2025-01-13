import { z } from "zod";
import { red } from "ansis";
import { anvil, optimism, optimismSepolia } from "viem/chains";

const configSchema = z.object({
  RPC_HOST: z.string().nonempty("Empty variable"),
  CHAIN: z
    .enum(["anvil", "optimism", "optimismSepolia"])
    .default("anvil")
    .transform((value) => ({ anvil, optimism, optimismSepolia }[value])),
  DATABASE_URL: z.string().nonempty("Empty variable"),
  LOG_LEVEL: z.enum(["error", "warning", "info", "debug"]).default("debug"),
  NODE_ENV: z.enum(["dev", "production"]).default("dev"),
  OPERATOR_WALLET_PRIVATE_KEY: z
    .string()
    .nonempty("Empty variable")
    .startsWith("0x", 'Private key must start with "0x" prefix'),
  PROVIDER_WALLET_PRIVATE_KEY: z
    .string()
    .nonempty("Empty variable")
    .startsWith("0x", 'Private key must start with "0x" prefix'),
});
const parsedEnv = configSchema.safeParse(process.env, {});

if (parsedEnv.error) {
  const formattedErrors = parsedEnv.error.format((err) => err.message);

  console.error(red("Errors while parsing environment variables:"));
  for (const [name, _errors] of Object.entries(formattedErrors)) {
    if (name === "_errors") {
      continue;
    }

    let formattedMessage = "";
    if (Array.isArray(_errors)) {
      formattedMessage = _errors.join(", ");
    } else {
      formattedMessage = _errors._errors.join(", ");
    }
    console.error(red(`  ${name}: ${formattedMessage}`));
  }
  process.exit(1);
}

export const config = parsedEnv.data;
