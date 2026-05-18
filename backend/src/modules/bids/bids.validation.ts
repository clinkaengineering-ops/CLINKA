import {z} from "zod";

export const createBidSchema = z.object({
    price : z.number().positive(),
    duration: z.string().min(1).max(20),
    description: z.string().min(1).max(500),
});


export type CreateBidInput = z.infer<typeof createBidSchema>;