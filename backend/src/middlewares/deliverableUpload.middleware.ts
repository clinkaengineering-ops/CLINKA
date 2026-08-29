import { createUploadMiddleware } from "../config/upload";

const DELIVERABLE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const deliverableUpload = createUploadMiddleware("projects", {
  allowedMimeTypes: DELIVERABLE_MIME_TYPES,
  maxFileSize: 25 * 1024 * 1024,
  maxFiles: 10,
});

export default deliverableUpload;
