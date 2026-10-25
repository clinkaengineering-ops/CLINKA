/**
 * cropRotate.ts
 *
 * Pure helpers, types, and math routines for image rotation and cropping.
 * Handles:
 *  - 90° clockwise and counter-clockwise coordinate transformations.
 *  - Stroke coordinate rotation and bounding box transformations.
 *  - Aspect ratio constraint math (Free, Original, 1:1, 4:3, 16:9).
 *  - Bounds clamping and minimum sizing.
 *  - Pointer-based crop box and handle resizing (with aspect ratio lock).
 *  - Stroke translation and clipping on crop application.
 *  - Offscreen canvas rotation and cropping with imageProcessing size limits.
 */

import type { Point, Stroke } from "./drawing";
import {
  MAX_LONGEST_SIDE,
  MAX_CANVAS_PIXELS,
  calculateDownscaledDimensions,
} from "./imageProcessing";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type CropPreset = "free" | "original" | "1:1" | "4:3" | "16:9";

export type RotationAngle = 90 | -90 | 180 | 270;

export interface Bounds {
  width: number;
  height: number;
}

export type HandleType =
  | "nw"
  | "ne"
  | "se"
  | "sw"
  | "n"
  | "e"
  | "s"
  | "w"
  | "move";

export const MIN_CROP_SIZE = 50; // Minimum dimension in image pixels

// ─── 1. Rotation Math ───────────────────────────────────────────────────────

/**
 * Rotates a 2D point (x, y) around the image frame for a given angle.
 *
 * Angle conventions:
 *  - 90 (CW):   x' = height - y, y' = x.  New dimensions: (height, width).
 *  - -90 (CCW): x' = y, y' = width - x.   New dimensions: (height, width).
 *  - 180:       x' = width - x, y' = height - y.
 */
export function rotatePoint(
  point: Point,
  angle: RotationAngle,
  width: number,
  height: number,
): Point {
  switch (angle) {
    case 90:
      return {
        x: Math.round(height - point.y),
        y: Math.round(point.x),
      };
    case -90:
    case 270:
      return {
        x: Math.round(point.y),
        y: Math.round(width - point.x),
      };
    case 180:
      return {
        x: Math.round(width - point.x),
        y: Math.round(height - point.y),
      };
    default:
      return { x: Math.round(point.x), y: Math.round(point.y) };
  }
}

/**
 * Returns new dimensions after rotation.
 */
export function rotateDimensions(
  width: number,
  height: number,
  angle: RotationAngle,
): Bounds {
  if (angle === 90 || angle === -90 || angle === 270) {
    return { width: height, height: width };
  }
  return { width, height };
}

/**
 * Rotates an array of strokes by 90° (CW: +90, CCW: -90).
 * Re-maps all point coordinates to align with the new image dimensions.
 */
export function rotateStrokes(
  strokes: Stroke[],
  angle: 90 | -90,
  width: number,
  height: number,
): Stroke[] {
  return strokes.map((stroke) => ({
    ...stroke,
    points: stroke.points.map((p) => rotatePoint(p, angle, width, height)),
  }));
}

// ─── 2. Crop Math & Aspect Ratio Constraints ────────────────────────────────

/**
 * Resolves numeric ratio (width / height) from a preset.
 */
export function getPresetRatio(
  preset: CropPreset,
  origAspect?: number,
): number | null {
  switch (preset) {
    case "free":
      return null;
    case "original":
      return typeof origAspect === "number" && origAspect > 0
        ? origAspect
        : null;
    case "1:1":
      return 1;
    case "4:3":
      return 4 / 3;
    case "16:9":
      return 16 / 9;
    default:
      return null;
  }
}

/**
 * Clamps a crop rectangle to stay strictly within image bounds and adhere to minimum size.
 */
export function clampCropRect(
  rect: CropRect,
  bounds: Bounds,
  minSize = MIN_CROP_SIZE,
): CropRect {
  const effectiveMinW = Math.min(minSize, bounds.width);
  const effectiveMinH = Math.min(minSize, bounds.height);

  let w = Math.max(effectiveMinW, Math.min(Math.round(rect.width), bounds.width));
  let h = Math.max(effectiveMinH, Math.min(Math.round(rect.height), bounds.height));

  const x = Math.max(0, Math.min(Math.round(rect.x), bounds.width - w));
  const y = Math.max(0, Math.min(Math.round(rect.y), bounds.height - h));

  // Ensure x + w <= bounds.width and y + h <= bounds.height
  if (x + w > bounds.width) {
    w = bounds.width - x;
  }
  if (y + h > bounds.height) {
    h = bounds.height - y;
  }

  return { x, y, width: w, height: h };
}

