import { z } from "zod";

export const nonEmptyStringSchema = z.string().nonempty("Shouldn't be empty");
export const privateKeySchema = nonEmptyStringSchema.startsWith(
  "0x",
  "Private key must start with '0x'"
);
