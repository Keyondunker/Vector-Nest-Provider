import { z } from "zod";
import { red } from "ansis";
import { Chain } from "forest-js";

const configSchema = z.object({
  RPC_HOST: z.string().nonempty("Empty variable"),
  CHAIN: z
    .enum(["Local", "OptimismMainnet", "OptimismTestnet"])
    .default("Local")
    .transform((value) => Chain[value]),
  DATABASE_URL: z.string().nonempty("Empty variable"),
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
