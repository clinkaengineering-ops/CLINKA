"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPortfolioItemSchema = exports.searchQuerySchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
const fields_1 = require("../../utils/fields");
exports.updateProfileSchema = zod_1.z.object({
    name: fields_1.nameField.optional(),
    bio: fields_1.optionalBioField,
    coverImageUrl: zod_1.z
        .string()
        .url("Cover image must be a valid URL")
        .optional()
        .nullable(),
    nationality: zod_1.z.string().optional().nullable(),
});
exports.searchQuerySchema = zod_1.z.object({
    q: zod_1.z.string().trim().max(100, "Search query is too long").optional(),
    specialty: zod_1.z.enum(["CIVIL", "ARCHITECTURAL"]).optional(),
    nationality: zod_1.z.string().optional(),
});
exports.addPortfolioItemSchema = zod_1.z.object({
    imageUrl: zod_1.z.string().url("Invalid image URL"),
    description: zod_1.z
        .string()
        .trim()
        .min(3, "Description must be at least 3 characters")
        .max(500, "Description must be at most 500 characters"),
});
