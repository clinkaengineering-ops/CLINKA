"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProjectSchema = exports.createProjectSchema = void 0;
const zod_1 = require("zod");
exports.createProjectSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).max(100),
    description: zod_1.z.string().min(1).max(500),
    budget: zod_1.z.number().positive(),
    serviceType: zod_1.z.enum(["DESIGN", "SUPERVISION", "REVIEW"]),
});
exports.updateProjectSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).max(100).optional(),
    description: zod_1.z.string().max(500).optional(),
    budget: zod_1.z.number().positive().optional(),
    serviceType: zod_1.z.enum(["DESIGN", "SUPERVISION", "REVIEW"]).optional(),
});
