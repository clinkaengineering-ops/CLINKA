"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWithdrawalRequestSchema = exports.updateSupportTicketSchema = exports.updatePaymentOverrideSchema = exports.updateSettingsSchema = exports.updateProjectSchema = exports.updateProfileSchema = exports.banUserSchema = exports.updateVerificationSchema = void 0;
const zod_1 = require("zod");
exports.updateVerificationSchema = zod_1.z.object({
    status: zod_1.z.enum(["APPROVED", "REJECTED"], {
        error: "Status must be APPROVED or REJECTED",
    }),
});
exports.banUserSchema = zod_1.z.object({
    note: zod_1.z.string().trim().max(500).optional(),
});
exports.updateProfileSchema = zod_1.z.object({
    specialty: zod_1.z.enum(["CIVIL", "ARCHITECTURAL"]).optional(),
    bio: zod_1.z.string().trim().max(1000).optional(),
});
exports.updateProjectSchema = zod_1.z.object({
    status: zod_1.z.enum(["OPEN", "IN_PROGRESS", "AWAITING_APPROVAL", "SUBMITTED_FOR_REVIEW", "REVISION_REQUESTED", "COMPLETED", "CANCELLED"]).optional(),
    isFlagged: zod_1.z.boolean().optional(),
});
exports.updateSettingsSchema = zod_1.z.object({
    platformFeePercent: zod_1.z.number().min(0).max(100),
});
exports.updatePaymentOverrideSchema = zod_1.z.object({
    status: zod_1.z.enum(["RELEASED", "REFUNDED"]),
});
exports.updateSupportTicketSchema = zod_1.z.object({
    status: zod_1.z.enum(["SOLVED", "UNRESOLVED"]),
    solution: zod_1.z.string().trim().min(1).max(2000),
});
exports.updateWithdrawalRequestSchema = zod_1.z.object({
    status: zod_1.z.enum(["PENDING", "PROCESSING", "COMPLETED", "REJECTED"]),
    adminNotes: zod_1.z.string().trim().max(1000).optional(),
});
