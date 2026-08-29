import { z } from "zod";
import { nameField, optionalBioField } from "../../utils/fields";
import { optionalStoredMediaPathSchema, storedMediaPathSchema } from "../../utils/mediaUrl";

export const updateProfileSchema = z.object({
  name: nameField.optional(),
  bio: optionalBioField,
  coverImageUrl: optionalStoredMediaPathSchema,
  nationality: z.string().optional().nullable(),
  
  // New Professional Profile fields
  coverBannerUrl: optionalStoredMediaPathSchema,
  professionalHeadline: z.string().max(100).optional().nullable(),
  currentPosition: z.string().max(100).optional().nullable(),
  currentCompany: z.string().max(100).optional().nullable(),
  about: z.string().max(2000).optional().nullable(),
  yearsOfExperience: z.number().int().min(0).max(100).optional().nullable(),
  
  hourlyRateUSD: z.number().min(0).optional().nullable(),
  startingProjectPriceUSD: z.number().min(0).optional().nullable(),
  
  availabilityStatus: z.enum([
    "AVAILABLE_NOW", 
    "OPEN_TO_WORK", 
    "AVAILABLE_NEXT_WEEK", 
    "AVAILABLE_NEXT_MONTH", 
    "UNAVAILABLE"
  ]).optional().nullable(),
  
  expectedStartDate: z.string().datetime().optional().nullable(),
  
  linkedinUrl: z.string().url().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  
  acceptsInvitations: z.boolean().optional(),
  acceptsDirectMessages: z.boolean().optional(),
  acceptsConsultations: z.boolean().optional(),

  // Relational updates
  specializationIds: z.array(z.number().int()).optional(),
  skillIds: z.array(z.number().int()).optional(),
  serviceAreaIds: z.array(z.number().int()).optional(),
  languages: z.array(z.object({
    languageId: z.number().int(),
    proficiency: z.string().optional()
  })).optional(),
  certifications: z.array(z.object({
    certificationId: z.number().int(),
    year: z.number().int().optional()
  })).optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  specialty: z.enum(["CIVIL", "ARCHITECTURAL"]).optional(), // legacy
  nationality: z.string().optional(), // legacy
  disciplineId: z.coerce.number().int().optional(),
  skillIds: z.union([z.string(), z.array(z.string())]).optional(), // can be comma separated or array
  serviceAreaId: z.coerce.number().int().optional(),
  hourlyRateMax: z.coerce.number().min(0).optional(),
  startingPriceMax: z.coerce.number().min(0).optional(),
  availabilityStatus: z.enum(["AVAILABLE_NOW", "OPEN_TO_WORK", "AVAILABLE_NEXT_WEEK", "AVAILABLE_NEXT_MONTH", "UNAVAILABLE"]).optional(),
  sortBy: z.enum(["RELEVANCE", "HIGHEST_RATED", "MOST_EXPERIENCED", "NEWEST", "MOST_REVIEWED", "MOST_COMPLETED_PROJECTS", "LOWEST_HOURLY_RATE", "LOWEST_STARTING_BUDGET"]).default("RELEVANCE"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const addPortfolioItemSchema = z.object({
  title: z.string().trim().max(100).optional(),
  description: z.string().trim().min(3).max(2000),
  coverImageUrl: storedMediaPathSchema.optional(),
  disciplineId: z.coerce.number().int().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  clientName: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).optional(),
  skillIds: z.array(z.coerce.number().int()).optional(),
  files: z.array(z.object({
    fileUrl: storedMediaPathSchema,
    fileType: z.enum(["IMAGE", "PDF", "LINK"]),
    title: z.string().max(100).optional()
  })).optional()
});

export type updateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddPortfolioItemInput = z.infer<typeof addPortfolioItemSchema>;
