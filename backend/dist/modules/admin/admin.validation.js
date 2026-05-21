"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVerificationSchema = void 0;
const zod_1 = require("zod");
exports.updateVerificationSchema = zod_1.z.object({
    status: zod_1.z.enum(["APPROVED", "REJECTED"]),
});
