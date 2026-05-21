"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBidSchema = void 0;
const zod_1 = require("zod");
exports.createBidSchema = zod_1.z.object({
    price: zod_1.z.number().positive(),
    duration: zod_1.z.string().min(1).max(20),
    description: zod_1.z.string().min(1).max(500),
});
