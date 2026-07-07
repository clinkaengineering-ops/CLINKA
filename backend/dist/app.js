"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const loadEnv_1 = require("./config/loadEnv");
const cors_2 = require("./config/cors");
const errorHandler_middleware_1 = require("./middlewares/errorHandler.middleware");
const index_1 = __importDefault(require("./routes/index"));
(0, loadEnv_1.loadEnv)();
const app = (0, express_1.default)();
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}
app.use((0, cors_1.default)({
    origin(origin, callback) {
        if ((0, cors_2.isAllowedOrigin)(origin)) {
            callback(null, true);
            return;
        }
        callback(null, false);
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.get("/api/health", (req, res) => {
    res.status(200).json({ message: "API is running", success: true });
});
(0, index_1.default)(app);
app.use(errorHandler_middleware_1.errorHandler);
exports.default = app;
