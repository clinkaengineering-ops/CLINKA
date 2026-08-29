import { createUploadMiddleware } from "../config/upload";

const DOCUMENT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const upload = createUploadMiddleware("documents", {
  allowedMimeTypes: DOCUMENT_MIME_TYPES,
  maxFileSize: 10 * 1024 * 1024,
});

export default upload;
