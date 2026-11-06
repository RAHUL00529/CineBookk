import { z } from "zod";

import { isRealDate } from "./dates.js";
export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const idParams = z.object({ id: objectId });

export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .refine(isRealDate, "Not a real date");
