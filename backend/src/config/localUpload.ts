import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";

export function createLocalUpload(subFolder: string) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, "../../../uploads");
      const targetDir = path.join(uploadDir, subFolder);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      cb(null, targetDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = crypto.randomUUID();
      const ext = path.extname(file.originalname).toLowerCase() || ".bin";
      cb(null, `${uniqueSuffix}${ext}`);
    }
  });
}

export function getRelativeUploadUrl(file?: Express.Multer.File): string | undefined {
  if (!file) return undefined;
  // If it's somehow a Cloudinary URL from legacy fallback, keep it
  if (file.path.startsWith("http")) return file.path;
  
  // Convert absolute path to /uploads/... relative path
  const normalizedPath = file.path.replace(/\\/g, "/");
  const uploadsIndex = normalizedPath.indexOf("/uploads/");
  if (uploadsIndex !== -1) {
    return normalizedPath.substring(uploadsIndex);
  }
  return `/uploads/${file.filename}`;
}