/**
 * Fits a centered crop rectangle for a target aspect ratio inside image bounds.
 */
export function fitCropRectToAspect(
  aspect: number,
  bounds: Bounds,
  fillRatio = 0.9,
): CropRect {
  if (bounds.width <= 0 || bounds.height <= 0 || aspect <= 0) {
    return { x: 0, y: 0, width: bounds.width, height: bounds.height };
  }

  const containerAspect = bounds.width / bounds.height;
  let w: number;
  let h: number;

  if (containerAspect > aspect) {
    h = Math.round(bounds.height * fillRatio);
    w = Math.round(h * aspect);
  } else {
    w = Math.round(bounds.width * fillRatio);
    h = Math.round(w / aspect);
  }

  const x = Math.round((bounds.width - w) / 2);
  const y = Math.round((bounds.height - h) / 2);

  return clampCropRect({ x, y, width: w, height: h }, bounds);
}

/**
 * Resizes or moves a crop rectangle based on handle drag delta,
 * keeping the box clamped within bounds and enforcing aspect ratio when locked.
 */
export function resizeCropRect(
  startRect: CropRect,
  handle: HandleType,
  deltaX: number,
  deltaY: number,
  bounds: Bounds,
  aspect: number | null,
  minSize = MIN_CROP_SIZE,
): CropRect {
  const effectiveMinW = Math.min(minSize, bounds.width);
  const effectiveMinH = Math.min(minSize, bounds.height);

  // 1. Moving the entire box
  if (handle === "move") {
    const rawX = startRect.x + deltaX;
    const rawY = startRect.y + deltaY;
    const clampedX = Math.max(0, Math.min(rawX, bounds.width - startRect.width));
    const clampedY = Math.max(0, Math.min(rawY, bounds.height - startRect.height));
    return {
      x: Math.round(clampedX),
      y: Math.round(clampedY),
      width: startRect.width,
      height: startRect.height,
    };
  }

  // 2. Free aspect resizing
  if (aspect === null || aspect <= 0) {
    let left = startRect.x;
    let top = startRect.y;
    let right = startRect.x + startRect.width;
    let bottom = startRect.y + startRect.height;

    if (handle.includes("w")) {
      left = Math.max(0, Math.min(startRect.x + deltaX, right - effectiveMinW));
    }
    if (handle.includes("e")) {
      right = Math.min(bounds.width, Math.max(startRect.x + startRect.width + deltaX, left + effectiveMinW));
    }
    if (handle.includes("n")) {
      top = Math.max(0, Math.min(startRect.y + deltaY, bottom - effectiveMinH));
    }
    if (handle.includes("s")) {
      bottom = Math.min(bounds.height, Math.max(startRect.y + startRect.height + deltaY, top + effectiveMinH));
    }

    return {
      x: Math.round(left),
      y: Math.round(top),
      width: Math.round(right - left),
      height: Math.round(bottom - top),
    };
  }

  // 3. Aspect-locked resizing (width / height = aspect)
  let left = startRect.x;
  let top = startRect.y;
  let w = startRect.width;
  let h = startRect.height;

  switch (handle) {
    case "se": {
      // Dragging bottom-right
      const candW = Math.max(effectiveMinW, startRect.width + deltaX);
      const candH = candW / aspect;
      const maxW = bounds.width - left;
      const maxH = bounds.height - top;

      if (candW <= maxW && candH <= maxH) {
        w = candW;
        h = candH;
      } else {
        const scaleW = maxW;
        const scaleH = scaleW / aspect;
        if (scaleH <= maxH) {
          w = scaleW;
          h = scaleH;
        } else {
          h = maxH;
          w = h * aspect;
        }
      }
      break;
    }

    case "sw": {
      // Dragging bottom-left (anchored top-right)
      const candW = Math.max(effectiveMinW, startRect.width - deltaX);
      const candH = candW / aspect;
      const rightAnchor = startRect.x + startRect.width;
      const maxW = rightAnchor;
      const maxH = bounds.height - top;

      let finalW = candW;
      let finalH = candH;
      if (finalW > maxW) {
        finalW = maxW;
        finalH = finalW / aspect;
      }
      if (finalH > maxH) {
        finalH = maxH;
        finalW = finalH * aspect;
      }
      w = finalW;
      h = finalH;
      left = rightAnchor - w;
      break;
    }

    case "ne": {
      // Dragging top-right (anchored bottom-left)
      const candW = Math.max(effectiveMinW, startRect.width + deltaX);
      const candH = candW / aspect;
      const bottomAnchor = startRect.y + startRect.height;
      const maxW = bounds.width - left;
      const maxH = bottomAnchor;

      let finalW = candW;
      let finalH = candH;
      if (finalW > maxW) {
        finalW = maxW;
        finalH = finalW / aspect;
      }
      if (finalH > maxH) {
        finalH = maxH;
        finalW = finalH * aspect;
      }
      w = finalW;
      h = finalH;
      top = bottomAnchor - h;
      break;
    }

    case "nw": {
      // Dragging top-left (anchored bottom-right)
      const candW = Math.max(effectiveMinW, startRect.width - deltaX);
      const candH = candW / aspect;
      const rightAnchor = startRect.x + startRect.width;
      const bottomAnchor = startRect.y + startRect.height;
      const maxW = rightAnchor;
      const maxH = bottomAnchor;

      let finalW = candW;
      let finalH = candH;
      if (finalW > maxW) {
        finalW = maxW;
        finalH = finalW / aspect;
      }
      if (finalH > maxH) {
        finalH = maxH;
        finalW = finalH * aspect;
      }
      w = finalW;
      h = finalH;
      left = rightAnchor - w;
      top = bottomAnchor - h;
      break;
    }

    case "e": {
      const candW = Math.max(effectiveMinW, Math.min(bounds.width - left, startRect.width + deltaX));
      const candH = candW / aspect;
      const deltaH = candH - startRect.height;
      let candTop = startRect.y - deltaH / 2;
      if (candTop < 0) candTop = 0;
      if (candTop + candH > bounds.height) {
        candTop = bounds.height - candH;
      }
      if (candTop >= 0 && candTop + candH <= bounds.height) {
        w = candW;
        h = candH;
        top = candTop;
      }
      break;
    }

    case "w": {
      const rightAnchor = startRect.x + startRect.width;
      const candW = Math.max(effectiveMinW, Math.min(rightAnchor, startRect.width - deltaX));
      const candH = candW / aspect;
      const deltaH = candH - startRect.height;
      let candTop = startRect.y - deltaH / 2;
      if (candTop < 0) candTop = 0;
      if (candTop + candH > bounds.height) {
        candTop = bounds.height - candH;
      }
      if (candTop >= 0 && candTop + candH <= bounds.height) {
        w = candW;
        h = candH;
        top = candTop;
        left = rightAnchor - w;
      }
      break;
    }

    case "s": {
      const candH = Math.max(effectiveMinH, Math.min(bounds.height - top, startRect.height + deltaY));
      const candW = candH * aspect;
      const deltaW = candW - startRect.width;
      let candLeft = startRect.x - deltaW / 2;
      if (candLeft < 0) candLeft = 0;
      if (candLeft + candW > bounds.width) {
        candLeft = bounds.width - candW;
      }
      if (candLeft >= 0 && candLeft + candW <= bounds.width) {
        w = candW;
        h = candH;
        left = candLeft;
      }
      break;
    }

    case "n": {
      const bottomAnchor = startRect.y + startRect.height;
      const candH = Math.max(effectiveMinH, Math.min(bottomAnchor, startRect.height - deltaY));
      const candW = candH * aspect;
      const deltaW = candW - startRect.width;
      let candLeft = startRect.x - deltaW / 2;
      if (candLeft < 0) candLeft = 0;
      if (candLeft + candW > bounds.width) {
        candLeft = bounds.width - candW;
      }
      if (candLeft >= 0 && candLeft + candW <= bounds.width) {
        w = candW;
        h = candH;
        left = candLeft;
        top = bottomAnchor - h;
      }
      break;
    }
  }

  return clampCropRect(
    {
      x: Math.round(left),
      y: Math.round(top),
      width: Math.round(w),
      height: Math.round(h),
    },
    bounds,
    minSize,
  );
}

