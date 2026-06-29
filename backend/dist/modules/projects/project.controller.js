"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markProjectFinishedController = markProjectFinishedController;
exports.submitProjectWorkController = submitProjectWorkController;
exports.requestProjectRevisionController = requestProjectRevisionController;
exports.approveProjectWorkController = approveProjectWorkController;
exports.updateProjectProgressController = updateProjectProgressController;
exports.getProjectSubmissionsController = getProjectSubmissionsController;
exports.createProjectController = createProjectController;
exports.getProjectsController = getProjectsController;
exports.getProjectByIdController = getProjectByIdController;
exports.getMyProjectsController = getMyProjectsController;
exports.getAssignedProjectsController = getAssignedProjectsController;
exports.updateProjectController = updateProjectController;
exports.deleteProjectController = deleteProjectController;
const project_validation_1 = require("./project.validation");
const project_service_1 = require("./project.service");
const project_workflow_service_1 = require("./project.workflow.service");
const ApiResponse_1 = __importDefault(require("../../utils/ApiResponse"));
const ban_service_1 = require("../messages/ban.service");
async function markProjectFinishedController(req, res, next) {
    try {
        const projectId = Number(req.params.id);
        const project = await (0, project_service_1.markProjectFinished)(req.user.userId, projectId);
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Project marked as finished", project));
    }
    catch (error) {
        next(error);
    }
}
async function submitProjectWorkController(req, res, next) {
    try {
        const projectId = Number(req.params.id);
        let links;
        if (typeof req.body.links === "string" && req.body.links.trim()) {
            links = JSON.parse(req.body.links);
        }
        else if (Array.isArray(req.body.links)) {
            links = req.body.links;
        }
        const validated = project_validation_1.submitWorkSchema.parse({
            notes: req.body.notes,
            links,
        });
        const files = req.files ?? [];
        const result = await (0, project_workflow_service_1.submitProjectWork)(req.user.userId, projectId, validated, files);
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Work submitted for review", result));
    }
    catch (error) {
        next(error);
    }
}
async function requestProjectRevisionController(req, res, next) {
    try {
        const validated = project_validation_1.requestRevisionSchema.parse(req.body);
        const project = await (0, project_workflow_service_1.requestProjectRevision)(req.user.userId, Number(req.params.id), validated);
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Revision requested", project));
    }
    catch (error) {
        next(error);
    }
}
async function approveProjectWorkController(req, res, next) {
    try {
        const payment = await (0, project_workflow_service_1.approveProjectWork)(req.user.userId, Number(req.params.id));
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Work approved and payment released", payment));
    }
    catch (error) {
        next(error);
    }
}
async function updateProjectProgressController(req, res, next) {
    try {
        const validated = project_validation_1.updateProgressSchema.parse(req.body);
        const project = await (0, project_workflow_service_1.updateProjectProgress)(req.user.userId, Number(req.params.id), validated);
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Progress updated", project));
    }
    catch (error) {
        next(error);
    }
}
async function getProjectSubmissionsController(req, res, next) {
    try {
        const submissions = await (0, project_workflow_service_1.getProjectSubmissions)(Number(req.params.id), req.user.userId);
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Submissions fetched", submissions));
    }
    catch (error) {
        next(error);
    }
}
async function createProjectController(req, res, next) {
    try {
        const validatedData = project_validation_1.createProjectSchema.parse(req.body);
        const project = await (0, project_service_1.createProject)(req.user.userId, validatedData);
        res
            .status(201)
            .json((0, ApiResponse_1.default)(201, "Project created successfully", project));
    }
    catch (error) {
        next(error);
    }
}
async function getProjectsController(req, res, next) {
    try {
        if (req.user?.role === "ENGINEER") {
            await (0, ban_service_1.assertUserNotBanned)(req.user.userId, "browse projects");
        }
        const q = typeof req.query.q === "string" ? req.query.q : undefined;
        const serviceType = typeof req.query.serviceType === "string"
            ? req.query.serviceType
            : undefined;
        const projects = await (0, project_service_1.getProjects)({ q, serviceType });
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Projects fetched successfully", projects));
    }
    catch (error) {
        next(error);
    }
}
async function getProjectByIdController(req, res, next) {
    try {
        if (req.user?.role === "ENGINEER") {
            await (0, ban_service_1.assertUserNotBanned)(req.user.userId, "view project details");
        }
        const project = await (0, project_service_1.getProjectById)(Number(req.params.id));
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Project fetched successfully", project));
    }
    catch (error) {
        next(error);
    }
}
async function getMyProjectsController(req, res, next) {
    try {
        const projects = await (0, project_service_1.getMyProjects)(req.user.userId);
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "My projects fetched successfully", projects));
    }
    catch (error) {
        next(error);
    }
}
async function getAssignedProjectsController(req, res, next) {
    try {
        const projects = await (0, project_service_1.getAssignedProjects)(req.user.userId);
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Assigned projects fetched successfully", projects));
    }
    catch (error) {
        next(error);
    }
}
async function updateProjectController(req, res, next) {
    try {
        const validatedData = project_validation_1.updateProjectSchema.parse(req.body);
        const updatedProject = await (0, project_service_1.updateProject)(req.user.userId, Number(req.params.id), validatedData);
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Project updated successfully", updatedProject));
    }
    catch (error) {
        next(error);
    }
}
async function deleteProjectController(req, res, next) {
    try {
        await (0, project_service_1.deleteProject)(req.user.userId, Number(req.params.id));
        res.status(200).json((0, ApiResponse_1.default)(200, "Project deleted successfully"));
    }
    catch (error) {
        next(error);
    }
}
