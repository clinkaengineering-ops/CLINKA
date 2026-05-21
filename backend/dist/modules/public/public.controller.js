"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLandingSnapshotController = getLandingSnapshotController;
const ApiResponse_1 = __importDefault(require("../../utils/ApiResponse"));
const public_service_1 = require("./public.service");
async function getLandingSnapshotController(_req, res, next) {
    try {
        const data = await (0, public_service_1.getLandingSnapshot)();
        res.status(200).json((0, ApiResponse_1.default)(200, "Landing snapshot fetched", data));
    }
    catch (error) {
        next(error);
    }
}
