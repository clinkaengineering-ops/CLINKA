"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const bids_controller_1 = require("./bids.controller");
const router = (0, express_1.Router)();
router.get("/mine", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("ENGINEER"), bids_controller_1.listMyBidsController);
exports.default = router;
