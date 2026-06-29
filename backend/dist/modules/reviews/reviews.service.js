"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProjectReview = createProjectReview;
exports.getProjectReview = getProjectReview;
exports.getEngineerReviews = getEngineerReviews;
exports.listPendingReviews = listPendingReviews;
exports.listMyReviews = listMyReviews;
exports.canReviewProject = canReviewProject;
const db_1 = __importDefault(require("../../config/db"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const reviewInclude = {
    client: { select: { id: true, name: true } },
    project: { select: { id: true, title: true } },
};
async function recalculateEngineerRating(engineerProfileId) {
    const reviews = await db_1.default.review.findMany({
        where: { engineerId: engineerProfileId },
        select: { rating: true },
    });
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;
    await db_1.default.engineerProfile.update({
        where: { id: engineerProfileId },
        data: {
            totalReviews,
            averageRating: Math.round(averageRating * 10) / 10,
        },
    });
}
async function getAcceptedBid(projectId) {
    return db_1.default.bid.findFirst({
        where: { projectId, status: "ACCEPTED" },
        include: {
            engineer: { include: { user: { select: { id: true, name: true } } } },
        },
    });
}
async function createProjectReview(clientId, projectId, data) {
    const project = await db_1.default.project.findUnique({
        where: { id: projectId },
        include: { payment: true, review: true },
    });
    if (!project)
        throw new ApiError_1.default(404, "Project not found");
    if (project.clientId !== clientId) {
        throw new ApiError_1.default(403, "Only the project owner can leave a review");
    }
    if (project.review) {
        throw new ApiError_1.default(400, "This project already has a review");
    }
    if (project.status === "OPEN" || project.status === "CANCELLED") {
        throw new ApiError_1.default(400, "Cannot review a project that is not in progress or completed");
    }
    const payment = project.payment;
    if (!payment || payment.status !== "RELEASED") {
        throw new ApiError_1.default(400, "Release escrow payment before leaving a review");
    }
    const bid = await getAcceptedBid(projectId);
    if (!bid)
        throw new ApiError_1.default(400, "No accepted engineer found for this project");
    const review = await db_1.default.$transaction(async (tx) => {
        const created = await tx.review.create({
            data: {
                projectId,
                clientId,
                engineerId: bid.engineerId,
                rating: data.rating,
                comment: data.comment ?? null,
            },
            include: reviewInclude,
        });
        await tx.project.update({
            where: { id: projectId },
            data: { status: "COMPLETED" },
        });
        return created;
    });
    await recalculateEngineerRating(bid.engineerId);
    return review;
}
async function getProjectReview(projectId) {
    const review = await db_1.default.review.findUnique({
        where: { projectId },
        include: reviewInclude,
    });
    if (!review)
        throw new ApiError_1.default(404, "Review not found");
    return review;
}
async function getEngineerReviews(engineerUserId) {
    const engineer = await db_1.default.user.findUnique({
        where: { id: engineerUserId, role: "ENGINEER" },
        include: { profile: true },
    });
    if (!engineer?.profile)
        throw new ApiError_1.default(404, "Engineer not found");
    return db_1.default.review.findMany({
        where: { engineerId: engineer.profile.id },
        include: reviewInclude,
        orderBy: { createdAt: "desc" },
    });
}
async function listPendingReviews(clientId) {
    const projects = await db_1.default.project.findMany({
        where: {
            clientId,
            status: { in: ["IN_PROGRESS", "SUBMITTED_FOR_REVIEW", "AWAITING_APPROVAL", "REVISION_REQUESTED", "COMPLETED"] },
            review: null,
            payment: { status: "RELEASED" },
        },
        include: {
            payment: true,
            bids: {
                where: { status: "ACCEPTED" },
                take: 1,
                include: {
                    engineer: { include: { user: { select: { id: true, name: true } } } },
                },
            },
        },
        orderBy: { updatedAt: "desc" },
    });
    return projects
        .filter((p) => p.bids.length > 0)
        .map((p) => ({
        projectId: p.id,
        projectTitle: p.title,
        amount: p.payment?.amount ?? p.bids[0].price,
        engineerUserId: p.bids[0].engineer.user.id,
        engineerName: p.bids[0].engineer.user.name,
        projectStatus: p.status,
        paymentReleasedAt: p.payment?.updatedAt,
    }));
}
async function listMyReviews(clientId) {
    return db_1.default.review.findMany({
        where: { clientId },
        include: reviewInclude,
        orderBy: { createdAt: "desc" },
    });
}
async function canReviewProject(clientId, projectId) {
    const project = await db_1.default.project.findUnique({
        where: { id: projectId },
        include: {
            payment: true,
            review: { include: reviewInclude },
        },
    });
    if (!project)
        throw new ApiError_1.default(404, "Project not found");
    return {
        canReview: project.clientId === clientId &&
            !project.review &&
            project.status !== "OPEN" &&
            project.status !== "CANCELLED" &&
            project.payment?.status === "RELEASED",
        hasReview: !!project.review,
        review: project.review,
    };
}
