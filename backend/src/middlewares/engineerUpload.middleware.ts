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

import path from "path";
import crypto from "crypto";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";
import {
  UploadCategory,
  BLOCKED_FILE_EXTENSIONS,
  isAllowedUpload,
  resolveStoredExtension,
} from "../config/upload";

// ── Per-field config ──────────────────────────────────────────────────────────

const FIELD_CONFIG: Record<
  string,
  { category: UploadCategory; allowedMimes: ReadonlySet<string> }
> = {
  portfolio: {
    category: "images",
    allowedMimes: new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ]),
  },
};

// ── Storage: routes each field to its own directory with unique public_id ─────

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => {
    const ext = resolveStoredExtension(file.mimetype, file.originalname);
    const uid = crypto.randomBytes(8).toString("hex");
    const folder = "portfolio";

    return {
      folder,
      resource_type: "auto",
      public_id: `${uid}${ext}`,
    };
  },
});

// ── File filter: per-field mime and extension validation ──────────────────────

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

  const ext = path.extname(file.originalname).toLowerCase();
  if (BLOCKED_FILE_EXTENSIONS.has(ext)) {
    cb(new Error("FILE_TYPE_BLOCKED_DANGEROUS"));
    return;
  }

  if (
    !config.allowedMimes.has(file.mimetype) ||
    !isAllowedUpload(file.mimetype, file.originalname, config.allowedMimes)
  ) {
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


/** Use on routes that accept only portfolio images (e.g. resume registration). */
export const engineerPortfolioOnly = engineerUpload.fields([{ name: "portfolio", maxCount: 10 }]);
