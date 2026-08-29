import { z } from "zod";

/** Accepts legacy absolute URLs and provider-independent `/uploads/...` paths. */
export const storedMediaPathSchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) => /^https?:\/\//i.test(value) || value.startsWith("/uploads/"),
    "Invalid media path",
  );

export const optionalStoredMediaPathSchema = storedMediaPathSchema.optional().nullable();
