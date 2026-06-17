"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const project_controller_1 = require("./project.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const project_controller_2 = require("./project.controller"); // add to existing import
const router = (0, express_1.Router)();
router.post("/", auth_middleware_1.authenticate, project_controller_1.createProjectController);
router.get("/", auth_middleware_1.optionalAuthenticate, project_controller_1.getProjectsController);
router.get("/my", auth_middleware_1.authenticate, project_controller_1.getMyProjectsController);
router.get("/assigned", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("ENGINEER"), (0, auth_middleware_1.rejectIfBanned)("ENGINEER"), project_controller_1.getAssignedProjectsController);
router.get("/:id", auth_middleware_1.optionalAuthenticate, project_controller_1.getProjectByIdController);
router.put("/:id", auth_middleware_1.authenticate, project_controller_1.updateProjectController);
router.delete("/:id", auth_middleware_1.authenticate, project_controller_1.deleteProjectController);
router.patch("/:id/finish", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("ENGINEER"), (0, auth_middleware_1.rejectIfBanned)("ENGINEER"), project_controller_2.markProjectFinishedController);
exports.default = router;
