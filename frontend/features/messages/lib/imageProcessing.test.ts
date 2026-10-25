import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isEditableImage,
  determineOutputFormat,
  getOutputFilename,
  calculateDownscaledDimensions,
  loadImage,
  withDecodedImage,
  renderToDownscaledCanvas,
  canvasToBlob,
  exportEditedImage,
  MAX_LONGEST_SIDE,
  MAX_CANVAS_PIXELS,
  MAX_EXPORT_FILE_BYTES,
  DEFAULT_JPEG_QUALITY,
  DEFAULT_WEBP_QUALITY,
} from "./imageProcessing";

describe("imageProcessing helper module", () => {
  // ─── 1. isEditableImage ───────────────────────────────────────────────────

  describe("isEditableImage", () => {
    it("returns true for supported MIME types", () => {
      expect(isEditableImage({ type: "image/jpeg", name: "photo.jpg" })).toBe(true);
      expect(isEditableImage({ type: "image/png", name: "diagram.png" })).toBe(true);
      expect(isEditableImage({ type: "image/webp", name: "hero.webp" })).toBe(true);
      expect(isEditableImage({ type: "IMAGE/JPEG", name: "uppercase.jpg" })).toBe(true);
    });

    it("returns false for GIF images (GIFs must keep working as before without opening editor)", () => {
      expect(isEditableImage({ type: "image/gif", name: "animation.gif" })).toBe(false);
      expect(isEditableImage({ type: "", name: "animation.gif" })).toBe(false);
      expect(isEditableImage({ type: "image/gif", name: "masquerading.jpg" })).toBe(false);
    });

    it("returns false for non-editable image types (SVG, BMP, TIFF, HEIC)", () => {
      expect(isEditableImage({ type: "image/svg+xml", name: "vector.svg" })).toBe(false);
      expect(isEditableImage({ type: "image/bmp", name: "drawing.bmp" })).toBe(false);
      expect(isEditableImage({ type: "image/tiff", name: "scan.tiff" })).toBe(false);
      expect(isEditableImage({ type: "image/heic", name: "live.heic" })).toBe(false);
    });

    it("returns false for non-image documents, archives, audio, and CAD/BIM files", () => {
      expect(isEditableImage({ type: "application/pdf", name: "document.pdf" })).toBe(false);
      expect(isEditableImage({ type: "audio/webm", name: "voice.webm" })).toBe(false);
      expect(isEditableImage({ type: "audio/mpeg", name: "song.mp3" })).toBe(false);
      expect(isEditableImage({ type: "application/zip", name: "archive.zip" })).toBe(false);
      expect(isEditableImage({ type: "application/octet-stream", name: "model.rvt" })).toBe(false);
      expect(isEditableImage({ type: "image/vnd.dwg", name: "plan.dwg" })).toBe(false);
    });

    it("falls back to extension when MIME type is missing or generic octet-stream", () => {
      expect(isEditableImage({ type: "", name: "camera.jpg" })).toBe(true);
      expect(isEditableImage({ type: "", name: "photo.jpeg" })).toBe(true);
      expect(isEditableImage({ type: "", name: "screenshot.png" })).toBe(true);
      expect(isEditableImage({ type: "", name: "graphic.webp" })).toBe(true);
      expect(isEditableImage({ type: "", name: "CAPS.JPG" })).toBe(true);
      expect(isEditableImage({ type: "application/octet-stream", name: "blob.png" })).toBe(true);
      expect(isEditableImage({ type: "application/octet-stream", name: "raw.pdf" })).toBe(false);
    });

    it("returns false for null, undefined, or empty files", () => {
      expect(isEditableImage(null)).toBe(false);
      expect(isEditableImage(undefined)).toBe(false);
      expect(isEditableImage({})).toBe(false);
      expect(isEditableImage({ name: "no-extension" })).toBe(false);
    });
  });

  // ─── 2. Output format & filename handling ─────────────────────────────────

  describe("determineOutputFormat", () => {
    it("returns PNG format for PNG files", () => {
      const format = determineOutputFormat({ type: "image/png", name: "chart.png" });
      expect(format.mimeType).toBe("image/png");
      expect(format.extension).toBe(".png");
      expect(format.quality).toBe(1.0);
    });

    it("returns WebP format for WebP files", () => {
      const format = determineOutputFormat({ type: "image/webp", name: "hero.webp" });
      expect(format.mimeType).toBe("image/webp");
      expect(format.extension).toBe(".webp");
      expect(format.quality).toBe(DEFAULT_WEBP_QUALITY);
    });

    it("defaults to JPEG format for JPEG files or unknown/empty mime types", () => {
      const formatJpeg = determineOutputFormat({ type: "image/jpeg", name: "photo.jpg" });
      expect(formatJpeg.mimeType).toBe("image/jpeg");
      expect(formatJpeg.extension).toBe(".jpg");
      expect(formatJpeg.quality).toBe(DEFAULT_JPEG_QUALITY);

      const formatFallback = determineOutputFormat({ type: "", name: "photo.jpeg" });
      expect(formatFallback.mimeType).toBe("image/jpeg");
      expect(formatFallback.extension).toBe(".jpg");
    });
  });

  describe("getOutputFilename", () => {
    it("preserves the original base name and applies matching target extension", () => {
      expect(getOutputFilename("vacation.png", ".jpg")).toBe("vacation.jpg");
      expect(getOutputFilename("screenshot.jpeg", ".png")).toBe("screenshot.png");
      expect(getOutputFilename("graphic.webp", ".webp")).toBe("graphic.webp");
    });

    it("handles files with multiple dots correctly", () => {
      expect(getOutputFilename("project.v2.final.png", ".jpg")).toBe("project.v2.final.jpg");
      expect(getOutputFilename("site.plan.revision.3.jpeg", ".png")).toBe("site.plan.revision.3.png");
    });

    it("handles files without an extension", () => {
      expect(getOutputFilename("avatar", ".jpg")).toBe("avatar.jpg");
      expect(getOutputFilename("blob_file", ".webp")).toBe("blob_file.webp");
    });

    it("handles hidden / dot files or empty names gracefully", () => {
      expect(getOutputFilename(".hiddenfile", ".jpg")).toBe(".hiddenfile.jpg");
      expect(getOutputFilename("", ".png")).toBe("image.png");
      expect(getOutputFilename("   ", ".webp")).toBe("image.webp");
    });
  });

  // ─── 3. Downscale dimensions logic ────────────────────────────────────────

  describe("calculateDownscaledDimensions", () => {
    it("leaves dimensions unchanged when already within limits", () => {
      const result = calculateDownscaledDimensions(1200, 800);
      expect(result).toEqual({ width: 1200, height: 800 });
    });

    it("scales down when width is the longest side exceeding 2048 px", () => {
      const result = calculateDownscaledDimensions(4096, 2048);
      expect(result).toEqual({ width: 2048, height: 1024 });
    });

    it("scales down when height is the longest side exceeding 2048 px", () => {
      const result = calculateDownscaledDimensions(1500, 3000);
      // scale = 2048 / 3000 = 0.682666...
      // width = Math.round(1500 * (2048 / 3000)) = 1024
      expect(result).toEqual({ width: 1024, height: 2048 });
    });

    it("scales square images proportionally to 2048x2048", () => {
      const result = calculateDownscaledDimensions(3500, 3500);
      expect(result).toEqual({ width: 2048, height: 2048 });
    });

    it("strictly preserves aspect ratio within rounding precision", () => {
      const originalW = 4032;
      const originalH = 3024; // 4:3
      const result = calculateDownscaledDimensions(originalW, originalH);
      expect(result.width).toBe(2048);
      expect(result.height).toBe(1536);
      expect(result.width / result.height).toBeCloseTo(originalW / originalH, 3);
    });

    it("ensures total pixels never exceed maxCanvasPixels (16M px)", () => {
      // Extremely high aspect ratio or large image with custom limits
      const customMaxPixels = 1_000_000;
      const result = calculateDownscaledDimensions(2000, 1000, 3000, customMaxPixels);
      expect(result.width * result.height).toBeLessThanOrEqual(customMaxPixels);
      expect(result.width / result.height).toBeCloseTo(2, 1);
    });

    it("throws an error for non-positive or invalid dimensions", () => {
      expect(() => calculateDownscaledDimensions(0, 500)).toThrow(/Invalid image dimensions/);
      expect(() => calculateDownscaledDimensions(-100, 200)).toThrow(/Invalid image dimensions/);
      expect(() => calculateDownscaledDimensions(NaN, 100)).toThrow(/Invalid image dimensions/);
      expect(() => calculateDownscaledDimensions(100, Infinity)).toThrow(/Invalid image dimensions/);
    });
  });

  // ─── 4. Image decoding & memory cleanup ───────────────────────────────────

  describe("loadImage and memory management", () => {
    let originalCreateImageBitmap: any;
    let originalURL: typeof URL;
    let mockRevokeObjectURL: any;
    let mockCreateObjectURL: any;

    beforeEach(() => {
      originalCreateImageBitmap = (globalThis as any).createImageBitmap;
      originalURL = globalThis.URL;

      mockCreateObjectURL = vi.fn().mockReturnValue("blob:http://localhost/test-image");
      mockRevokeObjectURL = vi.fn();

      globalThis.URL.createObjectURL = mockCreateObjectURL;
      globalThis.URL.revokeObjectURL = mockRevokeObjectURL;
    });

    afterEach(() => {
      (globalThis as any).createImageBitmap = originalCreateImageBitmap;
      globalThis.URL = originalURL;
      vi.restoreAllMocks();
    });

    it("decodes image using createImageBitmap with imageOrientation 'from-image' when available", async () => {
      const mockBitmap = {
        width: 1920,
        height: 1080,
        close: vi.fn(),
      };

      const mockCreateImageBitmap = vi.fn().mockResolvedValue(mockBitmap);
      (globalThis as any).createImageBitmap = mockCreateImageBitmap;

      const file = new File(["dummy"], "photo.jpg", { type: "image/jpeg" });
      const decoded = await loadImage(file);

      expect(mockCreateImageBitmap).toHaveBeenCalledWith(file, {
        imageOrientation: "from-image",
      });
      expect(decoded.width).toBe(1920);
      expect(decoded.height).toBe(1080);
      expect(decoded.source).toBe(mockBitmap);

      // Verify memory cleanup
      decoded.close();
      expect(mockBitmap.close).toHaveBeenCalledTimes(1);

      // Verify close is idempotent
      decoded.close();
      expect(mockBitmap.close).toHaveBeenCalledTimes(1);
    });

    it("falls back to HTMLImageElement when createImageBitmap fails or is unavailable", async () => {
      (globalThis as any).createImageBitmap = undefined;

      const file = new File(["dummy"], "photo.png", { type: "image/png" });

      // Mock HTMLImageElement image loading in JSDOM
      const originalImage = globalThis.Image;
      class MockImage {
        width = 800;
        height = 600;
        naturalWidth = 800;
        naturalHeight = 600;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        private _src = "";

        set src(value: string) {
          this._src = value;
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
        get src() {
          return this._src;
        }
      }
      (globalThis as any).Image = MockImage;

      try {
        const decoded = await loadImage(file);

        expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
        expect(decoded.width).toBe(800);
        expect(decoded.height).toBe(600);

        // Verify close() revokes the created object URL
        decoded.close();
        expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/test-image");

        // Verify close is idempotent
        decoded.close();
        expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
      } finally {
        globalThis.Image = originalImage;
      }
    });

    it("cleans up object URL and throws a clear error if HTMLImageElement loading fails", async () => {
      (globalThis as any).createImageBitmap = undefined;

      const file = new File(["corrupted"], "bad.jpg", { type: "image/jpeg" });

      const originalImage = globalThis.Image;
      class BrokenImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_val: string) {
          setTimeout(() => {
            if (this.onerror) this.onerror();
          }, 0);
        }
      }
      (globalThis as any).Image = BrokenImage;

      try {
        await expect(loadImage(file)).rejects.toThrow(/Failed to decode image file/);
        expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/test-image");
      } finally {
        globalThis.Image = originalImage;
      }
    });

    it("withDecodedImage automatically frees memory even if consumer throws", async () => {
      const mockBitmap = {
        width: 640,
        height: 480,
        close: vi.fn(),
      };
      (globalThis as any).createImageBitmap = vi.fn().mockResolvedValue(mockBitmap);

      const file = new File(["dummy"], "test.jpg", { type: "image/jpeg" });

      await expect(
        withDecodedImage(file, () => {
          throw new Error("Consumer processing failed");
        }),
      ).rejects.toThrow("Consumer processing failed");

      // Verify close was executed despite the consumer error
      expect(mockBitmap.close).toHaveBeenCalledTimes(1);
    });
  });

  // ─── 5. Canvas rendering and export logic ──────────────────────────────────

  describe("renderToDownscaledCanvas", () => {
    it("draws image onto downscaled canvas with correct context calls", () => {
      const mockCtx = {
        drawImage: vi.fn(),
      };
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
        if (tagName === "canvas") {
          return {
            width: 0,
            height: 0,
            getContext: vi.fn().mockReturnValue(mockCtx),
          } as unknown as HTMLCanvasElement;
        }
        return originalCreateElement(tagName);
      });

      const mockSource = {} as CanvasImageSource;
      const canvas = renderToDownscaledCanvas(mockSource, 4000, 2000);

      expect(canvas.width).toBe(2048);
      expect(canvas.height).toBe(1024);
      expect(mockCtx.drawImage).toHaveBeenCalledWith(mockSource, 0, 0, 2048, 1024);
    });
  });

  describe("canvasToBlob", () => {
    it("resolves with blob when canvas.toBlob succeeds", async () => {
      const expectedBlob = new Blob(["mock-image"], { type: "image/jpeg" });
      const mockCanvas = {
        toBlob: vi.fn((callback) => callback(expectedBlob)),
      } as unknown as HTMLCanvasElement;

      const blob = await canvasToBlob(mockCanvas, "image/jpeg", 0.85);
      expect(blob).toBe(expectedBlob);
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), "image/jpeg", 0.85);
    });

    it("rejects when canvas.toBlob returns null", async () => {
      const mockCanvas = {
        toBlob: vi.fn((callback) => callback(null)),
      } as unknown as HTMLCanvasElement;

      await expect(canvasToBlob(mockCanvas, "image/jpeg")).rejects.toThrow(/Canvas toBlob returned null/);
    });
  });

  describe("exportEditedImage", () => {
    it("produces a File with matching extension and MIME type for JPEG", async () => {
      const mockBlob = new Blob(["jpeg-content"], { type: "image/jpeg" });
      const mockCanvas = {
        toBlob: vi.fn((callback, mime, quality) => {
          expect(mime).toBe("image/jpeg");
          expect(quality).toBe(DEFAULT_JPEG_QUALITY);
          callback(mockBlob);
        }),
      } as unknown as HTMLCanvasElement;

      const originalFile = new File(["orig"], "my-photo.png", { type: "image/jpeg" });
      const resultFile = await exportEditedImage(mockCanvas, originalFile);

      expect(resultFile).toBeInstanceOf(File);
      expect(resultFile.name).toBe("my-photo.jpg");
      expect(resultFile.type).toBe("image/jpeg");
    });

    it("produces a File with matching extension and MIME type for PNG", async () => {
      const mockBlob = new Blob(["png-content"], { type: "image/png" });
      const mockCanvas = {
        toBlob: vi.fn((callback, mime) => {
          expect(mime).toBe("image/png");
          callback(mockBlob);
        }),
      } as unknown as HTMLCanvasElement;

      const originalFile = new File(["orig"], "diagram.jpg", { type: "image/png" });
      const resultFile = await exportEditedImage(mockCanvas, originalFile);

      expect(resultFile.name).toBe("diagram.png");
      expect(resultFile.type).toBe("image/png");
    });

    it("produces a File with matching extension and MIME type for WebP", async () => {
      const mockBlob = new Blob(["webp-content"], { type: "image/webp" });
      const mockCanvas = {
        toBlob: vi.fn((callback, mime, quality) => {
          expect(mime).toBe("image/webp");
          expect(quality).toBe(DEFAULT_WEBP_QUALITY);
          callback(mockBlob);
        }),
      } as unknown as HTMLCanvasElement;

      const originalFile = new File(["orig"], "hero.webp", { type: "image/webp" });
      const resultFile = await exportEditedImage(mockCanvas, originalFile);

      expect(resultFile.name).toBe("hero.webp");
      expect(resultFile.type).toBe("image/webp");
    });

    it("re-encodes at lower quality when initial blob exceeds 10 MB limit", async () => {
      const largeBlob = new Blob([new Uint8Array(12 * 1024 * 1024)]);
      const compressedBlob = new Blob([new Uint8Array(8 * 1024 * 1024)]);

      const qualitiesRequested: number[] = [];
      const mockCanvas = {
        toBlob: vi.fn((callback, _mime, quality) => {
          qualitiesRequested.push(quality);
          if (qualitiesRequested.length === 1) {
            callback(largeBlob); // 12 MB (exceeds limit)
          } else {
            callback(compressedBlob); // 8 MB (within 10 MB limit)
          }
        }),
      } as unknown as HTMLCanvasElement;

      const originalFile = new File(["orig"], "huge.jpg", { type: "image/jpeg" });
      const resultFile = await exportEditedImage(mockCanvas, originalFile);

      expect(qualitiesRequested).toEqual([0.85, 0.7]);
      expect(resultFile.size).toBe(8 * 1024 * 1024);
      expect(resultFile.name).toBe("huge.jpg");
    });

    it("throws a clear error if size still exceeds 10 MB after all quality attempts", async () => {
      const oversizedBlob = { size: 15 * 1024 * 1024, type: "image/jpeg" } as Blob;

      const mockCanvas = {
        toBlob: vi.fn((callback) => {
          callback(oversizedBlob);
        }),
      } as unknown as HTMLCanvasElement;

      const originalFile = new File(["orig"], "oversized.jpg", { type: "image/jpeg" });

      await expect(exportEditedImage(mockCanvas, originalFile)).rejects.toThrow(
        /Image is too large \(15\.0 MB\)\. Maximum allowed size after compression is 10 MB\./,
      );
    });

    it("throws a clear error if PNG exceeds 10 MB limit", async () => {
      const oversizedPngBlob = { size: 11 * 1024 * 1024, type: "image/png" } as Blob;

      const mockCanvas = {
        toBlob: vi.fn((callback) => {
          callback(oversizedPngBlob);
        }),
      } as unknown as HTMLCanvasElement;

      const originalFile = new File(["orig"], "massive.png", { type: "image/png" });

      await expect(exportEditedImage(mockCanvas, originalFile)).rejects.toThrow(
        /Image is too large \(11\.0 MB\)\. Maximum allowed size after compression is 10 MB\./,
      );
    });
  });
});
