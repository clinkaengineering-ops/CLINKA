"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestRevisionSchema = exports.submitWorkSchema = exports.updateProgressSchema = exports.updateProjectSchema = exports.createProjectSchema = void 0;
const zod_1 = require("zod");
const fields_1 = require("../../utils/fields");
exports.createProjectSchema = zod_1.z.object({
    title: fields_1.projectTitleField,
    description: fields_1.projectDescriptionField,
    budget: fields_1.budgetField,
    serviceType: fields_1.serviceTypeField,
});
exports.updateProjectSchema = zod_1.z.object({
    title: fields_1.projectTitleField.optional(),
    description: fields_1.projectDescriptionField.optional(),
    budget: fields_1.budgetField.optional(),
    serviceType: fields_1.serviceTypeField.optional(),
});
exports.updateProgressSchema = zod_1.z.object({
    note: zod_1.z.string().min(1).max(2000),
});
exports.submitWorkSchema = zod_1.z.object({
    notes: zod_1.z.string().max(5000).optional(),
    links: zod_1.z
        .array(zod_1.z.object({
        url: zod_1.z.string().url().max(2000),
        name: zod_1.z.string().max(200).optional(),
    }))
        .max(10)
        .optional(),
});
exports.requestRevisionSchema = zod_1.z.object({
    note: zod_1.z.string().min(10).max(2000),
});