// ─── 3. Stroke Translation & Clipping on Crop ───────────────────────────────

/**
 * Checks whether a stroke has at least one point inside the crop rectangle.
 */
export function isStrokeInCrop(stroke: Stroke, cropRect: CropRect): boolean {
  const minX = cropRect.x;
  const maxX = cropRect.x + cropRect.width;
  const minY = cropRect.y;
  const maxY = cropRect.y + cropRect.height;

  return stroke.points.some(
    (p) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY,
  );
}

/**
 * Crops an array of strokes against a crop rectangle:
 *  - Drops strokes that fall entirely outside the crop area.
 *  - Translates surviving strokes so coordinates map to the new image space:
 *    x' = x - cropRect.x, y' = y - cropRect.y.
 *  - Clamps point coordinates to [0..cropRect.width, 0..cropRect.height].
 */
export function cropStrokes(strokes: Stroke[], cropRect: CropRect): Stroke[] {
  const result: Stroke[] = [];

  for (const stroke of strokes) {
    if (!isStrokeInCrop(stroke, cropRect)) {
      // Drop strokes outside the crop box
      continue;
    }

    const newPoints = stroke.points.map((p) => ({
      x: Math.max(0, Math.min(cropRect.width, Math.round(p.x - cropRect.x))),
      y: Math.max(0, Math.min(cropRect.height, Math.round(p.y - cropRect.y))),
    }));

    result.push({
      ...stroke,
      points: newPoints,
    });
  }

  return result;
}

