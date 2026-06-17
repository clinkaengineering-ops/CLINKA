"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMeController = getMeController;
exports.updateMeController = updateMeController;
exports.getEngineersController = getEngineersController;
exports.getEngineerByIdController = getEngineerByIdController;
exports.addPortfolioItemController = addPortfolioItemController;
exports.uploadAvatarController = uploadAvatarController;
exports.uploadCoverController = uploadCoverController;
exports.deletePortfolioItemController = deletePortfolioItemController;
const user_validation_1 = require("./user.validation");
const ApiResponse_1 = __importDefault(require("../../utils/ApiResponse"));
const user_service_1 = require("./user.service");
async function getMeController(req, res, next) {
    try {
        const user = await (0, user_service_1.getMe)(req.user.userId);
        res.status(200).json((0, ApiResponse_1.default)(200, "User fetched successfully", user));
    }
    catch (error) {
        next(error);
    }
}
async function updateMeController(req, res, next) {
    try {
        const validatedData = user_validation_1.updateProfileSchema.parse(req.body);
        const user = await (0, user_service_1.updateMe)(req.user.userId, validatedData);
        res.status(200).json((0, ApiResponse_1.default)(200, "User updated successfully", user));
    }
    catch (error) {
        next(error);
    }
}
async function getEngineersController(req, res, next) {
    try {
        const { q, specialty, nationality } = user_validation_1.searchQuerySchema.parse(req.query);
        const engineers = await (0, user_service_1.getEngineers)({ q, specialty, nationality });
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Engineers fetched successfully", engineers));
    }
    catch (error) {
        next(error);
    }
}
async function getEngineerByIdController(req, res, next) {
    try {
        const engineer = await (0, user_service_1.getEngineerById)(Number(req.params.id));
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Engineer fetched successfully", engineer));
    }
    catch (error) {
        next(error);
    }
}
async function addPortfolioItemController(req, res, next) {
    try {
        const imageUrl = req.file?.path ?? req.body.imageUrl;
        const description = String(req.body.description ?? "").trim();
        const validatedData = user_validation_1.addPortfolioItemSchema.parse({ imageUrl, description });
        const item = await (0, user_service_1.addPortfolioItem)(req.user.userId, validatedData);
        res
            .status(201)
            .json((0, ApiResponse_1.default)(201, "Portfolio item added successfully", item));
    }
    catch (error) {
        next(error);
    }
}
async function uploadAvatarController(req, res, next) {
    try {
        const imageUrl = req.file?.path;
        if (!imageUrl)
            throw new Error("No image uploaded");
        const user = await (0, user_service_1.updateAvatar)(req.user.userId, imageUrl);
        res.status(200).json((0, ApiResponse_1.default)(200, "Avatar updated", user));
    }
    catch (error) {
        next(error);
    }
}
async function uploadCoverController(req, res, next) {
    try {
        const imageUrl = req.file?.path;
        if (!imageUrl)
            throw new Error("No image uploaded");
        const user = await (0, user_service_1.updateCoverImage)(req.user.userId, imageUrl);
        res.status(200).json((0, ApiResponse_1.default)(200, "Cover updated", user));
    }
    catch (error) {
        next(error);
    }
}
async function deletePortfolioItemController(req, res, next) {
    try {
        await (0, user_service_1.deletePortfolioItem)(req.user.userId, Number(req.params.id));
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Portfolio item deleted successfully"));
    }
    catch (error) {
        next(error);
    }
}
