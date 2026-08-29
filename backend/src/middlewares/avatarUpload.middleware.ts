import { createUploadMiddleware } from "../config/upload";

const AVATAR_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const avatarUpload = createUploadMiddleware("avatars", {
  allowedMimeTypes: AVATAR_MIME_TYPES,
  maxFileSize: 5 * 1024 * 1024,
});

export default avatarUpload;
