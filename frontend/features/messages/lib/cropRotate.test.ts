import { describe, it, expect, vi } from "vitest";
import {
  rotatePoint,
  rotateDimensions,
  rotateStrokes,
  getPresetRatio,
  clampCropRect,
  fitCropRectToAspect,
  resizeCropRect,
  isStrokeInCrop,
  cropStrokes,
  createRotatedCanvas,
  createCroppedCanvas,
  MIN_CROP_SIZE,
} from "./cropRotate";
import type { Stroke } from "./drawing";

describe("cropRotate pure math and transformations", () => {
  // ─── 1. Rotation Math Tests ───────────────────────────────────────────────

  describe("rotatePoint", () => {
    const W = 1000;
    const H = 600;

    it("rotates points 90° clockwise (CW) correctly", () => {
      // Top-left (0, 0) -> (H, 0) = (600, 0)
      expect(rotatePoint({ x: 0, y: 0 }, 90, W, H)).toEqual({ x: 600, y: 0 });

      // Top-right (1000, 0) -> (600, 1000)
      expect(rotatePoint({ x: 1000, y: 0 }, 90, W, H)).toEqual({ x: 600, y: 1000 });

      // Bottom-right (1000, 600) -> (0, 1000)
      expect(rotatePoint({ x: 1000, y: 600 }, 90, W, H)).toEqual({ x: 0, y: 1000 });

      // Bottom-left (0, 600) -> (0, 0)
      expect(rotatePoint({ x: 0, y: 600 }, 90, W, H)).toEqual({ x: 0, y: 0 });

      // Center (500, 300) -> (300, 500)
      expect(rotatePoint({ x: 500, y: 300 }, 90, W, H)).toEqual({ x: 300, y: 500 });
    });

    it("rotates points 90° counter-clockwise (CCW / -90) correctly", () => {
      // Top-left (0, 0) -> (0, W) = (0, 1000)
      expect(rotatePoint({ x: 0, y: 0 }, -90, W, H)).toEqual({ x: 0, y: 1000 });

      // Top-right (1000, 0) -> (0, 0)
      expect(rotatePoint({ x: 1000, y: 0 }, -90, W, H)).toEqual({ x: 0, y: 0 });

      // Bottom-right (1000, 600) -> (600, 0)
      expect(rotatePoint({ x: 1000, y: 600 }, -90, W, H)).toEqual({ x: 600, y: 0 });

      // Bottom-left (0, 600) -> (600, 1000)
      expect(rotatePoint({ x: 0, y: 600 }, -90, W, H)).toEqual({ x: 600, y: 1000 });

      // Center (500, 300) -> (300, 500)
      expect(rotatePoint({ x: 500, y: 300 }, -90, W, H)).toEqual({ x: 300, y: 500 });
    });

    it("guarantees rotating +90 then -90 returns exactly to original coordinates", () => {
      const orig = { x: 234, y: 456 };
      const cw = rotatePoint(orig, 90, W, H); // dimensions become (H, W) = (600, 1000)
      const restored = rotatePoint(cw, -90, H, W); // dimensions return to (W, H)
      expect(restored).toEqual(orig);
    });

    it("rotates 180° correctly", () => {
      expect(rotatePoint({ x: 100, y: 50 }, 180, W, H)).toEqual({
        x: 900,
        y: 550,
      });
    });
  });

  describe("rotateDimensions", () => {
    it("swaps width and height for ±90°", () => {
      expect(rotateDimensions(1920, 1080, 90)).toEqual({ width: 1080, height: 1920 });
      expect(rotateDimensions(1920, 1080, -90)).toEqual({ width: 1080, height: 1920 });
    });

    it("preserves dimensions for 180°", () => {
      expect(rotateDimensions(1920, 1080, 180)).toEqual({ width: 1920, height: 1080 });
    });
  });

  describe("rotateStrokes", () => {
    it("rotates all points in each stroke accurately", () => {
      const strokes: Stroke[] = [
        {
          id: "stroke-1",
          tool: "pen",
          color: "#ef4444",
          size: "md",
          width: 6,
          points: [
            { x: 10, y: 20 },
            { x: 30, y: 40 },
          ],
        },
      ];

      const rotated = rotateStrokes(strokes, 90, 800, 600);
      expect(rotated).toHaveLength(1);
      expect(rotated[0].points).toEqual([
        { x: 600 - 20, y: 10 },
        { x: 600 - 40, y: 30 },
      ]);
      expect(rotated[0].color).toBe("#ef4444");
    });
  });

  // ─── 2. Aspect Ratio Presets & Constraints ────────────────────────────────

  describe("getPresetRatio", () => {
    it("returns correct numeric ratios for all presets", () => {
      expect(getPresetRatio("free")).toBeNull();
      expect(getPresetRatio("original", 16 / 10)).toBe(1.6);
      expect(getPresetRatio("1:1")).toBe(1);
      expect(getPresetRatio("4:3")).toBeCloseTo(1.3333, 3);
      expect(getPresetRatio("16:9")).toBeCloseTo(1.7777, 3);
    });

    it("returns null for original preset when origAspect is missing or invalid", () => {
      expect(getPresetRatio("original")).toBeNull();
      expect(getPresetRatio("original", 0)).toBeNull();
    });
  });

  describe("clampCropRect", () => {
    const bounds = { width: 1000, height: 800 };

    it("keeps normal rect unchanged if fully inside bounds", () => {
      const rect = { x: 100, y: 100, width: 400, height: 300 };
      expect(clampCropRect(rect, bounds)).toEqual(rect);
    });

    it("clamps negative x and y to 0", () => {
      const rect = { x: -50, y: -20, width: 300, height: 200 };
      expect(clampCropRect(rect, bounds)).toEqual({
        x: 0,
        y: 0,
        width: 300,
        height: 200,
      });
    });

    it("clamps rect exceeding bounds on the right and bottom", () => {
      const rect = { x: 900, y: 700, width: 300, height: 300 };
      // x clamped so x + w <= 1000 -> x = 700, w = 300
      // y clamped so y + h <= 800 -> y = 500, h = 300
      expect(clampCropRect(rect, bounds)).toEqual({
        x: 700,
        y: 500,
        width: 300,
        height: 300,
      });
    });

    it("enforces minimum size", () => {
      const rect = { x: 100, y: 100, width: 10, height: 20 };
      const clamped = clampCropRect(rect, bounds, 50);
      expect(clamped.width).toBe(50);
      expect(clamped.height).toBe(50);
    });

    it("handles degenerate bounds smaller than minSize gracefully", () => {
      const tinyBounds = { width: 30, height: 40 };
      const rect = { x: 0, y: 0, width: 100, height: 100 };
      const clamped = clampCropRect(rect, tinyBounds, 50);
      expect(clamped.width).toBe(30);
      expect(clamped.height).toBe(40);
    });
  });

  describe("fitCropRectToAspect", () => {
    const bounds = { width: 1000, height: 500 };

    it("fits a 1:1 square centered in a landscape container", () => {
      const rect = fitCropRectToAspect(1, bounds, 1.0);
      // Container aspect = 2.0 > 1.0. Height = 500, width = 500 * 1 = 500.
      // x = (1000 - 500)/2 = 250, y = 0
      expect(rect).toEqual({ x: 250, y: 0, width: 500, height: 500 });
    });

    it("fits a 16:9 box centered in a portrait container", () => {
      const portrait = { width: 600, height: 1200 };
      const rect = fitCropRectToAspect(16 / 9, portrait, 1.0);
      // Container aspect = 0.5 < 1.777. Width = 600, height = 600 / (16/9) = 338.
      expect(rect.width).toBe(600);
      expect(rect.height).toBe(Math.round(600 / (16 / 9)));
      expect(rect.x).toBe(0);
      expect(rect.y).toBe(Math.round((1200 - rect.height) / 2));
    });
  });

  describe("resizeCropRect", () => {
    const bounds = { width: 1000, height: 1000 };
    const startRect = { x: 200, y: 200, width: 400, height: 400 };

    it("moves the entire box with handle 'move'", () => {
      const moved = resizeCropRect(startRect, "move", 50, -30, bounds, null);
      expect(moved).toEqual({ x: 250, y: 170, width: 400, height: 400 });
    });

    it("clamps moving the entire box within bounds", () => {
      const moved = resizeCropRect(startRect, "move", 9999, 9999, bounds, null);
      expect(moved).toEqual({ x: 600, y: 600, width: 400, height: 400 });
    });

    it("resizes bottom-right ('se') in free mode", () => {
      const resized = resizeCropRect(startRect, "se", 50, 60, bounds, null);
      expect(resized).toEqual({ x: 200, y: 200, width: 450, height: 460 });
    });

    it("resizes top-left ('nw') in free mode", () => {
      const resized = resizeCropRect(startRect, "nw", -40, -30, bounds, null);
      expect(resized).toEqual({ x: 160, y: 170, width: 440, height: 430 });
    });

    it("resizes with 1:1 aspect ratio constraint locked", () => {
      const resized = resizeCropRect(startRect, "se", 100, 50, bounds, 1.0);
      // With aspect 1.0, candW = 400 + 100 = 500, candH = 500
      expect(resized.width).toBe(500);
      expect(resized.height).toBe(500);
    });

    it("clamps locked aspect ratio resizing when hitting edge bounds", () => {
      const nearEdgeRect = { x: 800, y: 800, width: 150, height: 150 };
      const resized = resizeCropRect(nearEdgeRect, "se", 200, 200, bounds, 1.0);
      // Max room is 200px (1000 - 800)
      expect(resized.width).toBe(200);
      expect(resized.height).toBe(200);
      expect(resized.x + resized.width).toBe(1000);
      expect(resized.y + resized.height).toBe(1000);
    });
  });

  // ─── 3. Stroke Cropping & Translation Tests ───────────────────────────────

  describe("cropStrokes", () => {
    const cropRect = { x: 100, y: 100, width: 400, height: 300 };

    it("drops strokes that lie entirely outside the crop box", () => {
      const outsideStroke: Stroke = {
        id: "out-1",
        tool: "pen",
        color: "#ffffff",
        size: "sm",
        width: 3,
        points: [
          { x: 10, y: 10 },
          { x: 50, y: 50 },
        ],
      };

      const result = cropStrokes([outsideStroke], cropRect);
      expect(result).toHaveLength(0);
    });

    it("keeps strokes inside the crop box and translates coordinates (x' = x - crop.x, y' = y - crop.y)", () => {
      const insideStroke: Stroke = {
        id: "in-1",
        tool: "pen",
        color: "#facc15",
        size: "md",
        width: 6,
        points: [
          { x: 150, y: 150 }, // -> (50, 50)
          { x: 200, y: 250 }, // -> (100, 150)
        ],
      };

      const result = cropStrokes([insideStroke], cropRect);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("in-1");
      expect(result[0].points).toEqual([
        { x: 50, y: 50 },
        { x: 100, y: 150 },
      ]);
    });

    it("clamps points that partially exit the crop boundary", () => {
      const partiallyExitingStroke: Stroke = {
        id: "partial-1",
        tool: "highlighter",
        color: "#22c55e",
        size: "lg",
        width: 12,
        points: [
          { x: 150, y: 150 }, // Inside -> (50, 50)
          { x: 600, y: 150 }, // Outside right (cropRect.x + width = 500) -> clamped to width = 400
        ],
      };

      const result = cropStrokes([partiallyExitingStroke], cropRect);
      expect(result).toHaveLength(1);
      expect(result[0].points).toEqual([
        { x: 50, y: 50 },
        { x: 400, y: 50 },
      ]);
    });
  });

  // ─── 4. Canvas Transformation Operations ──────────────────────────────────

  describe("createRotatedCanvas & createCroppedCanvas", () => {
    let mockCtx: any;
    let originalCreateElement: typeof document.createElement;

    beforeEach(() => {
      mockCtx = {
        translate: vi.fn(),
        rotate: vi.fn(),
        drawImage: vi.fn(),
      };
      originalCreateElement = document.createElement.bind(document);
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
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("creates rotated canvas with swapped dimensions and transforms context", () => {
      const mockSource = {} as CanvasImageSource;
      const { canvas, width, height } = createRotatedCanvas(mockSource, 800, 600, 90);
      expect(width).toBe(600);
      expect(height).toBe(800);
      expect(canvas.width).toBe(600);
      expect(canvas.height).toBe(800);
      expect(mockCtx.translate).toHaveBeenCalledWith(600, 0);
      expect(mockCtx.rotate).toHaveBeenCalledWith(Math.PI / 2);
      expect(mockCtx.drawImage).toHaveBeenCalled();
    });

    it("creates cropped canvas with crop rect dimensions", () => {
      const mockSource = {} as CanvasImageSource;
      const cropRect = { x: 50, y: 50, width: 300, height: 200 };
      const { canvas, width, height } = createCroppedCanvas(mockSource, cropRect);
      expect(width).toBe(300);
      expect(height).toBe(200);
      expect(canvas.width).toBe(300);
      expect(canvas.height).toBe(200);
      expect(mockCtx.drawImage).toHaveBeenCalledWith(
        mockSource,
        50,
        50,
        300,
        200,
        0,
        0,
        300,
        200,
      );
    });
  });
});
