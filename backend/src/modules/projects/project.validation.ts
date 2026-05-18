import { z } from "zod";

export const createProjectSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(1).max(500),
  budget: z.number().positive(),
  serviceType: z.enum(["DESIGN", "SUPERVISION", "REVIEW"]),
});

export const updateProjectSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  budget: z.number().positive().optional(),
  serviceType: z.enum(["DESIGN", "SUPERVISION", "REVIEW"]).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
