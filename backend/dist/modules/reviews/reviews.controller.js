"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReviewController = createReviewController;
exports.getProjectReviewController = getProjectReviewController;
exports.getEngineerReviewsController = getEngineerReviewsController;
exports.listPendingReviewsController = listPendingReviewsController;
exports.listMyReviewsController = listMyReviewsController;
exports.canReviewProjectController = canReviewProjectController;
const ApiResponse_1 = __importDefault(require("../../utils/ApiResponse"));
const reviews_validation_1 = require("./reviews.validation");
const reviews_service_1 = require("./reviews.service");
async function createReviewController(req, res, next) {
    try {
        const projectId = Number(req.params.projectId);
        const input = reviews_validation_1.createReviewSchema.parse(req.body);
        const review = await (0, reviews_service_1.createProjectReview)(req.user.userId, projectId, input);
        res.status(201).json((0, ApiResponse_1.default)(201, "Review submitted successfully", review));
    }
    catch (error) {
        next(error);
    }
}
async function getProjectReviewController(req, res, next) {
    try {
        const review = await (0, reviews_service_1.getProjectReview)(Number(req.params.projectId));
        res.status(200).json((0, ApiResponse_1.default)(200, "Review fetched successfully", review));
    }
    catch (error) {
        next(error);
    }
}
async function getEngineerReviewsController(req, res, next) {
    try {
        const reviews = await (0, reviews_service_1.getEngineerReviews)(Number(req.params.engineerId));
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Engineer reviews fetched successfully", reviews));
    }
    catch (error) {
        next(error);
    }
}
async function listPendingReviewsController(req, res, next) {
    try {
        const pending = await (0, reviews_service_1.listPendingReviews)(req.user.userId);
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Pending reviews fetched successfully", pending));
    }
    catch (error) {
        next(error);
    }
}
async function listMyReviewsController(req, res, next) {
    try {
        const reviews = await (0, reviews_service_1.listMyReviews)(req.user.userId);
        res.status(200).json((0, ApiResponse_1.default)(200, "Your reviews fetched successfully", reviews));
    }
    catch (error) {
        next(error);
    }
}
async function canReviewProjectController(req, res, next) {
    try {
        const result = await (0, reviews_service_1.canReviewProject)(req.user.userId, Number(req.params.projectId));
        res.status(200).json((0, ApiResponse_1.default)(200, "Review eligibility checked", result));
    }
    catch (error) {
        next(error);
    }
}
