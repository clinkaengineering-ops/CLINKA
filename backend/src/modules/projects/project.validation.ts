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
});

export const updateProjectSchema = z.object({
  title: projectTitleField.optional(),
  description: projectDescriptionField.optional(),
  budget: budgetField.optional(),
  serviceType: serviceTypeField.optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
