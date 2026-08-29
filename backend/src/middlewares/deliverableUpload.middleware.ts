import multer from "multer";
import { createLocalUpload } from "../config/localUpload";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
]);

const storage = createLocalUpload("project-deliverables");

const deliverableUpload = multer({
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

export default deliverableUpload;
