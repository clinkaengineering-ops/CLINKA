import multer from "multer";
import { createLocalUpload } from "../config/localUpload";

const storage = createLocalUpload("engineer-docs");

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
    if (allowedTypes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("FILE_FORMAT_NOT_ALLOWED"));
    }
  },
});

export default upload;