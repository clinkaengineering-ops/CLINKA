"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupportTicketSchema = void 0;
const zod_1 = require("zod");
const fields_1 = require("../../utils/fields");
exports.createSupportTicketSchema = zod_1.z.object({
    name: fields_1.nameField,
    email: fields_1.emailField,
    subject: zod_1.z.string().trim().min(3).max(200),
    message: zod_1.z.string().trim().min(10).max(5000),
});
