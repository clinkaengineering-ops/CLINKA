"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markProjectFinished = void 0;
exports.createProject = createProject;
exports.getProjects = getProjects;
exports.getMyProjects = getMyProjects;
exports.getProjectById = getProjectById;
exports.updateProject = updateProject;
exports.deleteProject = deleteProject;
exports.getAssignedProjects = getAssignedProjects;
const db_1 = __importDefault(require("../../config/db"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const ban_service_1 = require("../messages/ban.service");
var project_workflow_service_1 = require("./project.workflow.service");
Object.defineProperty(exports, "markProjectFinished", { enumerable: true, get: function () { return project_workflow_service_1.markProjectFinished; } });
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
            submissions: {
                include: { deliverables: true },
                orderBy: { createdAt: "desc" },
                take: 5,
            },
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
