"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const ALLOWED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
]);
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.default,
    params: {
        folder: "project-deliverables",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "pdf", "zip"],
        resource_type: "auto",
    },
});
const deliverableUpload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 25 * 1024 * 1024, files: 10 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
            cb(null, true);
            return;
        }
        cb(new Error("FILE_FORMAT_NOT_ALLOWED"));
    },
});
exports.default = deliverableUpload;