// ─── 4. Canvas Transformation Operations ────────────────────────────────────

/**
 * Creates an offscreen canvas containing the image rotated by 90° (+90 CW or -90 CCW).
 * Enforces canvas limits from imageProcessing.ts.
 */
export function createRotatedCanvas(
  source: CanvasImageSource,
  currentWidth: number,
  currentHeight: number,
  angle: 90 | -90,
): { canvas: HTMLCanvasElement; width: number; height: number } {
  let newWidth = currentHeight;
  let newHeight = currentWidth;

  // Enforce safety limits
  const safeDim = calculateDownscaledDimensions(
    newWidth,
    newHeight,
    MAX_LONGEST_SIDE,
    MAX_CANVAS_PIXELS,
  );
  newWidth = safeDim.width;
  newHeight = safeDim.height;

  const canvas = document.createElement("canvas");
  canvas.width = newWidth;
  canvas.height = newHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2D context for rotated canvas");
  }

  if (angle === 90) {
    // Clockwise: translate to right edge and rotate +90°
    ctx.translate(newWidth, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(source, 0, 0, currentWidth, currentHeight, 0, 0, newHeight, newWidth);
  } else {
    // Counter-Clockwise: translate to bottom edge and rotate -90°
    ctx.translate(0, newHeight);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(source, 0, 0, currentWidth, currentHeight, 0, 0, newHeight, newWidth);
  }

  return { canvas, width: newWidth, height: newHeight };
}

/**
 * Creates an offscreen canvas containing the cropped slice of the source image.
 * Enforces canvas limits from imageProcessing.ts.
 */
export function createCroppedCanvas(
  source: CanvasImageSource,
  cropRect: CropRect,
): { canvas: HTMLCanvasElement; width: number; height: number } {
  let targetWidth = cropRect.width;
  let targetHeight = cropRect.height;

  const safeDim = calculateDownscaledDimensions(
    targetWidth,
    targetHeight,
    MAX_LONGEST_SIDE,
    MAX_CANVAS_PIXELS,
  );
  targetWidth = safeDim.width;
  targetHeight = safeDim.height;

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2D context for cropped canvas");
  }

  ctx.drawImage(
    source,
    cropRect.x,
    cropRect.y,
    cropRect.width,
    cropRect.height,
    0,
    0,
    targetWidth,
    targetHeight,
  );

  return { canvas, width: targetWidth, height: targetHeight };
}
