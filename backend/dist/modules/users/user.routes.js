"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/features/users/user.routes.ts
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const upload_middleware_1 = __importDefault(require("../../middlewares/upload.middleware"));
const router = (0, express_1.Router)();
// Identity
router.get("/me", auth_middleware_1.authenticate, user_controller_1.getMeController);
router.put("/me", auth_middleware_1.authenticate, user_controller_1.updateMeController);
router.post("/me/avatar", auth_middleware_1.authenticate, upload_middleware_1.default.single("image"), user_controller_1.uploadAvatarController);
router.post("/me/cover", auth_middleware_1.authenticate, upload_middleware_1.default.single("image"), user_controller_1.uploadCoverController);
// Engineer directory (public — no auth required to browse)
router.get("/engineers", user_controller_1.getEngineersController);
router.get("/engineers/:id", user_controller_1.getEngineerByIdController);
// Portfolio (engineer only — must be authenticated)
router.post("/portfolio", auth_middleware_1.authenticate, upload_middleware_1.default.single("image"), user_controller_1.addPortfolioItemController);
router.delete("/portfolio/:id", auth_middleware_1.authenticate, user_controller_1.deletePortfolioItemController);
exports.default = router;
