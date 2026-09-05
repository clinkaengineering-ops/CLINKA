import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary";

export const UPLOAD_CATEGORIES = [
  "images",
  "documents",
  "videos",
  "avatars",
  "projects",
] as const;

export type UploadCategory = (typeof UPLOAD_CATEGORIES)[number];

const BLOCKED_EXTENSIONS = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".com",
  ".msi",
  ".sh",
  ".bash",
  ".ps1",
  ".php",
  ".phtml",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".jsx",
  ".tsx",
  ".html",
  ".htm",
  ".svg",
  ".wasm",
]);

const MIME_TO_EXTENSIONS: Record<string, readonly string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "application/pdf": [".pdf"],
  "application/zip": [".zip"],
  "application/x-zip-compressed": [".zip"],
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
  "video/quicktime": [".mov"],
};

export function getUploadRoot(): string {
  const configured = process.env.UPLOAD_DIR?.trim();
  if (configured) return path.resolve(configured);
  return path.resolve(process.cwd(), "uploads");
}

/** Origin only — never include `/uploads`, or public URLs double that segment. */
export function normalizeUploadOrigin(value: string): string {
  return value.replace(/\/+$/, "").replace(/\/uploads$/i, "");
}

export function getUploadBaseUrl(): string {
  const configured = process.env.UPLOAD_BASE_URL?.trim();
  if (configured) return normalizeUploadOrigin(configured);

  const apiUrl = process.env.API_URL?.trim();
  if (apiUrl) return normalizeUploadOrigin(apiUrl);

  return "";
}

export function ensureCategoryDir(category: UploadCategory): string {
  const dir = path.join(getUploadRoot(), category);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function ensureUploadRoot(): string {
  const root = getUploadRoot();
  fs.mkdirSync(root, { recursive: true });
  for (const category of UPLOAD_CATEGORIES) {
    ensureCategoryDir(category);
  }
  return root;
}

function sanitizeExtension(ext: string): string | null {
  const normalized = ext.toLowerCase();
  if (!normalized.startsWith(".")) return null;
  if (BLOCKED_EXTENSIONS.has(normalized)) return null;
  if (!/^\.[a-z0-9]+$/.test(normalized)) return null;
  return normalized;
}

export function resolveStoredExtension(
  mimetype: string,
  originalname: string,
): string {
  const allowedForMime = MIME_TO_EXTENSIONS[mimetype];
  const originalExt = sanitizeExtension(path.extname(originalname));

  if (allowedForMime?.length) {
    if (originalExt && allowedForMime.includes(originalExt)) {
      return originalExt;
    }
    return allowedForMime[0];
  }

  return originalExt ?? ".bin";
}

export function isAllowedUpload(
  mimetype: string,
  originalname: string,
  allowedMimeTypes: ReadonlySet<string>,
): boolean {
  if (!allowedMimeTypes.has(mimetype)) return false;

  const ext = sanitizeExtension(path.extname(originalname));
  const allowedExts = MIME_TO_EXTENSIONS[mimetype];

  if (allowedExts) {
    if (!ext) return false;
    return allowedExts.includes(ext);
  }

  if (!ext) return mimetype !== "application/octet-stream";
  return true;
}

export function createCloudinaryUpload(category: UploadCategory) {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: category,
      resource_type: "auto",
    } as any,
  });
}

export function getStoredUploadPath(
  file: Express.Multer.File | undefined,
  category: UploadCategory,
): string | undefined {
  if (!file) return undefined;
  if (file.path.startsWith("http://") || file.path.startsWith("https://")) {
    return file.path;
  }
  return `/uploads/${category}/${file.filename}`;
}

/** @deprecated Use getStoredUploadPath with an explicit category. */
export function getRelativeUploadUrl(
  file?: Express.Multer.File,
  category: UploadCategory = "images",
): string | undefined {
  return getStoredUploadPath(file, category);
}

export function normalizeStoredUploadPath(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const normalized = trimmed.replace(/\\/g, "/");
  const uploadsIndex = normalized.indexOf("/uploads/");
  if (uploadsIndex !== -1) {
    return normalized.slice(uploadsIndex);
  }
  if (normalized.startsWith("uploads/")) {
    return `/${normalized}`;
  }
  if (normalized.startsWith("/uploads/")) {
    return normalized;
  }
  return null;
}

export function storedPathToAbsolute(storedPath: string): string | null {
  const normalized = normalizeStoredUploadPath(storedPath);
  if (!normalized || normalized.startsWith("http")) return null;

  const relative = normalized.replace(/^\/uploads\//, "");
  const root = path.resolve(getUploadRoot());
  const absolute = path.resolve(root, relative);

  if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) {
    return null;
  }

  return absolute;
}

export function resolvePublicUploadUrl(
  storedPath: string | null | undefined,
): string | null {
  if (!storedPath) return null;
  if (/^https?:\/\//i.test(storedPath)) return storedPath;

  const relative = normalizeStoredUploadPath(storedPath);
  if (!relative) return storedPath;

  const base = getUploadBaseUrl();
  return base ? `${base}${relative}` : relative;
}

export async function deleteUploadFile(storedPath: string | null | undefined): Promise<void> {
  if (!storedPath) return;

  try {
    // If it's a Cloudinary URL, extract the public_id and delete it
    if (storedPath.includes("cloudinary.com")) {
      const parts = storedPath.split("/");
      const filenameWithExt = parts.pop();
      const folder = parts.pop();
      if (filenameWithExt && folder) {
        const filename = filenameWithExt.split(".")[0];
        const publicId = `${folder}/${filename}`;
        await cloudinary.uploader.destroy(publicId);
      }
      return;
    }

    // Fallback for old local files (if they exist)
    const absolute = storedPathToAbsolute(storedPath);
    if (absolute && fs.existsSync(absolute)) {
      fs.unlinkSync(absolute);
    }
  } catch (error) {
    console.error("Failed to delete upload file:", error);
  }
}

export async function deleteUploadFiles(
  storedPaths: Array<string | null | undefined>,
): Promise<void> {
  await Promise.all(storedPaths.map(p => deleteUploadFile(p)));
}

export interface UploadMiddlewareOptions {
  allowedMimeTypes: ReadonlySet<string>;
  maxFileSize: number;
  maxFiles?: number;
}

export function createUploadMiddleware(
  category: UploadCategory,
  options: UploadMiddlewareOptions,
) {
  return multer({
    storage: createCloudinaryUpload(category),
    limits: {
      fileSize: options.maxFileSize,
      ...(options.maxFiles !== undefined ? { files: options.maxFiles } : {}),
    },
    fileFilter: (_req, file, cb) => {
      if (isAllowedUpload(file.mimetype, file.originalname, options.allowedMimeTypes)) {
        cb(null, true);
        return;
      }
      cb(new Error("FILE_FORMAT_NOT_ALLOWED"));
    },
  });
}
