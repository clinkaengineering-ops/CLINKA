import { describe, it, expect, vi } from "vitest";
import {
  clientToImageCoords,
  calculateStrokeWidth,
  addStroke,
  undo,
  redo,
  clearAll,
  drawStroke,
  drawIncrementalSegment,
  redrawCanvas,
  type Stroke,
  type HistoryState,
  DRAWING_COLORS,
} from "./drawing";

describe("drawing library pure math and helpers", () => {
  // ─── 1. Coordinate Mapping Math ───────────────────────────────────────────

  describe("clientToImageCoords", () => {
    const canvasRect = {
      left: 100,
      top: 50,
      width: 500,
      height: 250,
    };
    const imageWidth = 2000;
    const imageHeight = 1000;

    it("maps top-left, center, and bottom-right points correctly", () => {
      // Top-left
      expect(
        clientToImageCoords(100, 50, canvasRect, imageWidth, imageHeight),
      ).toEqual({ x: 0, y: 0 });

      // Center: relX = 250, relY = 125 -> 250/500 * 2000 = 1000, 125/250 * 1000 = 500
      expect(
        clientToImageCoords(350, 175, canvasRect, imageWidth, imageHeight),
      ).toEqual({ x: 1000, y: 500 });

      // Bottom-right: relX = 500, relY = 250 -> 2000, 1000
      expect(
        clientToImageCoords(600, 300, canvasRect, imageWidth, imageHeight),
      ).toEqual({ x: 2000, y: 1000 });
    });

    it("clamps pointer coordinates that fall outside the canvas rect boundaries", () => {
      // Far left and above
      expect(
        clientToImageCoords(0, 0, canvasRect, imageWidth, imageHeight),
      ).toEqual({ x: 0, y: 0 });

      // Far right and below
      expect(
        clientToImageCoords(1000, 800, canvasRect, imageWidth, imageHeight),
      ).toEqual({ x: 2000, y: 1000 });
    });

    it("handles zero or degenerate canvas dimensions safely without dividing by zero", () => {
      const zeroRect = { left: 0, top: 0, width: 0, height: 0 };
      expect(clientToImageCoords(50, 50, zeroRect, imageWidth, imageHeight)).toEqual({
        x: 0,
        y: 0,
      });
    });
  });

  // ─── 2. Stroke Width Scaling ──────────────────────────────────────────────

  describe("calculateStrokeWidth", () => {
    it("returns correct widths for Pen sizes", () => {
      const sm = calculateStrokeWidth("sm", "pen", 1000, 1000);
      const md = calculateStrokeWidth("md", "pen", 1000, 1000);
      const lg = calculateStrokeWidth("lg", "pen", 1000, 1000);

      expect(sm).toBe(3);
      expect(md).toBe(6);
      expect(lg).toBe(12);
    });

    it("returns thicker widths for Highlighter tool", () => {
      const sm = calculateStrokeWidth("sm", "highlighter", 1000, 1000);
      const md = calculateStrokeWidth("md", "highlighter", 1000, 1000);
      const lg = calculateStrokeWidth("lg", "highlighter", 1000, 1000);

      expect(sm).toBe(16);
      expect(md).toBe(28);
      expect(lg).toBe(48);
      expect(md).toBeGreaterThan(calculateStrokeWidth("md", "pen", 1000, 1000));
    });

    it("scales stroke width proportionally with larger image dimensions", () => {
      const widthAt1000 = calculateStrokeWidth("md", "pen", 1000, 1000);
      const widthAt2000 = calculateStrokeWidth("md", "pen", 2000, 2000);

      expect(widthAt2000).toBeGreaterThan(widthAt1000);
    });
  });

  // ─── 3. History State Logic (Undo / Redo / Clear) ──────────────────────────

  describe("stroke history management", () => {
    const dummyStroke1: Stroke = {
      id: "1",
      tool: "pen",
      color: "#ef4444",
      size: "md",
      width: 6,
      points: [{ x: 10, y: 10 }, { x: 20, y: 20 }],
    };

    const dummyStroke2: Stroke = {
      id: "2",
      tool: "highlighter",
      color: "#facc15",
      size: "lg",
      width: 28,
      points: [{ x: 30, y: 30 }, { x: 40, y: 40 }],
    };

    it("addStroke appends to strokes and clears the redo stack", () => {
      const initial: HistoryState = {
        strokes: [dummyStroke1],
        redoStack: [dummyStroke2],
      };

      const next = addStroke(initial, dummyStroke2);
      expect(next.strokes).toEqual([dummyStroke1, dummyStroke2]);
      expect(next.redoStack).toEqual([]);
    });

    it("undo removes the latest stroke and places it on the redo stack", () => {
      const stateWithTwo: HistoryState = {
        strokes: [dummyStroke1, dummyStroke2],
        redoStack: [],
      };

      const afterUndo = undo(stateWithTwo);
      expect(afterUndo.strokes).toEqual([dummyStroke1]);
      expect(afterUndo.redoStack).toEqual([dummyStroke2]);

      const afterSecondUndo = undo(afterUndo);
      expect(afterSecondUndo.strokes).toEqual([]);
      expect(afterSecondUndo.redoStack).toEqual([dummyStroke1, dummyStroke2]);
    });

    it("undo on empty history returns the same state without error", () => {
      const empty: HistoryState = { strokes: [], redoStack: [] };
      expect(undo(empty)).toEqual(empty);
    });

    it("redo restores the undone stroke back to the stroke list", () => {
      const stateWithRedo: HistoryState = {
        strokes: [dummyStroke1],
        redoStack: [dummyStroke2],
      };

      const afterRedo = redo(stateWithRedo);
      expect(afterRedo.strokes).toEqual([dummyStroke1, dummyStroke2]);
      expect(afterRedo.redoStack).toEqual([]);
    });

    it("redo on empty redoStack returns the same state without error", () => {
      const state: HistoryState = { strokes: [dummyStroke1], redoStack: [] };
      expect(redo(state)).toEqual(state);
    });

    it("clearAll empties strokes and allows undoing the clear operation", () => {
      const stateWithTwo: HistoryState = {
        strokes: [dummyStroke1, dummyStroke2],
        redoStack: [],
      };

      const cleared = clearAll(stateWithTwo);
      expect(cleared.strokes).toEqual([]);
      expect(cleared.redoStack).toEqual([dummyStroke1, dummyStroke2]);

      // Can undo the clear
      const restored = redo(cleared);
      expect(restored.strokes).toEqual([dummyStroke1]);
    });

    it("clearAll on empty history returns the same state", () => {
      const empty: HistoryState = { strokes: [], redoStack: [] };
      expect(clearAll(empty)).toEqual(empty);
    });
  });

  // ─── 4. Canvas Drawing Functions ──────────────────────────────────────────

  describe("canvas drawing routines", () => {
    it("drawStroke applies multiply composite operation and 0.4 alpha for highlighter", () => {
      const ctx = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        stroke: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        lineCap: "",
        lineJoin: "",
        lineWidth: 0,
        strokeStyle: "",
        fillStyle: "",
        globalCompositeOperation: "",
        globalAlpha: 1,
      } as unknown as CanvasRenderingContext2D;

      const stroke: Stroke = {
        id: "hl",
        tool: "highlighter",
        color: "#facc15",
        size: "md",
        width: 20,
        points: [
          { x: 10, y: 10 },
          { x: 20, y: 20 },
          { x: 30, y: 25 },
        ],
      };

      drawStroke(ctx, stroke);

      expect(ctx.globalCompositeOperation).toBe("multiply");
      expect(ctx.globalAlpha).toBe(0.4);
      expect(ctx.lineCap).toBe("round");
      expect(ctx.lineJoin).toBe("round");
      expect(ctx.lineWidth).toBe(20);
      expect(ctx.quadraticCurveTo).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    it("drawStroke applies source-over composite operation and 1.0 alpha for pen", () => {
      const ctx = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        stroke: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        lineCap: "",
        lineJoin: "",
        lineWidth: 0,
        strokeStyle: "",
        fillStyle: "",
        globalCompositeOperation: "",
        globalAlpha: 0,
      } as unknown as CanvasRenderingContext2D;

      const stroke: Stroke = {
        id: "pen-1",
        tool: "pen",
        color: "#ef4444",
        size: "sm",
        width: 4,
        points: [
          { x: 5, y: 5 },
          { x: 15, y: 15 },
        ],
      };

      drawStroke(ctx, stroke);

      expect(ctx.globalCompositeOperation).toBe("source-over");
      expect(ctx.globalAlpha).toBe(1.0);
      expect(ctx.lineWidth).toBe(4);
      expect(ctx.lineTo).toHaveBeenCalledWith(15, 15);
      expect(ctx.stroke).toHaveBeenCalled();
    });

    it("drawIncrementalSegment draws segment between two points", () => {
      const ctx = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        lineCap: "",
        lineJoin: "",
        lineWidth: 0,
        strokeStyle: "",
        globalCompositeOperation: "",
        globalAlpha: 1,
      } as unknown as CanvasRenderingContext2D;

      drawIncrementalSegment(ctx, "pen", "#3b82f6", 8, { x: 10, y: 10 }, { x: 25, y: 30 });

      expect(ctx.moveTo).toHaveBeenCalledWith(10, 10);
      expect(ctx.lineTo).toHaveBeenCalledWith(25, 30);
      expect(ctx.stroke).toHaveBeenCalled();
    });

    it("redrawCanvas clears, draws background image, and replays all strokes", () => {
      const ctx = {
        save: vi.fn(),
        restore: vi.fn(),
        clearRect: vi.fn(),
        drawImage: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        lineCap: "",
        lineJoin: "",
        lineWidth: 0,
        strokeStyle: "",
        globalCompositeOperation: "",
        globalAlpha: 1,
      } as unknown as CanvasRenderingContext2D;

      const mockImage = {} as CanvasImageSource;
      const strokes: Stroke[] = [
        {
          id: "s1",
          tool: "pen",
          color: "#22c55e",
          size: "sm",
          width: 3,
          points: [{ x: 1, y: 1 }, { x: 2, y: 2 }],
        },
      ];

      redrawCanvas(ctx, mockImage, 800, 600, strokes);

      expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
      expect(ctx.drawImage).toHaveBeenCalledWith(mockImage, 0, 0, 800, 600);
      expect(ctx.stroke).toHaveBeenCalled();
    });
  });

  // ─── 5. Color Palette ─────────────────────────────────────────────────────

  describe("DRAWING_COLORS", () => {
    it("contains exactly 8 colors and includes bright yellow for highlighter", () => {
      expect(DRAWING_COLORS).toHaveLength(8);
      expect(DRAWING_COLORS).toContain("#facc15"); // bright yellow
    });
  });
});
