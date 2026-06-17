"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markProjectFinished = markProjectFinished;
exports.createProject = createProject;
exports.getProjects = getProjects;
exports.getMyProjects = getMyProjects;
exports.getProjectById = getProjectById;
exports.updateProject = updateProject;
exports.deleteProject = deleteProject;
exports.getAssignedProjects = getAssignedProjects;
const db_1 = __importDefault(require("../../config/db"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const notifications_1 = require("../../utils/notifications");
const ban_service_1 = require("../messages/ban.service");
async function markProjectFinished(engineerUserId, projectId) {
    await (0, ban_service_1.assertUserNotBanned)(engineerUserId, "update project status");
    // Resolve engineer profile from user id
    const profile = await db_1.default.engineerProfile.findUnique({
        where: { userId: engineerUserId },
    });
    if (!profile)
        throw new ApiError_1.default(404, "Engineer profile not found");
    // Load project with payment + accepted bid
    const project = await db_1.default.project.findUnique({
        where: { id: projectId },
        include: {
            payment: true,
            bids: {
                where: { status: "ACCEPTED", engineerId: profile.id },
                take: 1,
            },
        },
    });
    if (!project)
        throw new ApiError_1.default(404, "Project not found");
    // Must be the assigned engineer
    if (project.bids.length === 0) {
        throw new ApiError_1.default(403, "You are not the assigned engineer for this project");
    }
    // Project must be active
    if (project.status !== "IN_PROGRESS") {
        throw new ApiError_1.default(400, `Project is already ${project.status.toLowerCase().replace("_", " ")}`);
    }
    // Escrow must be funded before engineer can mark done
    if (!project.payment || project.payment.status !== "FUNDED") {
        // Notify the client so they know to fund escrow
        await (0, notifications_1.createNotification)(project.clientId, "FUND_REMINDER", "Payment required", `The engineer finished "${project.title}" but you have not paid yet. Pay to release their work.`, `/escrow?project=${projectId}`);
        throw new ApiError_1.default(400, "Payment has not been made yet. Ask the client to pay before marking work as finished.");
    }
    // Update project status
    const updated = await db_1.default.project.update({
        where: { id: projectId },
        data: { status: "AWAITING_APPROVAL" },
    });
    // Notify the client
    await (0, notifications_1.createNotification)(project.clientId, "WORK_DELIVERED", "Work ready for review", `The engineer marked "${project.title}" as finished. Review the work, then send payment.`, `/messages?project=${projectId}`);
    return updated;
}
async function createProject(clientId, data) {
    const client = await db_1.default.user.findUnique({ where: { id: clientId } });
    if (!client || client.role !== "CLIENT") {
        throw new ApiError_1.default(403, "Only clients can post projects");
    }
    const { title, description, budget, serviceType } = data;
    const project = await db_1.default.project.create({
        data: {
            clientId,
            title,
            description,
            budget,
            serviceType,
        },
    });
    return project;
}
async function getProjects(query) {
    const q = query?.q?.trim();
    const projects = await db_1.default.project.findMany({
        where: {
            status: "OPEN",
            ...(query?.serviceType
                ? { serviceType: query.serviceType }
                : {}),
            ...(q
                ? {
                    OR: [
                        { title: { contains: q, mode: "insensitive" } },
                        { description: { contains: q, mode: "insensitive" } },
                    ],
                }
                : {}),
        },
        include: {
            client: {
                select: { id: true, name: true },
            },
            _count: {
                select: { bids: true },
            },
        },
    });
    return projects;
}
async function getMyProjects(clientId) {
    const projects = await db_1.default.project.findMany({
        where: { clientId },
        include: {
            bids: {
                include: {
                    engineer: {
                        include: { user: { select: { id: true, name: true } } },
                    },
                },
                orderBy: { createdAt: "desc" },
            },
            _count: {
                select: { bids: true },
            },
        },
    });
    return projects;
}
async function getProjectById(projectId) {
    const project = await db_1.default.project.findUnique({
        where: { id: projectId },
        include: {
            client: {
                select: { id: true, name: true },
            },
            bids: {
                include: {
                    engineer: {
                        include: { user: { select: { id: true, name: true } } },
                    },
                },
            },
            review: {
                include: {
                    client: { select: { id: true, name: true } },
                },
            },
            payment: true,
        },
    });
    if (!project)
        throw new ApiError_1.default(404, "Project not found");
    return project;
}
async function updateProject(clientId, projectId, data) {
    const project = await db_1.default.project.findUnique({ where: { id: projectId } });
    if (!project)
        throw new ApiError_1.default(404, "Project not found");
    if (project.clientId !== clientId) {
        throw new ApiError_1.default(403, "Not your project");
    }
    if (project.status !== "OPEN") {
        throw new ApiError_1.default(400, "Cannot edit a project that is no longer open");
    }
    const updated = await db_1.default.project.update({
        where: { id: projectId },
        data: {
            ...(data.title && { title: data.title }),
            ...(data.description && { description: data.description }),
            ...(data.budget && { budget: data.budget }),
            ...(data.serviceType && { serviceType: data.serviceType }),
        },
    });
    return updated;
}
async function deleteProject(clientId, projectId) {
    const project = await db_1.default.project.findUnique({ where: { id: projectId } });
    if (!project)
        throw new ApiError_1.default(404, "Project not found");
    if (project.clientId !== clientId) {
        throw new ApiError_1.default(403, "Not your project");
    }
    if (project.status !== "OPEN") {
        throw new ApiError_1.default(400, "Cannot delete a project that is no longer open");
    }
    await db_1.default.project.delete({ where: { id: projectId } });
}
/** Projects where the engineer has an accepted bid (active contracts). */
async function getAssignedProjects(engineerUserId) {
    await (0, ban_service_1.assertUserNotBanned)(engineerUserId, "view assigned projects");
    const profile = await db_1.default.engineerProfile.findUnique({
        where: { userId: engineerUserId },
    });
    if (!profile)
        throw new ApiError_1.default(404, "Engineer profile not found");
    const acceptedBids = await db_1.default.bid.findMany({
        where: { engineerId: profile.id, status: "ACCEPTED" },
        include: {
            project: {
                include: {
                    client: { select: { id: true, name: true } },
                    payment: true,
                    bids: {
                        where: { status: "ACCEPTED" },
                        take: 1,
                        include: {
                            engineer: {
                                include: { user: { select: { id: true, name: true } } },
                            },
                        },
                    },
                    _count: { select: { bids: true } },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    return acceptedBids.map((b) => b.project);
}
