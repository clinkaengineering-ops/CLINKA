/**
 * drawing.ts
 *
 * Pure helpers, types, and math routines for the chat image editor's drawing canvas.
 * Manages stroke coordinates, smoothing math, color swatches, and undo/redo stacks.
 */

export interface Point {
  x: number;
  y: number;
}

export type DrawingTool = "pen" | "highlighter";
export type StrokeSize = "sm" | "md" | "lg";

export interface Stroke {
  id: string;
  tool: DrawingTool;
  color: string;
  size: StrokeSize;
  width: number; // width in real image pixels
  points: Point[]; // coordinates mapped to real image space (0..imageWidth, 0..imageHeight)
}

export const DRAWING_COLORS = [
  "#facc15", // Bright Yellow (default for highlighter)
  "#ef4444", // Red
  "#f97316", // Orange
  "#22c55e", // Green
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#a855f7", // Purple
  "#ffffff", // White
] as const;

export type DrawingColor = (typeof DRAWING_COLORS)[number];

export const PEN_WIDTHS: Record<StrokeSize, number> = {
  sm: 3,
  md: 6,
  lg: 12,
};

export const HIGHLIGHTER_WIDTHS: Record<StrokeSize, number> = {
  sm: 16,
  md: 28,
  lg: 48,
};

/**
 * Calculates stroke width in image pixels, scaling gently for high-resolution images.
 */
export function calculateStrokeWidth(
  size: StrokeSize,
  tool: DrawingTool,
  imageWidth = 1000,
  imageHeight = 1000,
): number {
  const longest = Math.max(imageWidth, imageHeight);
  const scale = Math.max(0.5, Math.min(2.5, longest / 1000));
  const baseWidth =
    tool === "highlighter" ? HIGHLIGHTER_WIDTHS[size] : PEN_WIDTHS[size];
  return Math.max(1, Math.round(baseWidth * scale));
}

/**
 * Maps a pointer event's viewport coordinates into the target image's coordinate space.
 * Clamps coordinates to [0, imageWidth] and [0, imageHeight].
 */
export function clientToImageCoords(
  clientX: number,
  clientY: number,
  canvasRect: { left: number; top: number; width: number; height: number },
  imageWidth: number,
  imageHeight: number,
): Point {
  if (canvasRect.width <= 0 || canvasRect.height <= 0) {
    return { x: 0, y: 0 };
  }

  const relX = clientX - canvasRect.left;
  const relY = clientY - canvasRect.top;

  const rawX = (relX / canvasRect.width) * imageWidth;
  const rawY = (relY / canvasRect.height) * imageHeight;

  const clampedX = Math.max(0, Math.min(imageWidth, Math.round(rawX)));
  const clampedY = Math.max(0, Math.min(imageHeight, Math.round(rawY)));

  return { x: clampedX, y: clampedY };
}

/**
 * Draws a smoothed stroke on the canvas context using midpoint quadratic curves.
 */
export function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = stroke.width;
  ctx.strokeStyle = stroke.color;

  if (stroke.tool === "highlighter") {
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 0.4;
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1.0;
  }

  ctx.beginPath();

  if (pts.length === 1) {
    ctx.arc(pts[0].x, pts[0].y, stroke.width / 2, 0, Math.PI * 2);
    ctx.fillStyle = stroke.color;
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.moveTo(pts[0].x, pts[0].y);

  if (pts.length === 2) {
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Quadratic curve smoothing between midpoints
  for (let i = 1; i < pts.length - 1; i++) {
    const midX = (pts[i].x + pts[i + 1].x) / 2;
    const midY = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
  }

  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws an incremental line segment during active pointer dragging without full redraw.
 */
export function drawIncrementalSegment(
  ctx: CanvasRenderingContext2D,
  tool: DrawingTool,
  color: string,
  width: number,
  pPrev: Point,
  pCurr: Point,
) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = width;
  ctx.strokeStyle = color;

  if (tool === "highlighter") {
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 0.4;
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1.0;
  }

  ctx.beginPath();
  ctx.moveTo(pPrev.x, pPrev.y);
  ctx.lineTo(pCurr.x, pCurr.y);
  ctx.stroke();
  ctx.restore();
}

/**
 * Completely redraws the canvas: clears, renders background image, and replays all strokes.
 */
export function redrawCanvas(
  ctx: CanvasRenderingContext2D,
  imageSource: CanvasImageSource | null,
  imageWidth: number,
  imageHeight: number,
  strokes: Stroke[],
) {
  ctx.save();
  ctx.clearRect(0, 0, imageWidth, imageHeight);

  if (imageSource) {
    ctx.drawImage(imageSource, 0, 0, imageWidth, imageHeight);
  }

  for (const stroke of strokes) {
    drawStroke(ctx, stroke);
  }

  ctx.restore();
}

/**
 * Creates an offscreen canvas and composites the base image source and all strokes onto it.
 */
export function createCompositeCanvas(
  imageSource: CanvasImageSource | null,
  imageWidth: number,
  imageHeight: number,
  strokes: Stroke[],
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, imageWidth);
  canvas.height = Math.max(1, imageHeight);
  const ctx = canvas.getContext("2d");
  if (ctx) {
    redrawCanvas(ctx, imageSource, imageWidth, imageHeight, strokes);
  }
  return canvas;
}

// ─── History State Helpers (Pure Functions) ─────────────────────────────────

export interface HistoryState {
  strokes: Stroke[];
  redoStack: Stroke[];
}

export const initialHistoryState: HistoryState = {
  strokes: [],
  redoStack: [],
};

export function addStroke(state: HistoryState, stroke: Stroke): HistoryState {
  return {
    strokes: [...state.strokes, stroke],
    redoStack: [], // new stroke invalidates redo stack
  };
}

export function undo(state: HistoryState): HistoryState {
  if (state.strokes.length === 0) return state;
  const lastStroke = state.strokes[state.strokes.length - 1];
  return {
    strokes: state.strokes.slice(0, -1),
    redoStack: [lastStroke, ...state.redoStack],
  };
}

export function redo(state: HistoryState): HistoryState {
  if (state.redoStack.length === 0) return state;
  const [nextStroke, ...remainingRedo] = state.redoStack;
  return {
    strokes: [...state.strokes, nextStroke],
    redoStack: remainingRedo,
  };
}

export function clearAll(state: HistoryState): HistoryState {
  if (state.strokes.length === 0) return state;
  return {
    strokes: [],
    redoStack: [...state.strokes, ...state.redoStack], // allow undoing a clear
  };
}
