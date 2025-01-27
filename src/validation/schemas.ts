import { z } from "zod";

export const nonEmptyStringSchema = z.string().nonempty("Shouldn't be empty");
