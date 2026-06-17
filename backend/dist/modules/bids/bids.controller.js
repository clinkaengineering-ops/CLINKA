"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBidController = createBidController;
exports.getBidsForProjectController = getBidsForProjectController;
exports.approveBidController = approveBidController;
exports.listMyBidsController = listMyBidsController;
const bids_validation_1 = require("./bids.validation");
const bids_service_1 = require("./bids.service");
const ApiResponse_1 = __importDefault(require("../../utils/ApiResponse"));
async function createBidController(req, res, next) {
    try {
        const validatedData = bids_validation_1.createBidSchema.parse(req.body);
        const projectId = Number(req.params.projectId);
        const bid = await (0, bids_service_1.createBid)(req.user.userId, projectId, validatedData);
        res.status(201).json((0, ApiResponse_1.default)(201, "Bid created successfully", bid));
    }
    catch (error) {
        next(error);
    }
}
async function getBidsForProjectController(req, res, next) {
    try {
        const projectId = Number(req.params.projectId);
        const bids = await (0, bids_service_1.getBidsForProject)(projectId);
        res.status(200).json((0, ApiResponse_1.default)(200, "Bids fetched successfully", bids));
    }
    catch (error) {
        next(error);
    }
}
async function approveBidController(req, res, next) {
    try {
        const bidId = Number(req.params.bidId);
        const bid = await (0, bids_service_1.approveBid)(req.user.userId, bidId);
        res.status(200).json((0, ApiResponse_1.default)(200, "Bid approved successfully", bid));
    }
    catch (error) {
        next(error);
    }
}
async function listMyBidsController(req, res, next) {
    try {
        const bids = await (0, bids_service_1.listMyBids)(req.user.userId);
        res.status(200).json((0, ApiResponse_1.default)(200, "Bids fetched successfully", bids));
    }
    catch (error) {
        next(error);
    }
}
