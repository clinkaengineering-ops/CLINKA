/**
 * imageProcessing.ts
 *
 * Pure image processing and conversion helper module for the chat image preview & editor.
 * Uses native browser Canvas and ImageBitmap APIs without third-party npm dependencies.
 *
 * Capabilities:
 *  - Validate editable image types (JPEG, PNG, WebP only; GIF and other media pass through).
 *  - Decode images respecting EXIF orientation (createImageBitmap with fallback to HTMLImageElement).
 *  - Calculate safe downscaled dimensions (max longest side 2048px, max 16M pixels for iOS Safari).
 *  - Export canvas to File with matching MIME type and extension, quality compression, and size guards.
 *  - Memory lifecycle management (ImageBitmap closing and object URL revoking).
 */

// ─── Constants ──────────────────────────────────────────────────────────────

export const MAX_LONGEST_SIDE = 2048;
export const MAX_CANVAS_PIXELS = 16_777_216; // 16 megapixels (~iOS Safari canvas area limit)
export const MAX_EXPORT_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const DEFAULT_JPEG_QUALITY = 0.85;
export const DEFAULT_WEBP_QUALITY = 0.85;
export const FALLBACK_RE_ENCODE_QUALITIES = [0.7, 0.5, 0.35] as const;

export const EDITABLE_IMAGE_MIMES = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const EDITABLE_IMAGE_EXTENSIONS = new Set<string>([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

// ─── Types ──────────────────────────────────────────────────────────────────

export type EditableMimeType = "image/jpeg" | "image/png" | "image/webp";
export type EditableExtension = ".jpg" | ".png" | ".webp";

export interface Dimensions {
  width: number;
  height: number;
}

export interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
}

export interface ImageOutputFormat {
  mimeType: EditableMimeType;
  extension: EditableExtension;
  quality: number;
}

export interface ExportImageOptions {
  mimeType?: EditableMimeType;
  quality?: number;
}

// ─── 1. Validation: isEditableImage ─────────────────────────────────────────

/**
 * Checks whether a file is an editable image.
 *
 * Per requirements:
 *  - Returns TRUE only for image/jpeg, image/png, and image/webp.
 *  - GIF (image/gif) and everything else (PDF, audio, CAD, archives) return FALSE.
 *  - Checks MIME first; falls back to extension if MIME is missing or generic octet-stream.
 */
export function isEditableImage(
  file?: { type?: string; name?: string } | null,
): boolean {
  if (!file) return false;

  const rawMime =
    typeof file.type === "string" ? file.type.trim().toLowerCase() : "";

  if (rawMime) {
    if (EDITABLE_IMAGE_MIMES.has(rawMime)) {
      return true;
    }
    // Explicit non-editable MIME (e.g., "image/gif", "image/svg+xml", "application/pdf")
    if (
      rawMime !== "application/octet-stream" &&
      rawMime !== "binary/octet-stream"
    ) {
      return false;
    }
  }

  // Fallback: check extension if MIME was empty or generic binary
  const rawName =
    typeof file.name === "string" ? file.name.trim().toLowerCase() : "";
  const match = rawName.match(/\.[0-9a-z]+$/i);
  if (!match) return false;

  const ext = match[0].toLowerCase();
  return EDITABLE_IMAGE_EXTENSIONS.has(ext);
}

// ─── 2. Decoding: loadImage & withDecodedImage ─────────────────────────────

/**
 * Decodes an image file respecting EXIF orientation.
 *
 * Strategy:
 *  1. Attempts `createImageBitmap(file, { imageOrientation: "from-image" })` for native
 *     hardware decoding and automatic EXIF orientation normalization.
 *  2. Falls back to `HTMLImageElement` via object URL if `createImageBitmap` fails or is unsupported.
 *  3. Returns a typed `DecodedImage` object containing a `close()` function to free memory.
 */
export async function loadImage(file: File | Blob): Promise<DecodedImage> {
  if (!file || !(file instanceof Blob)) {
    throw new Error("Invalid file provided to loadImage: expected a File or Blob.");
  }

  // Attempt 1: createImageBitmap with { imageOrientation: "from-image" }
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      let closed = false;
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => {
          if (!closed) {
            closed = true;
            bitmap.close();
          }
        },
      };
    } catch {
      // Some environments or older WebKit versions throw on the options parameter
      try {
        const bitmap = await createImageBitmap(file);
        let closed = false;
        return {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          close: () => {
            if (!closed) {
              closed = true;
              bitmap.close();
            }
          },
        };
      } catch {
        // Fall through to HTMLImageElement fallback
      }
    }
  }

  // Attempt 2: HTMLImageElement fallback using an object URL
  return new Promise<DecodedImage>((resolve, reject) => {
    let objectUrl = "";
    try {
      objectUrl = URL.createObjectURL(file);
    } catch (err) {
      reject(
        new Error(
          `Failed to create object URL for image: ${
            err instanceof Error ? err.message : String(err)
          }`,
        ),
      );
      return;
    }

    const img = new Image();
    let cleanedUp = false;

    const cleanup = () => {
      if (!cleanedUp) {
        cleanedUp = true;
        if (objectUrl) {
          try {
            URL.revokeObjectURL(objectUrl);
          } catch {
            // ignore revocation errors
          }
        }
      }
    };

    img.onload = () => {
      resolve({
        source: img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        close: cleanup,
      });
    };

    img.onerror = () => {
      cleanup();
      reject(
        new Error("Failed to decode image file: image could not be loaded."),
      );
    };

    img.src = objectUrl;
  });
}

