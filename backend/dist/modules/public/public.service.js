"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupportContactEmail = getSupportContactEmail;
exports.createSupportTicket = createSupportTicket;
exports.getLandingSnapshot = getLandingSnapshot;
const db_1 = __importDefault(require("../../config/db"));
function getSupportContactEmail() {
    return (process.env.SUPPORT_EMAIL?.trim() ||
        process.env.EMAIL_USER?.trim() ||
        "support@clinka.com");
}
async function createSupportTicket(data, userId) {
    return db_1.default.supportTicket.create({
        data: {
            name: data.name,
            email: data.email,
            subject: data.subject,
            message: data.message,
            userId: userId ?? null,
        },
    });
}
function formatCompactCurrency(amount) {
    if (amount >= 1000000)
        return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000)
        return `$${Math.round(amount / 1000)}K`;
    return `$${Math.round(amount)}`;
}
function toNumber(value) {
    return typeof value === "number" ? value : Number(value.toString());
}
async function getLandingSnapshot() {
    const [totalProjects, openProjects, completedProjects, totalBids, verifiedEngineers, releasedPayments, engineers, recentReviews,] = await Promise.all([
        db_1.default.project.count(),
        db_1.default.project.count({ where: { status: "OPEN" } }),
        db_1.default.project.count({ where: { status: "COMPLETED" } }),
        db_1.default.bid.count(),
        db_1.default.engineerProfile.count({ where: { verificationStatus: "APPROVED" } }),
        db_1.default.payment.findMany({
            where: { status: "RELEASED" },
            select: { amount: true },
        }),
        db_1.default.user.findMany({
            where: {
                role: "ENGINEER",
                profile: { verificationStatus: "APPROVED" },
            },
            take: 8,
            include: {
                profile: {
                    include: {
                        reviews: { select: { rating: true } },
                        portfolio: { take: 3, select: { description: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
        db_1.default.review.findMany({
            where: { comment: { not: null } },
            take: 6,
            orderBy: { createdAt: "desc" },
            include: {
                client: { select: { name: true } },
                engineer: {
                    include: {
                        user: { select: { name: true } },
                    },
                },
            },
        }),
    ]);
    const escrowReleasedTotal = releasedPayments.reduce((s, p) => s + toNumber(p.amount), 0);
    const featuredEngineers = engineers
        .map((e) => {
        const ratings = e.profile?.reviews ?? [];
        const avg = ratings.length > 0
            ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
            : 0;
        return {
            id: e.id,
            name: e.name,
            specialty: e.profile?.specialty ?? "ENGINEERING",
            rating: Math.round(avg * 10) / 10,
            projectCount: ratings.length,
            skills: (e.profile?.portfolio ?? [])
                .map((p) => p.description)
                .filter(Boolean)
                .slice(0, 3),
        };
    })
        .sort((a, b) => b.rating - a.rating || b.projectCount - a.projectCount)
        .slice(0, 4);
    const testimonials = recentReviews
        .filter((r) => r.comment?.trim())
        .slice(0, 3)
        .map((r) => ({
        quote: r.comment.trim(),
        name: r.client.name,
        role: r.engineer.user.name,
        rating: r.rating,
    }));
    return {
        stats: {
            totalProjects,
            openProjects,
            completedProjects,
            totalBids,
            verifiedEngineers,
            escrowReleasedTotal,
            escrowReleasedLabel: formatCompactCurrency(escrowReleasedTotal),
            avgBidsPerOpenProject: openProjects > 0 ? Math.round(totalBids / openProjects) : totalBids,
        },
        featuredEngineers,
        testimonials,
    };
}
