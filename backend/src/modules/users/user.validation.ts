import {z} from "zod";

export const updateProfileSchema = z.object({
    name : z.string().optional(),
    bio : z.string().optional(),
})

export const addPortfolioItemSchema = z.object({
    imageUrl: z.string().url("Invalid image URL"),
    description: z.string().min(1, "Description is required"),
})



export type updateProfileInput = z.infer<typeof updateProfileSchema>
export type AddPortfolioItemInput = z.infer<typeof addPortfolioItemSchema>