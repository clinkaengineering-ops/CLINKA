"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const public_controller_1 = require("./public.controller");
const router = (0, express_1.Router)();
router.get("/landing", public_controller_1.getLandingSnapshotController);
exports.default = router;
