"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = registerRoutes;
const auth_routes_1 = __importDefault(require("../modules/auth/auth.routes"));
const user_routes_1 = __importDefault(require("../modules/users/user.routes"));
const project_routes_1 = __importDefault(require("../modules/projects/project.routes"));
const bids_routes_1 = __importDefault(require("../modules/bids/bids.routes"));
const bids_mine_routes_1 = __importDefault(require("../modules/bids/bids-mine.routes"));
const messages_routes_1 = __importDefault(require("../modules/messages/messages.routes"));
const payments_routes_1 = __importDefault(require("../modules/payments/payments.routes"));
const reviews_routes_1 = __importDefault(require("../modules/reviews/reviews.routes"));
const admin_routes_1 = __importDefault(require("../modules/admin/admin.routes"));
const public_routes_1 = __importDefault(require("../modules/public/public.routes"));
const notifications_routes_1 = __importDefault(require("../modules/notifications/notifications.routes"));
function registerRoutes(app) {
    app.use("/api/public", public_routes_1.default);
    app.use("/api/notifications", notifications_routes_1.default);
    app.use("/api/payments", payments_routes_1.default);
    app.use("/api/reviews", reviews_routes_1.default);
    app.use("/api/admin", admin_routes_1.default);
    app.use("/api/messages", messages_routes_1.default);
    app.use("/api/bids", bids_mine_routes_1.default);
    app.use("/api/auth", auth_routes_1.default);
    app.use("/api/users", user_routes_1.default);
    app.use("/api/projects", project_routes_1.default);
    app.use("/api/projects", bids_routes_1.default);
}
