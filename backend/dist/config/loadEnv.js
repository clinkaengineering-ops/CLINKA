"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnv = loadEnv;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
let loaded = false;
/** Load `.env` then `.env.local` (local overrides) from the backend package root. */
function loadEnv() {
    if (loaded)
        return;
    const root = path_1.default.resolve(__dirname, "../..");
    dotenv_1.default.config({ path: path_1.default.join(root, ".env") });
    dotenv_1.default.config({ path: path_1.default.join(root, ".env.local"), override: true });
    loaded = true;
}
