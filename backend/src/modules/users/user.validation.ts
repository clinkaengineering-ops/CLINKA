import { z } from "zod";
import { nameField, optionalBioField } from "../../utils/fields";

export const updateProfileSchema = z.object({
  name: nameField.optional(),
  bio: optionalBioField,
  coverImageUrl: z
    .string()
    .url("Cover image must be a valid URL")
    .optional()
    .nullable(),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().max(100, "Search query is too long").optional(),
  specialty: z.enum(["CIVIL", "ARCHITECTURAL"]).optional(),
});

export const addPortfolioItemSchema = z.object({
  imageUrl: z.string().url("Invalid image URL"),
  description: z
    .string()
    .trim()
    .min(3, "Description must be at least 3 characters")
    .max(500, "Description must be at most 500 characters"),
});

export type updateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddPortfolioItemInput = z.infer<typeof addPortfolioItemSchema>;
