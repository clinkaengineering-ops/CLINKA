"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./config/db"));
async function main() {
    console.log("Connecting...");
    try {
        await db_1.default.$connect();
        console.log("Connected! Now querying...");
        const users = await db_1.default.user.findMany();
        console.log("Users:", users);
    }
    catch (error) {
        console.error("Error connecting/querying:", error);
    }
    finally {
        await db_1.default.$disconnect();
    }
}
main();