/**
 * Convenient scope helper that automatically closes/revokes image resources in finally.
 */
export async function withDecodedImage<T>(
  file: File | Blob,
  fn: (decoded: DecodedImage) => Promise<T> | T,
): Promise<T> {
  const decoded = await loadImage(file);
  try {
    return await fn(decoded);
  } finally {
    decoded.close();
  }
}

// ─── 3. Downscale: calculateDownscaledDimensions & renderToCanvas ───────────

/**
 * Calculates aspect-ratio preserving dimensions such that:
 *  - Longest side does not exceed `maxLongestSide` (2048 px default).
 *  - Total canvas area does not exceed `maxCanvasPixels` (16M px default, iOS Safari limit).
 */
export function calculateDownscaledDimensions(
  width: number,
  height: number,
  maxLongestSide = MAX_LONGEST_SIDE,
  maxCanvasPixels = MAX_CANVAS_PIXELS,
): Dimensions {
  if (
    width <= 0 ||
    height <= 0 ||
    !Number.isFinite(width) ||
    !Number.isFinite(height)
  ) {
    throw new Error(`Invalid image dimensions: ${width}x${height}`);
  }

  let targetWidth = width;
  let targetHeight = height;

  // 1. Scale down if longest side exceeds maxLongestSide
  const longestSide = Math.max(targetWidth, targetHeight);
  if (longestSide > maxLongestSide) {
    const scale = maxLongestSide / longestSide;
    targetWidth = Math.max(1, Math.round(targetWidth * scale));
    targetHeight = Math.max(1, Math.round(targetHeight * scale));
  }

  // 2. Ensure total pixels do not exceed maxCanvasPixels
  const totalPixels = targetWidth * targetHeight;
  if (totalPixels > maxCanvasPixels) {
    const pixelScale = Math.sqrt(maxCanvasPixels / totalPixels);
    targetWidth = Math.max(1, Math.round(targetWidth * pixelScale));
    targetHeight = Math.max(1, Math.round(targetHeight * pixelScale));
  }

  return { width: targetWidth, height: targetHeight };
}

/**
 * Renders a source image onto an appropriately downscaled canvas element.
 */
export function renderToDownscaledCanvas(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
): HTMLCanvasElement {
  const { width, height } = calculateDownscaledDimensions(
    sourceWidth,
    sourceHeight,
  );
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to acquire 2D rendering context from canvas.");
  }

  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

// ─── 4. Export: format detection, filename sanitization, exportEditedImage ───

/**
 * Determines the output MIME type, extension, and default quality from the source file.
 */
