"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminStats = getAdminStats;
exports.getPendingVerifications = getPendingVerifications;
exports.updateEngineerVerification = updateEngineerVerification;
const db_1 = __importDefault(require("../../config/db"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
function stripPassword({ password: _, ...safe }) {
    return safe;
}
async function getAdminStats() {
    const [totalUsers, totalEngineers, totalClients, totalProjects, pendingVerifications, payments,] = await Promise.all([
        db_1.default.user.count(),
        db_1.default.user.count({ where: { role: "ENGINEER" } }),
        db_1.default.user.count({ where: { role: "CLIENT" } }),
        db_1.default.project.count(),
        db_1.default.engineerProfile.count({ where: { verificationStatus: "PENDING" } }),
        db_1.default.payment.findMany({
            where: { status: { in: ["FUNDED", "RELEASED"] } },
            select: { amount: true, status: true },
        }),
    ]);
    const gmv = payments.reduce((sum, p) => sum + p.amount, 0);
    const inEscrow = payments
        .filter((p) => p.status === "FUNDED")
        .reduce((sum, p) => sum + p.amount, 0);
    return {
        totalUsers,
        totalEngineers,
        totalClients,
        totalProjects,
        pendingVerifications,
        gmv,
        inEscrow,
        openDisputes: 0,
    };
}
async function getPendingVerifications() {
    const engineers = await db_1.default.user.findMany({
        where: {
            role: "ENGINEER",
            profile: { verificationStatus: "PENDING" },
        },
        include: { profile: true },
        orderBy: { createdAt: "desc" },
    });
    return engineers.map((e) => {
        const p = e.profile;
        const docType = p.syndicateCardUrl
            ? "Syndicate Card"
            : p.collegeIdUrl
                ? "College ID"
                : p.certificateUrl
                    ? "Certificate"
                    : "Document";
        return {
            profileId: p.id,
            userId: e.id,
            name: e.name,
            email: e.email,
            specialty: p.specialty,
            documentType: docType,
            collegeIdUrl: p.collegeIdUrl,
            certificateUrl: p.certificateUrl,
            syndicateCardUrl: p.syndicateCardUrl,
            submittedAt: p.createdAt,
        };
    });
}
async function updateEngineerVerification(profileId, data) {
    const profile = await db_1.default.engineerProfile.findUnique({
        where: { id: profileId },
        include: { user: true },
    });
    if (!profile)
        throw new ApiError_1.default(404, "Engineer profile not found");
    const updated = await db_1.default.engineerProfile.update({
        where: { id: profileId },
        data: { verificationStatus: data.status },
        include: { user: true },
    });
    return stripPassword(updated.user);
}
