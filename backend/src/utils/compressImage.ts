/**
 * compressImage.ts  (server-side)
 *
 * Compresses an uploaded image buffer using Sharp.
 * - Resizes to MAX_WIDTH if wider (preserves aspect ratio)
 * - Re-encodes as JPEG quality 85 (mozjpeg encoder) or WebP quality 82
 * - Safe fallback: returns the original buffer untouched if anything fails
 *
 * Install: npm install sharp
 * Types:   npm install --save-dev @types/sharp
 */

import sharp from "sharp";

const MAX_WIDTH = 2000;
const JPEG_QUALITY = 85;
const WEBP_QUALITY = 82;

export interface CompressResult {
  buffer: Buffer;
  mimeType: "image/jpeg" | "image/webp";
  originalBytes: number;
  finalBytes: number;
  usedFallback: boolean;
}

/**
 * Compress an image buffer received from a file upload.
 *
 * @param input   Raw buffer from multer / busboy / formidable
 * @param format  Output format — 'jpeg' works everywhere, 'webp' is ~25% smaller
 */
export async function compressImage(
  input: Buffer,
  format: "jpeg" | "webp" = "jpeg"
): Promise<CompressResult> {
  const originalBytes = input.length;

  try {
    const pipeline = sharp(input)
      .rotate()                        // auto-correct EXIF orientation
      .resize({
        width: MAX_WIDTH,
        withoutEnlargement: true,      // never upscale a small image
        fit: "inside",
      });

    const compressed =
      format === "webp"
        ? await pipeline.webp({ quality: WEBP_QUALITY, effort: 4 }).toBuffer()
        : await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true }).toBuffer();

    // Only use the result if it's actually smaller
    if (compressed.length >= originalBytes) {
      return {
        buffer: input,
        mimeType: "image/jpeg",
        originalBytes,
        finalBytes: originalBytes,
        usedFallback: true,
      };
    }

    return {
      buffer: compressed,
      mimeType: format === "webp" ? "image/webp" : "image/jpeg",
      originalBytes,
      finalBytes: compressed.length,
      usedFallback: false,
    };
  } catch {
    // Sharp failed (corrupt upload, unsupported format, etc.) — keep original
    return {
      buffer: input,
      mimeType: "image/jpeg",
      originalBytes,
      finalBytes: originalBytes,
      usedFallback: true,
    };
  }
}