export function determineOutputFormat(
  file: { type?: string; name?: string },
): ImageOutputFormat {
  const mime =
    typeof file.type === "string" ? file.type.trim().toLowerCase() : "";
  const ext =
    typeof file.name === "string"
      ? file.name.trim().toLowerCase().match(/\.[0-9a-z]+$/i)?.[0] ?? ""
      : "";

  if (mime === "image/png" || (!mime && ext === ".png")) {
    return {
      mimeType: "image/png",
      extension: ".png",
      quality: 1.0,
    };
  }

  if (mime === "image/webp" || (!mime && ext === ".webp")) {
    return {
      mimeType: "image/webp",
      extension: ".webp",
      quality: DEFAULT_WEBP_QUALITY,
    };
  }

  // Default to JPEG
  return {
    mimeType: "image/jpeg",
    extension: ".jpg",
    quality: DEFAULT_JPEG_QUALITY,
  };
}

/**
 * Preserves the original file's base name and updates its extension to match the output MIME type.
 * Required because the backend strictly rejects uploads where extension does not match MIME.
 */
export function getOutputFilename(
  originalName: string,
  targetExtension: EditableExtension,
): string {
  const trimmed = originalName.trim();
  if (!trimmed) {
    return `image${targetExtension}`;
  }

  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot <= 0) {
    return `${trimmed}${targetExtension}`;
  }

  const baseName = trimmed.slice(0, lastDot);
  return `${baseName}${targetExtension}`;
}

/**
 * Converts a canvas element to a Blob using Promise wrapper around canvas.toBlob.
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    if (typeof canvas?.toBlob !== "function") {
      reject(new Error("Canvas toBlob is not supported in this environment."));
      return;
    }
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas toBlob returned null."));
        }
      },
      mimeType,
      quality,
    );
  });
}

/**
 * Exports an edited canvas into a File.
 *
 * Rules:
 *  - JPEG source: image/jpeg, quality 0.85
 *  - PNG source: image/png
 *  - WebP source: image/webp, quality 0.85
 *  - Matches extension to output MIME type (.jpg, .png, .webp) to satisfy backend validation.
 *  - If result exceeds 10 MB, re-encodes at lower qualities ([0.70, 0.50, 0.35]).
 *  - If result still exceeds 10 MB, throws a clear error.
 */
export async function exportEditedImage(
  canvas: HTMLCanvasElement,
  originalFile: File,
  options?: ExportImageOptions,
): Promise<File> {
  const defaultFormat = determineOutputFormat(originalFile);
  const mimeType = options?.mimeType ?? defaultFormat.mimeType;

  // Derive matching extension from final mimeType
  const extension: EditableExtension =
    mimeType === "image/png"
      ? ".png"
      : mimeType === "image/webp"
        ? ".webp"
        : ".jpg";

  const filename = getOutputFilename(originalFile.name, extension);
  let currentQuality = options?.quality ?? defaultFormat.quality;

  let blob = await canvasToBlob(canvas, mimeType, currentQuality);

  // If over 10 MB and format is lossy, attempt lower qualities
  if (blob.size > MAX_EXPORT_FILE_BYTES && mimeType !== "image/png") {
    for (const fallbackQuality of FALLBACK_RE_ENCODE_QUALITIES) {
      if (fallbackQuality >= currentQuality) continue;
      currentQuality = fallbackQuality;
      const candidateBlob = await canvasToBlob(
        canvas,
        mimeType,
        currentQuality,
      );
      if (candidateBlob.size < blob.size) {
        blob = candidateBlob;
      }
      if (blob.size <= MAX_EXPORT_FILE_BYTES) {
        break;
      }
    }
  }

  // Guard against exceeding maximum allowed size
  if (blob.size > MAX_EXPORT_FILE_BYTES) {
    const sizeMb = (blob.size / (1024 * 1024)).toFixed(1);
    const maxMb = (MAX_EXPORT_FILE_BYTES / (1024 * 1024)).toFixed(0);
    throw new Error(
      `Image is too large (${sizeMb} MB). Maximum allowed size after compression is ${maxMb} MB.`,
    );
  }

  return new File([blob], filename, {
    type: mimeType,
    lastModified: Date.now(),
  });
}
