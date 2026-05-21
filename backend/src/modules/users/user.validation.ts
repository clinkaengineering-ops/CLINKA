// backend/features/users/user.validation.ts
import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  bio: z.string().optional(),
  coverImageUrl: z.string().url().optional().nullable(),
});

export const searchQuerySchema = z.object({
  q: z.string().optional(),
  specialty: z.enum(["CIVIL", "ARCHITECTURAL"]).optional(),
});

export const addPortfolioItemSchema = z.object({
  imageUrl: z.string().url("Invalid image URL"),
  description: z.string().min(1, "Description is required"),
});

export type updateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddPortfolioItemInput = z.infer<typeof addPortfolioItemSchema>;
