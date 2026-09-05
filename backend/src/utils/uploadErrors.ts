import { MulterError } from "multer";
import ApiError from "./ApiError";

const CHAT_ALLOWED_LABEL = "JPG, PNG, GIF, WebP, or PDF";

export function resolveUploadError(err: unknown): ApiError | null {
  if (err instanceof ApiError) return err;

  if (err instanceof MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return new ApiError(400, "File is too large. Please use a smaller file.");
      case "LIMIT_UNEXPECTED_FILE":
        return new ApiError(400, "Invalid upload. Please use the attachment button.");
      default:
        return new ApiError(400, err.message || "Upload failed. Please try again.");
    }
  }

  const message = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: string }).code;
  const lower = message.toLowerCase();

  if (
    message === "FILE_FORMAT_NOT_ALLOWED" ||
    lower.includes("format") ||
    lower.includes("not allowed") ||
    lower.includes("unsupported") ||
    lower.includes("invalid image") ||
    lower.includes("invalid file")
  ) {
    return new ApiError(
      400,
      `File format not allowed. Use ${CHAT_ALLOWED_LABEL}.`,
    );
  }

  if (
    lower.includes("file size") ||
    lower.includes("too large") ||
    lower.includes("max file size")
  ) {
    return new ApiError(400, "File is too large. Please use a smaller file.");
  }

  if (
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "ESOCKETTIMEDOUT" ||
    lower.includes("timeout") ||
    lower.includes("timed out")
  ) {
    return new ApiError(
      504,
      "Upload timed out. Check your connection and try again.",
    );
  }

  if (
    lower.includes("network") ||
    lower.includes("econnrefused") ||
    lower.includes("getaddrinfo")
  ) {
    return new ApiError(
      503,
      "Could not upload the file right now. Please try again in a moment.",
    );
  }

  return null;
}
