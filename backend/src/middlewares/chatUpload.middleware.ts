import { createUploadMiddleware } from "../config/upload";

const CHAT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
]);

const chatUpload = createUploadMiddleware("documents", {
  allowedMimeTypes: CHAT_MIME_TYPES,
  maxFileSize: 10 * 1024 * 1024,
});

export default chatUpload;
