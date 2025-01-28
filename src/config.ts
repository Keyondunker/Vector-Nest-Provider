import { z } from "zod";
import { red } from "ansis";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import {
  addressSchema,
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

function parseProductCategories() {
  const pcSchema = z.object({
    address: addressSchema.transform((value) => value.toLowerCase()),
    name: z.string(),
    softwareStack: z.string(),
    version: z.string(),
    tests: z.array(z.any()), // TODO: Define object shape
    resourceParams: z.array(
      z.object({
        name: z.string(),
        unit: z.string(),
        isFilterable: z.boolean(),
        isPrimary: z.boolean(),
        priority: z.number().positive(),
      })
    ),
  });

  const productCategories: {
    [address: string]: z.infer<typeof pcSchema>;
  } = {};

  try {
    const basePath = join(process.cwd(), "data/product-categories");
    const files = readdirSync(basePath, { recursive: true });
    for (const file of files) {
      if (!file.toString().endsWith(".json")) {
        continue;
      }

      const content = readFileSync(join(basePath, file.toString())).toString();
      const rawObject = JSON.parse(content);
      const validation = pcSchema.safeParse(rawObject);

      if (validation.error) {
        console.error(red(fromError(validation.error)).toString());
        process.exit(1);
      }

      const obj = validation.data;
      productCategories[obj.address] = obj;
    }
  } catch (err: any) {
    console.error(
      red(`Error while reading product categories: ${err.message}`)
    );
    process.exit(1);
  }

  return productCategories;
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
    console.error(red(`Invalid providers.json file: ${err.message}`));
    process.exit(1);
  }

  return providers;
}

function parseOffers() {
  const offerSchema = z.object({
    id: z.number(),
    productCategory: addressSchema.transform((value) => value.toLowerCase()),
    deploymentParams: z.any(),
    details: z.object({
      name: nonEmptyStringSchema,
      resourceParams: z.array(
        z.object({
          name: z.string(),
          value: z.any(),
        })
      ),
    }),
  });

  const offers: {
    [pcAddress: string]: z.infer<typeof offerSchema>[];
  } = {};

  try {
    const basePath = join(process.cwd(), "data/offers");
    const files = readdirSync(basePath, { recursive: true });
    for (const file of files) {
      if (!file.toString().endsWith(".json")) {
        continue;
      }

      const content = readFileSync(join(basePath, file.toString())).toString();
      const rawObject = JSON.parse(content);
      const validation = offerSchema.safeParse(rawObject);

      if (validation.error) {
        console.error(red(fromError(validation.error)).toString());
        process.exit(1);
      }

      const offer = validation.data;

      if (!offers[offer.productCategory]) {
        offers[offer.productCategory] = [];
      }
      offers[offer.productCategory].push(offer);
    }
  } catch (err: any) {
    console.error(red(`Error while reading offers: ${err.message}`));
    process.exit(1);
  }

  return offers;
}

const env = parseEnv();

export const config = {
  ...env,
  providers: parseProviders(),
  productCategories: parseProductCategories(),
  offers: parseOffers(),
  registryAddress: getForestRegistryAddress(env.CHAIN),
};
