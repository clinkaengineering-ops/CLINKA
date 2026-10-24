import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary";
import ApiError from "../utils/ApiError";

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
  // Images
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  // PDF & Documents
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/msword": [".doc"],
  "text/csv": [".csv"],
  "text/plain": [".txt"],
  "text/xml": [".xml", ".landxml"],
  "application/xml": [".xml", ".landxml"],
  // Archives & Compressed
  "application/zip": [".zip"],
  "application/x-zip-compressed": [".zip"],
  "application/x-zip": [".zip"],
  "multipart/x-zip": [".zip"],
  "application/x-rar-compressed": [".rar"],
  "application/vnd.rar": [".rar"],
  "application/x-rar": [".rar"],
  "application/x-7z-compressed": [".7z"],
  "application/x-tar": [".tar"],
  "application/tar": [".tar"],
  "application/gzip": [".gz", ".tgz"],
  "application/x-gzip": [".gz", ".tgz"],
  "application/x-bzip2": [".bz2"],
  // Video
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
  "video/quicktime": [".mov"],
  // Audio
  "audio/webm": [".webm"],
  "audio/mp4": [".m4a", ".mp4"],
  "audio/ogg": [".ogg"],
  "audio/mpeg": [".mp3"],
  // CAD, BIM, 3D
  "image/vnd.dwg": [".dwg"],
  "image/x-dwg": [".dwg"],
  "application/acad": [".dwg"],
  "application/x-acad": [".dwg"],
  "application/autocad_dwg": [".dwg"],
  "application/dwg": [".dwg"],
  "application/x-dwg": [".dwg"],
  "image/vnd.dxf": [".dxf"],
  "image/x-dxf": [".dxf"],
  "application/dxf": [".dxf"],
  "application/x-dxf": [".dxf"],
  "application/x-step": [".step", ".stp", ".ifc"],
  "model/step": [".step", ".stp"],
  "model/iges": [".iges", ".igs"],
  "model/stl": [".stl"],
  "model/obj": [".obj"],
  "application/vnd.sketchup.skp": [".skp"],
  "application/vnd.google-earth.kml+xml": [".kml"],
  "application/vnd.google-earth.kmz": [".kmz"],
};

export const BLOCKED_FILE_EXTENSIONS: ReadonlySet<string> = BLOCKED_EXTENSIONS;

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

export function normalizeMimeType(
  mimetype: string | undefined | null,
): string {
  if (!mimetype || typeof mimetype !== "string") return "";
  return mimetype.split(";")[0].trim().toLowerCase();
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
  const normalizedMime = normalizeMimeType(mimetype);
  const allowedForMime = MIME_TO_EXTENSIONS[normalizedMime];
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
  allowedExtensions?: ReadonlySet<string>,
): boolean {
  const normalizedMime = normalizeMimeType(mimetype);
  if (!allowedMimeTypes.has(normalizedMime)) return false;

  const ext = sanitizeExtension(path.extname(originalname));
  if (!ext) return false;

  if (allowedExtensions && !allowedExtensions.has(ext)) {
    return false;
  }

  const allowedExts = MIME_TO_EXTENSIONS[normalizedMime];
  if (allowedExts) {
    return allowedExts.includes(ext);
  }

  return true;
}

