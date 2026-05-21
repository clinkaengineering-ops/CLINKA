"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPortfolioItemSchema = exports.searchQuerySchema = exports.updateProfileSchema = void 0;
// backend/features/users/user.validation.ts
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name cannot be empty").optional(),
    bio: zod_1.z.string().optional(),
    coverImageUrl: zod_1.z.string().url().optional().nullable(),
});
exports.searchQuerySchema = zod_1.z.object({
    q: zod_1.z.string().optional(),
    specialty: zod_1.z.enum(["CIVIL", "ARCHITECTURAL"]).optional(),
});
exports.addPortfolioItemSchema = zod_1.z.object({
    imageUrl: zod_1.z.string().url("Invalid image URL"),
    description: zod_1.z.string().min(1, "Description is required"),
});
