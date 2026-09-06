import { createUploadMiddleware } from "../config/upload";

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const imageUpload = createUploadMiddleware("images", {
  allowedMimeTypes: IMAGE_MIME_TYPES,
  maxFileSize: 10 * 1024 * 1024,
});

export default imageUpload;
