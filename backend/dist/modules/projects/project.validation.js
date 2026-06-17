"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProjectSchema = exports.createProjectSchema = void 0;
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
