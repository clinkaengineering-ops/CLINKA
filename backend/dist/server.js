"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
const mailer_1 = __importDefault(require("./config/mailer"));
const env_1 = require("./config/env");
const socket_1 = require("./socket");
(0, env_1.validateProductionEnv)();
const PORT = Number(process.env.PORT) || 5000;
const httpServer = http_1.default.createServer(app_1.default);
(0, socket_1.initSocket)(httpServer); // ← attach Socket.IO
httpServer.listen(PORT, async () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    await db_1.default.$connect();
    console.log("✅ Database connected successfully");
    try {
        await mailer_1.default.verify();
        console.log("✅ SMTP transporter is ready");
    }
    catch (error) {
        console.error("❌ SMTP transporter failed:", error instanceof Error ? error.message : error);
    }
});
