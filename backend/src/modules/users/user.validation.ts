// backend/features/users/user.validation.ts
import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  // bio can be "" (user clearing their bio) — do not add .min(1) here
  bio: z.string().optional(),
});

export const addPortfolioItemSchema = z.object({
  imageUrl: z.string().url("Invalid image URL"),
  description: z.string().min(1, "Description is required"),
});

export type updateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddPortfolioItemInput = z.infer<typeof addPortfolioItemSchema>;
