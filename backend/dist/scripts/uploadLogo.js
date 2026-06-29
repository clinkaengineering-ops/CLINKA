"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
// Load backend .env file
dotenv_1.default.config({ path: path_1.default.join(__dirname, "../../.env") });
// Update cloudinary config with loaded env
cloudinary_1.default.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
async function main() {
    const imagePath = path_1.default.join(__dirname, "../../../frontend/public/brand/logo/PNG/logo-09.png");
    console.log("Uploading logo from:", imagePath);
    try {
        const result = await cloudinary_1.default.uploader.upload(imagePath, {
            folder: "brand",
            public_id: "logo-09",
            overwrite: true,
            invalidate: true,
        });
        console.log("Upload successful!");
        console.log("Secure URL:", result.secure_url);
    }
    catch (error) {
        console.error("Upload failed:", error);
    }
}
main();
