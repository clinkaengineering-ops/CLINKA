/**
 * resizeImageBeforeUpload.ts
 *
 * Resizes an image in the browser (via Canvas) before it is uploaded.
 * No server round-trip, no extra dependencies — pure browser APIs.
 *
 * Strategy:
 *  - Downscale to MAX_WIDTH if the image is wider
 *  - Re-encode as JPEG at quality 0.85 (visually lossless, ~40% smaller)
 *  - If anything fails, return the original File untouched (safe fallback)
 */

const MAX_WIDTH = 2000;   // px — covers 4K displays comfortably
const QUALITY = 0.85;     // 0–1; 0.85 is the sweet spot for quality vs size

/**
 * Resize and compress an image File in the browser before uploading.
 *
 * @param file  The File object from an <input type="file"> or drag-and-drop
 * @returns     A new (smaller) File, or the original if resize is not needed / fails
 */
export async function resizeImageBeforeUpload(file: File): Promise<File> {
  // Only process image types — pass everything else straight through
  if (!file.type.startsWith("image/")) return file;

  try {
    const resized = await drawAndEncode(file);

    // Safety: only use the resized blob if it's actually smaller
    if (resized.size >= file.size) return file;

    // Update the extension to match the actual output format (.jpg)
    const newName = file.name.replace(/\.[^.]+$/, ".jpg");
    return new File([resized], newName, { type: "image/jpeg" });
  } catch {
    // Canvas API failed (e.g. CORS, unsupported format) — fall back silently
    return file;
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image failed to load"));
    };
    img.src = url;
  });
}

async function drawAndEncode(file: File): Promise<Blob> {
  const img = await loadImage(file);

  // Calculate target dimensions (only downscale, never upscale)
  const scale = img.naturalWidth > MAX_WIDTH ? MAX_WIDTH / img.naturalWidth : 1;
  const width = Math.round(img.naturalWidth * scale);
  const height = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob returned null"))),
      "image/jpeg",
      QUALITY
    );
  });
}
