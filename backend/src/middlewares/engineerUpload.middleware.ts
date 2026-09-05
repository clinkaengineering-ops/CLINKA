/**
 * engineerUpload.middleware.ts
 *
 * Combined multer middleware for engineer registration routes.
 *
 * The old approach chained two separate multer instances:
 *   upload.fields([{ name: "document" }])   → documents/
 *   imageUpload.array("portfolio", 10)      → images/
 *
 * This doesn't work because the first multer consumes the entire multipart
 * stream and throws LIMIT_UNEXPECTED_FILE when it sees "portfolio".
 *
 * This middleware handles BOTH field names in a single multer instance,
 * routing each to the correct storage directory and mime filter.
 */

import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";
import { UploadCategory } from "../config/upload";

// ── Per-field config ──────────────────────────────────────────────────────────

const FIELD_CONFIG: Record<
  string,
  { category: UploadCategory; allowedMimes: ReadonlySet<string> }
> = {
  document: {
    category: "documents",
    allowedMimes: new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ]),
  },
  portfolio: {
    category: "images",
    allowedMimes: new Set(["image/jpeg", "image/png", "image/webp"]),
  },
};

// ── Storage: routes each field to its own directory ───────────────────────────

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => {
    const config = FIELD_CONFIG[file.fieldname];
    const category = config?.category ?? "documents";
    const folder = category === "documents" ? "engineer-docs" : "portfolio";
    
    return {
      folder,
      resource_type: "auto",
    };
  },
});

// ── File filter: per-field mime validation ────────────────────────────────────

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  const config = FIELD_CONFIG[file.fieldname];
  if (!config) {
    // Unknown field name — reject
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    return;
  }
  if (!config.allowedMimes.has(file.mimetype)) {
    cb(new Error("FILE_FORMAT_NOT_ALLOWED"));
    return;
  }
  cb(null, true);
}

// ── Export: single multer instance that handles both fields ───────────────────

const engineerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
  },
});

/** Use on routes that accept both a credential document and portfolio images. */
export const engineerDocAndPortfolio = engineerUpload.fields([
  { name: "document", maxCount: 1 },
  { name: "portfolio", maxCount: 10 },
]);

/** Use on routes that accept only portfolio images (e.g. resume registration). */
export const engineerPortfolioOnly = engineerUpload.array("portfolio", 10);
