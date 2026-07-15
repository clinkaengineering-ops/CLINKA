import { z } from "zod";
import {
  budgetField,
  projectDescriptionField,
  projectTitleField,
  serviceTypeField,
} from "../../utils/fields";

export const createProjectSchema = z.object({
  title: projectTitleField,
  description: projectDescriptionField,
  budget: budgetField,
  serviceType: serviceTypeField,
  inviteEngineerId: z.number().int().positive().optional(),
});

export const updateProjectSchema = z.object({
  title: projectTitleField.optional(),
  description: projectDescriptionField.optional(),
  budget: budgetField.optional(),
  serviceType: serviceTypeField.optional(),
  status: z.enum(["OPEN", "CLOSED"]).optional(),
});

export const updateProgressSchema = z.object({
  note: z.string().min(1).max(2000),
});

export const submitWorkSchema = z.object({
  notes: z.string().max(5000).optional(),
  links: z
    .array(
      z.object({
        url: z.string().url().max(2000),
        name: z.string().max(200).optional(),
      }),
    )
    .max(10)
    .optional(),
});

export const requestRevisionSchema = z.object({
  note: z.string().min(10).max(2000),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
export type SubmitWorkInput = z.infer<typeof submitWorkSchema>;
export type RequestRevisionInput = z.infer<typeof requestRevisionSchema>;
