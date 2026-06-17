"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageSchema = void 0;
const zod_1 = require("zod");
const optionalContentField = zod_1.z
    .string()
    .trim()
    .max(5000, "Message must be at most 5000 characters")
    .optional()
    .default("");
exports.sendMessageSchema = zod_1.z.object({
    content: optionalContentField,
});
