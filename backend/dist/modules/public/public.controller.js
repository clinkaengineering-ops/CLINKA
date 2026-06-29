"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLandingSnapshotController = getLandingSnapshotController;
exports.getSupportContactController = getSupportContactController;
exports.createSupportTicketController = createSupportTicketController;
const ApiResponse_1 = __importDefault(require("../../utils/ApiResponse"));
const public_service_1 = require("./public.service");
const public_validation_1 = require("./public.validation");
async function getLandingSnapshotController(_req, res, next) {
    try {
        const data = await (0, public_service_1.getLandingSnapshot)();
        res.status(200).json((0, ApiResponse_1.default)(200, "Landing snapshot fetched", data));
    }
    catch (error) {
        next(error);
    }
}
async function getSupportContactController(_req, res, next) {
    try {
        res.status(200).json((0, ApiResponse_1.default)(200, "Support contact fetched", {
            email: (0, public_service_1.getSupportContactEmail)(),
        }));
    }
    catch (error) {
        next(error);
    }
}
async function createSupportTicketController(req, res, next) {
    try {
        const input = public_validation_1.createSupportTicketSchema.parse(req.body);
        const ticket = await (0, public_service_1.createSupportTicket)(input, req.user?.userId);
        res
            .status(201)
            .json((0, ApiResponse_1.default)(201, "Support request submitted", { id: ticket.id }));
    }
    catch (error) {
        next(error);
    }
}
