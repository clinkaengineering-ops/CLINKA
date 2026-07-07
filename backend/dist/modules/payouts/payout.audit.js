"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logPayoutEvent = logPayoutEvent;
const crypto_1 = __importDefault(require("crypto"));
function maskPII(obj) {
    if (!obj || typeof obj !== "object")
        return obj;
    if (Array.isArray(obj))
        return obj.map(maskPII);
    const masked = { ...obj };
    const sensitiveKeys = ["msisdn", "nationalId", "bankCardNumber", "pan", "national_id", "bank_card_number"];
    for (const key of Object.keys(masked)) {
        if (sensitiveKeys.includes(key) && typeof masked[key] === "string") {
            const str = masked[key];
            if (str.length > 4) {
                masked[key] = str.substring(0, 2) + "***" + str.substring(str.length - 2);
            }
            else {
                masked[key] = "***";
            }
        }
        else if (typeof masked[key] === "object") {
            masked[key] = maskPII(masked[key]);
        }
    }
    return masked;
}
async function logPayoutEvent(tx, input) {
    const lastLog = await tx.payoutAuditLog.findFirst({
        where: { withdrawalId: input.withdrawalId },
        orderBy: { id: 'desc' },
        select: { hash: true }
    });
    const previousHash = lastLog?.hash ?? null;
    const maskedMetadata = input.metadata ? maskPII(input.metadata) : null;
    const now = new Date();
    // Compute current hash for the chain
    const hashPayload = JSON.stringify({
        withdrawalId: input.withdrawalId,
        event: input.event,
        statusBefore: input.statusBefore ?? null,
        statusAfter: input.statusAfter ?? null,
        message: input.message ?? null,
        previousHash,
        timestamp: now.toISOString(),
    });
    const currentHash = crypto_1.default.createHash("sha256").update(hashPayload).digest("hex");
    await tx.payoutAuditLog.create({
        data: {
            withdrawalId: input.withdrawalId,
            event: input.event,
            statusBefore: input.statusBefore ?? null,
            statusAfter: input.statusAfter ?? null,
            message: input.message ?? null,
            metadata: maskedMetadata,
            previousHash,
            hash: currentHash,
            actorId: input.actorId ?? null,
            actorIp: input.actorIp ?? null,
            actorUserAgent: input.actorUserAgent ?? null,
        },
    });
}