export function createCloudinaryUpload(category: UploadCategory) {
  return new CloudinaryStorage({
    cloudinary,
    params: async (_req: any, file: Express.Multer.File) => {
      file.mimetype = normalizeMimeType(file.mimetype);
      const ext = resolveStoredExtension(file.mimetype, file.originalname);
      const uid = crypto.randomBytes(8).toString("hex");
      const isPrivate = category === "projects" || category === "documents";
      return {
        folder: category,
        resource_type: "auto" as const,
        type: isPrivate ? ("authenticated" as const) : ("upload" as const),
        public_id: `${uid}${ext}`,
      };
    },
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

export function isTrustedUpstreamHost(rawUrl: string): boolean {
  try {
    if (!rawUrl || typeof rawUrl !== "string") return false;
    const trimmed = rawUrl.trim();
    if (!trimmed) return false;

    const parsed = new URL(trimmed);
    // Enforce HTTPS
    if (parsed.protocol !== "https:") return false;

    // Reject user credentials in URL
    if (parsed.username || parsed.password) return false;

    // Reject non-standard ports
    if (parsed.port && parsed.port !== "443") return false;

    const hostname = parsed.hostname.toLowerCase();

    // Allow only authentic Cloudinary delivery hostnames: res.cloudinary.com or res-1..5.cloudinary.com
    const isCloudinaryHost = /^res(?:-[1-5])?\.cloudinary\.com$/.test(hostname);
    if (isCloudinaryHost) {
      return true;
    }

    // Review custom upload base URL exception: must be explicitly configured, HTTPS, non-loopback, no credentials
    const rawUploadBase = process.env.UPLOAD_BASE_URL?.trim();
    const apiUrl = process.env.API_URL?.trim();
    if (rawUploadBase && rawUploadBase.startsWith("https://")) {
      try {
        const parsedBase = new URL(rawUploadBase);
        if (
          parsedBase.protocol === "https:" &&
          !parsedBase.username &&
          !parsedBase.password &&
          (!parsedBase.port || parsedBase.port === "443")
        ) {
          const baseHost = parsedBase.hostname.toLowerCase();
          const isPrivateOrLoopback =
            baseHost === "localhost" ||
            baseHost.endsWith(".localhost") ||
            baseHost === "127.0.0.1" ||
            baseHost === "::1" ||
            baseHost.startsWith("169.254.") ||
            baseHost.startsWith("10.") ||
            baseHost.startsWith("192.168.") ||
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(baseHost);

          let isApiOrigin = false;
          if (apiUrl) {
            try {
              const parsedApi = new URL(apiUrl);
              if (parsedBase.origin === parsedApi.origin) {
                isApiOrigin = true;
              }
            } catch {
              // ignore
            }
          }

          if (!isPrivateOrLoopback && !isApiOrigin && parsed.origin === parsedBase.origin) {
            return true;
          }
        }
      } catch {
        // ignore malformed base URL
      }
    }

    return false;
  } catch {
    return false;
  }
}

export function getAuthenticatedCloudinaryDownloadUrl(storedUrl: string): string {
  if (!storedUrl || typeof storedUrl !== "string") {
    throw new ApiError(400, "Missing or invalid storage URL");
  }

  const trimmed = storedUrl.trim();
  if (!isTrustedUpstreamHost(trimmed)) {
    throw new ApiError(400, "Untrusted or invalid upstream storage URL host");
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new ApiError(400, "Malformed storage URL");
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length < 4) {
    throw new ApiError(400, "Invalid Cloudinary URL structure: insufficient path segments");
  }

  const cloudNameInUrl = segments[0];
  const configuredCloudName = cloudinary.config().cloud_name || process.env.CLOUDINARY_CLOUD_NAME;
  if (!configuredCloudName) {
    throw new ApiError(500, "Cloudinary cloud name is not configured on the server");
  }
  if (cloudNameInUrl !== configuredCloudName) {
    throw new ApiError(400, "Cloudinary cloud name in URL does not match configured cloud name");
  }

  const configuredApiKey = cloudinary.config().api_key || process.env.CLOUDINARY_API_KEY;
  const configuredApiSecret = cloudinary.config().api_secret || process.env.CLOUDINARY_API_SECRET;
  if (!configuredApiSecret) {
    throw new ApiError(500, "Cloudinary API credentials are not configured on the server");
  }

  const rawResourceType = segments[1]?.toLowerCase();
  if (rawResourceType !== "image" && rawResourceType !== "raw" && rawResourceType !== "video") {
    throw new ApiError(400, `Unsupported Cloudinary resource type: '${rawResourceType}'`);
  }
  const resourceType = rawResourceType as "image" | "raw" | "video";

  const deliveryType = segments[2]?.toLowerCase();
  if (deliveryType === "upload") {
    throw new ApiError(
      400,
      "Asset has public delivery type ('upload') and cannot be served via authenticated download; historical asset must be migrated to 'authenticated' type",
    );
  }
  if (deliveryType !== "authenticated") {
    throw new ApiError(400, `Unsupported Cloudinary delivery type: '${deliveryType}'; expected 'authenticated'`);
  }

  const remainingSegments = segments.slice(3);
  if (remainingSegments.length === 0) {
    throw new ApiError(400, "Invalid Cloudinary URL: missing public ID");
  }

  // Reject unexpected signature segments
  if (remainingSegments.some((s) => /^s--.*--$/.test(s))) {
    throw new ApiError(400, "Unexpected signature segment in stored Cloudinary URL");
  }

  // Locate optional version segment (v12345...)
  const versionIdx = remainingSegments.findIndex((s) => /^v\d+$/.test(s));

  // If there are segments before the version segment, they are unexpected transformations
  if (versionIdx > 0) {
    throw new ApiError(
      400,
      `Unexpected transformation segment in Cloudinary URL: '${remainingSegments.slice(0, versionIdx).join("/")}'`,
    );
  }

  let version: string | undefined = undefined;
  let publicIdSegments: string[];

  if (versionIdx === 0) {
    version = remainingSegments[0].slice(1); // strip leading 'v'
    publicIdSegments = remainingSegments.slice(1);
  } else {
    // No version segment found: check if first segment looks like a transformation
    const firstSegment = remainingSegments[0];
    if (firstSegment.includes(",") || /^[a-z]{1,3}_[a-z0-9_-]+/i.test(firstSegment)) {
      throw new ApiError(400, `Unexpected transformation segment in Cloudinary URL: '${firstSegment}'`);
    }
    publicIdSegments = remainingSegments;
  }

  if (publicIdSegments.length === 0) {
    throw new ApiError(400, "Invalid Cloudinary URL: missing public ID after version segment");
  }

  const publicId = publicIdSegments.join("/");
  if (publicId.includes("..") || publicId.startsWith("/")) {
    throw new ApiError(400, "Invalid characters in Cloudinary public ID");
  }

  try {
    const signedUrl = cloudinary.url(publicId, {
      cloud_name: configuredCloudName,
      api_key: configuredApiKey,
      api_secret: configuredApiSecret,
      resource_type: resourceType,
      type: "authenticated",
      sign_url: true,
      secure: true,
      version: version,
    });

    if (!signedUrl || !signedUrl.includes("/s--")) {
      throw new ApiError(500, "Cloudinary failed to generate a signed authenticated URL");
    }

    return signedUrl;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, `Failed to generate authenticated download URL: ${err?.message || "Unknown error"}`);
  }
}


export async function deleteUploadFile(storedPath: string | null | undefined): Promise<void> {
  if (!storedPath) return;

  try {
    // If it's a Cloudinary URL, extract the public_id and delete it
    if (storedPath.includes("cloudinary.com")) {
      // URL format: https://res.cloudinary.com/<cloud>/[image|raw|video]/[upload|authenticated]/v<version>/<folder>/<public_id>
      const url = new URL(storedPath);
      const segments = url.pathname.split("/");
      let typeIdx = segments.indexOf("upload");
      let deliveryType: "upload" | "authenticated" = "upload";
      if (typeIdx === -1) {
        typeIdx = segments.indexOf("authenticated");
        deliveryType = "authenticated";
      }
      if (typeIdx >= 0 && typeIdx + 2 < segments.length) {
        // Detect resource_type from URL path (image, raw, video)
        const resourceType = (segments[typeIdx - 1] || "image").toLowerCase();
        // Skip the version segment (v12345...) — public_id is all segments after it
        let publicId = segments.slice(typeIdx + 2).join("/");
        if (resourceType === "image") {
          // For images, Cloudinary appends the format extension to the URL, but the public_id does not have it
          const lastDot = publicId.lastIndexOf(".");
          if (lastDot > 0) {
            publicId = publicId.slice(0, lastDot);
          }
        }
        if (publicId) {
          await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType as "image" | "raw" | "video",
            type: deliveryType,
            invalidate: true,
          });
        }
      }
      return;
    }

    // Fallback for old local files (if they exist)
    const absolute = storedPathToAbsolute(storedPath);
    if (absolute && fs.existsSync(absolute)) {
      try {
        fs.unlinkSync(absolute);
      } catch (err) {
        console.error("Failed to delete local file:", err);
      }
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
  allowedExtensions?: ReadonlySet<string>;
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
      file.mimetype = normalizeMimeType(file.mimetype);
      const ext = path.extname(file.originalname).toLowerCase();
      if (BLOCKED_EXTENSIONS.has(ext)) {
        cb(new Error("FILE_TYPE_BLOCKED_DANGEROUS"));
        return;
      }
      if (
        isAllowedUpload(
          file.mimetype,
          file.originalname,
          options.allowedMimeTypes,
          options.allowedExtensions,
        )
      ) {
        cb(null, true);
        return;
      }
      cb(new Error("FILE_FORMAT_NOT_ALLOWED"));
    },
  });
}
