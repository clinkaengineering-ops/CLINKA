"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBid = createBid;
exports.getBidsForProject = getBidsForProject;
exports.approveBid = approveBid;
exports.listMyBids = listMyBids;
const db_1 = __importDefault(require("../../config/db"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const notifications_1 = require("../../utils/notifications");
async function createBid(engineerId, projectId, data) {
    const { price, duration, description } = data;
    // Check user is an engineer
    const user = await db_1.default.user.findUnique({ where: { id: engineerId } });
    if (!user || user.role === "ADMIN") {
        throw new ApiError_1.default(403, "Admins cannot place bids");
    }
    if (user.role !== "ENGINEER") {
        throw new ApiError_1.default(403, "Only engineers can place bids");
    }
    // Get engineer profile
    const profile = await db_1.default.engineerProfile.findUnique({
        where: { userId: engineerId },
    });
    if (!profile)
        throw new ApiError_1.default(404, "Engineer profile not found");
    if (profile.verificationStatus !== "APPROVED") {
        throw new ApiError_1.default(403, "Your engineer account must be verified before bidding");
    }
    // Check project exists
    const project = await db_1.default.project.findUnique({ where: { id: projectId } });
    if (!project)
        throw new ApiError_1.default(404, "Project not found");
    // Check project is still open
    if (project.status !== "OPEN") {
        throw new ApiError_1.default(400, "Bidding is closed for this project");
    }
    // Check engineer hasn't already bid
    const existingBid = await db_1.default.bid.findFirst({
        where: { engineerId: profile.id, projectId },
    });
    if (existingBid) {
        throw new ApiError_1.default(400, "You already placed a bid on this project");
    }
    // Create the bid
    const bid = await db_1.default.bid.create({
        data: {
            engineerId: profile.id,
            projectId,
            price,
            duration,
            description,
        },
    });
    await (0, notifications_1.createNotification)(project.clientId, "NEW_BID", "New bid received", `${user.name} placed a bid on "${project.title}"`, `/projects?project=${projectId}`);
    return bid;
}
async function getBidsForProject(projectId) {
    const bids = await db_1.default.bid.findMany({
        where: { projectId },
        include: {
            engineer: {
                include: { user: { select: { id: true, name: true } } },
            },
        },
    });
    return bids;
}
async function approveBid(clientId, bidId) {
    // Get the bid
    const bid = await db_1.default.bid.findUnique({ where: { id: bidId } });
    if (!bid)
        throw new ApiError_1.default(404, "Bid not found");
    // Get the project
    const project = await db_1.default.project.findUnique({ where: { id: bid.projectId } });
    if (!project)
        throw new ApiError_1.default(404, "Project not found");
    // Check client owns this project
    if (project.clientId !== clientId) {
        throw new ApiError_1.default(403, "Not your project");
    }
    // Check project is still open
    if (project.status !== "OPEN") {
        throw new ApiError_1.default(400, "Project is not open for bidding");
    }
    // Accept this bid
    await db_1.default.bid.update({
        where: { id: bidId },
        data: { status: "ACCEPTED" },
    });
    // Reject all other bids on this project
    await db_1.default.bid.updateMany({
        where: {
            projectId: project.id,
            id: { not: bidId },
        },
        data: { status: "REJECTED" },
    });
    // Move project to IN_PROGRESS
    await db_1.default.project.update({
        where: { id: project.id },
        data: { status: "IN_PROGRESS" },
    });
    // Create conversation between client and engineer for this project
    const engineerUser = await db_1.default.user.findFirst({
        where: { profile: { id: bid.engineerId } },
        select: { id: true },
    });
    await db_1.default.conversation.upsert({
        where: { projectId: project.id },
        create: {
            projectId: project.id,
            clientId: project.clientId,
            engineerId: engineerUser.id,
        },
        update: {},
    });
    if (engineerUser) {
        await (0, notifications_1.createNotification)(engineerUser.id, "BID_ACCEPTED", "Bid accepted", `Your bid on "${project.title}" was accepted`, `/my-bids`);
    }
    return { message: "Bid approved and project assigned to engineer" };
}
async function listMyBids(engineerUserId) {
    const profile = await db_1.default.engineerProfile.findUnique({
        where: { userId: engineerUserId },
    });
    if (!profile)
        throw new ApiError_1.default(404, "Engineer profile not found");
    return db_1.default.bid.findMany({
        where: { engineerId: profile.id },
        include: {
            project: {
                select: {
                    id: true,
                    title: true,
                    status: true,
                    serviceType: true,
                    budget: true,
                    updatedAt: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}
