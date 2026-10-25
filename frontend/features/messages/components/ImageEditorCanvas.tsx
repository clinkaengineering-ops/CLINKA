"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  IconPen,
  IconHighlighter,
  IconUndo,
  IconRedo,
  IconTrash,
  IconRotateCcw,
  IconRotateCw,
  IconCrop,
  IconRefresh,
  IconCheck,
  IconClose,
} from "@/components/Icons";
import { useI18n } from "@/i18n";
import { cn } from "@/utils/cn";
import {
  type Point,
  type Stroke,
  DRAWING_COLORS,
  calculateStrokeWidth,
  clientToImageCoords,
  drawIncrementalSegment,
  redrawCanvas,
} from "../lib/drawing";
import {
  type CropRect,
  type CropPreset,
  type HandleType,
  getPresetRatio,
  clampCropRect,
  fitCropRectToAspect,
  resizeCropRect,
  cropStrokes,
  rotateStrokes,
  createRotatedCanvas,
  createCroppedCanvas,
  MIN_CROP_SIZE,
} from "../lib/cropRotate";
import { useDrawingState } from "../hooks/useDrawingState";
import { loadImage } from "../lib/imageProcessing";

export interface ImageEditorCanvasProps {
  imageSource?: CanvasImageSource | null;
  imageWidth?: number;
  imageHeight?: number;
  initialStrokes?: Stroke[];
  file?: File | Blob | null;
  className?: string;
  onStrokesChange?: (strokes: Stroke[]) => void;
  onImageChange?: (info: {
    source: CanvasImageSource;
    width: number;
    height: number;
  }) => void;
  onWorkingStateChange?: (state: {
    source: CanvasImageSource | null;
    width: number;
    height: number;
    strokes: Stroke[];
    isModified: boolean;
  }) => void;
}

interface TransformSnapshot {
  source: CanvasImageSource;
  width: number;
  height: number;
  strokes: Stroke[];
}

export function ImageEditorCanvas({
  imageSource: initialSource = null,
  imageWidth: initialWidth = 0,
  imageHeight: initialHeight = 0,
  initialStrokes,
  file,
  className,
  onStrokesChange,
  onImageChange,
  onWorkingStateChange,
}: ImageEditorCanvasProps) {
  const { t } = useI18n();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const currentPointsRef = useRef<Point[]>([]);

  // Working image source and dimensions
  const [workingSource, setWorkingSource] =
    useState<CanvasImageSource | null>(initialSource);
  const [imgWidth, setImgWidth] = useState<number>(initialWidth);
  const [imgHeight, setImgHeight] = useState<number>(initialHeight);

  // Original image state for Reset
  const originalSourceRef = useRef<CanvasImageSource | null>(initialSource);
  const originalWidthRef = useRef<number>(initialWidth);
  const originalHeightRef = useRef<number>(initialHeight);

  // Tracking modifications for confirmation dialog
  const [isModified, setIsModified] = useState(false);

  // Snapshot undo history for image transformations (rotate / crop)
  const transformHistoryRef = useRef<TransformSnapshot[]>([]);
  const [transformHistoryCount, setTransformHistoryCount] = useState(0);

  // Crop mode state
  const [isCropActive, setIsCropActive] = useState(false);
  const [cropPreset, setCropPreset] = useState<CropPreset>("free");
  const [cropRect, setCropRect] = useState<CropRect>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // Active crop dragging reference
  const activeCropDragRef = useRef<{
    handle: HandleType;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startCropRect: CropRect;
  } | null>(null);

  // Display viewport dimensions (CSS pixels)
  const [displaySize, setDisplaySize] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  const {
    tool,
    color,
    size,
    strokes,
    canUndo: canDrawingUndo,
    canRedo,
    canClearAll,
    setTool,
    setColor,
    setSize,
    addStroke,
    undo: drawingUndo,
    redo,
    clearAll,
    setStrokes,
    resetHistory,
  } = useDrawingState({
    enableKeyboardShortcuts: !isCropActive,
    initialStrokes,
  });

  // Sync external stroke changes
  useEffect(() => {
    onStrokesChange?.(strokes);
  }, [strokes, onStrokesChange]);

  // Sync external working state changes
  useEffect(() => {
    onWorkingStateChange?.({
      source: workingSource,
      width: imgWidth,
      height: imgHeight,
      strokes,
      isModified,
    });
  }, [workingSource, imgWidth, imgHeight, strokes, isModified, onWorkingStateChange]);

  // Decode file if passed
  useEffect(() => {
    if (!file) return;
    let isCancelled = false;
    let cleanupFn: (() => void) | null = null;

    loadImage(file)
      .then((decoded) => {
        if (isCancelled) {
          decoded.close();
          return;
        }
        cleanupFn = decoded.close;
        originalSourceRef.current = decoded.source;
        originalWidthRef.current = decoded.width;
        originalHeightRef.current = decoded.height;
        setWorkingSource(decoded.source);
        setImgWidth(decoded.width);
        setImgHeight(decoded.height);
        setIsModified(false);
        transformHistoryRef.current = [];
        setTransformHistoryCount(0);
        onImageChange?.({
          source: decoded.source,
          width: decoded.width,
          height: decoded.height,
        });
      })
      .catch((err) => {
        console.error("Failed to load image in ImageEditorCanvas:", err);
      });

    return () => {
      isCancelled = true;
      cleanupFn?.();
    };
  }, [file, onImageChange]);

  // Update from initialSource props if provided directly
  useEffect(() => {
    if (initialSource) {
      originalSourceRef.current = initialSource;
      originalWidthRef.current = initialWidth;
      originalHeightRef.current = initialHeight;
      setWorkingSource(initialSource);
      setImgWidth(initialWidth);
      setImgHeight(initialHeight);
      setIsModified(false);
      transformHistoryRef.current = [];
      setTransformHistoryCount(0);
      onImageChange?.({
        source: initialSource,
        width: initialWidth,
        height: initialHeight,
      });
    }
  }, [initialSource, initialWidth, initialHeight, onImageChange]);

  // Calculate fitting display size inside container
  const updateDisplaySize = useCallback(() => {
    const container = containerRef.current;
    if (!container || imgWidth <= 0 || imgHeight <= 0) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    if (containerWidth <= 0 || containerHeight <= 0) return;

    const imageAspect = imgWidth / imgHeight;
    const containerAspect = containerWidth / containerHeight;

    let displayW: number;
    let displayH: number;

    if (containerAspect > imageAspect) {
      displayH = containerHeight;
      displayW = Math.round(containerHeight * imageAspect);
    } else {
      displayW = containerWidth;
      displayH = Math.round(containerWidth / imageAspect);
    }

    setDisplaySize({ width: displayW, height: displayH });
  }, [imgWidth, imgHeight]);

  // ResizeObserver for responsive canvas fitting
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateDisplaySize();
    const observer = new ResizeObserver(() => {
      updateDisplaySize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [updateDisplaySize]);

  // Redraw canvas on stroke changes or resize (Retina sharp high-DPI)
  const fullRedraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || imgWidth <= 0 || imgHeight <= 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const bufferWidth = Math.max(1, Math.round(displaySize.width * dpr));
    const bufferHeight = Math.max(1, Math.round(displaySize.height * dpr));

    if (canvas.width !== bufferWidth || canvas.height !== bufferHeight) {
      canvas.width = bufferWidth;
      canvas.height = bufferHeight;
    }

    const scaleX = bufferWidth / imgWidth;
    const scaleY = bufferHeight / imgHeight;
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);

    redrawCanvas(ctx, workingSource, imgWidth, imgHeight, strokes);
  }, [displaySize, imgWidth, imgHeight, workingSource, strokes]);

  useEffect(() => {
    fullRedraw();
  }, [fullRedraw]);

  // ─── Rotation Handlers ────────────────────────────────────────────────────

  const handleRotate = useCallback(
    (angle: 90 | -90) => {
      if (!workingSource || imgWidth <= 0 || imgHeight <= 0) return;

      // Save transform snapshot for undo
      transformHistoryRef.current.push({
        source: workingSource,
        width: imgWidth,
        height: imgHeight,
        strokes,
      });
      setTransformHistoryCount((c) => c + 1);

      const rotated = createRotatedCanvas(workingSource, imgWidth, imgHeight, angle);
      const rotatedStrokes = rotateStrokes(strokes, angle, imgWidth, imgHeight);

      setWorkingSource(rotated.canvas);
      setImgWidth(rotated.width);
      setImgHeight(rotated.height);
      setStrokes(rotatedStrokes);
      setIsModified(true);

      onImageChange?.({
        source: rotated.canvas,
        width: rotated.width,
        height: rotated.height,
      });
    },
    [workingSource, imgWidth, imgHeight, strokes, setStrokes, onImageChange],
  );

  // ─── Crop Mode Handlers ───────────────────────────────────────────────────

  const enterCropMode = useCallback(() => {
    if (imgWidth <= 0 || imgHeight <= 0) return;

    const initialRatio = getPresetRatio(
      cropPreset,
      originalWidthRef.current / (originalHeightRef.current || 1),
    );

    let initialCrop: CropRect;
    if (initialRatio !== null) {
      initialCrop = fitCropRectToAspect(
        initialRatio,
        { width: imgWidth, height: imgHeight },
        0.9,
      );
    } else {
      // Free: default to 90% box centered
      const w = Math.round(imgWidth * 0.9);
      const h = Math.round(imgHeight * 0.9);
      initialCrop = clampCropRect(
        {
          x: Math.round((imgWidth - w) / 2),
          y: Math.round((imgHeight - h) / 2),
          width: w,
          height: h,
        },
        { width: imgWidth, height: imgHeight },
      );
    }

    setCropRect(initialCrop);
    setIsCropActive(true);
  }, [imgWidth, imgHeight, cropPreset]);

  const cancelCropMode = useCallback(() => {
    setIsCropActive(false);
    activeCropDragRef.current = null;
  }, []);

  const applyCrop = useCallback(() => {
    if (!workingSource || cropRect.width <= 0 || cropRect.height <= 0) {
      cancelCropMode();
      return;
    }

    // Save transform snapshot for undo
    transformHistoryRef.current.push({
      source: workingSource,
      width: imgWidth,
      height: imgHeight,
      strokes,
    });
    setTransformHistoryCount((c) => c + 1);

    const cropped = createCroppedCanvas(workingSource, cropRect);
    const updatedStrokes = cropStrokes(strokes, cropRect);

    setWorkingSource(cropped.canvas);
    setImgWidth(cropped.width);
    setImgHeight(cropped.height);
    setStrokes(updatedStrokes);
    setIsModified(true);
    setIsCropActive(false);
    activeCropDragRef.current = null;

    onImageChange?.({
      source: cropped.canvas,
      width: cropped.width,
      height: cropped.height,
    });
  }, [
    workingSource,
    cropRect,
    imgWidth,
    imgHeight,
    strokes,
    setStrokes,
    cancelCropMode,
    onImageChange,
  ]);

  const handleSelectPreset = useCallback(
    (preset: CropPreset) => {
      setCropPreset(preset);
      const ratio = getPresetRatio(
        preset,
        originalWidthRef.current / (originalHeightRef.current || 1),
      );

      if (ratio !== null) {
        const nextRect = fitCropRectToAspect(
          ratio,
          { width: imgWidth, height: imgHeight },
          0.9,
        );
        setCropRect(nextRect);
      }
    },
    [imgWidth, imgHeight],
  );

  // Crop dragging pointer events
  const handleCropPointerDown = (
    e: ReactPointerEvent<HTMLElement>,
    handle: HandleType,
  ) => {
    e.stopPropagation();
    if (activeCropDragRef.current !== null) return;
    if (e.button !== 0) return;

    activeCropDragRef.current = {
      handle,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startCropRect: { ...cropRect },
    };

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleCropPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const drag = activeCropDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const deltaClientX = e.clientX - drag.startClientX;
    const deltaClientY = e.clientY - drag.startClientY;

    if (displaySize.width <= 0 || displaySize.height <= 0) return;

    const scaleX = imgWidth / displaySize.width;
    const scaleY = imgHeight / displaySize.height;

    const deltaImageX = deltaClientX * scaleX;
    const deltaImageY = deltaClientY * scaleY;

    const ratio = getPresetRatio(
      cropPreset,
      originalWidthRef.current / (originalHeightRef.current || 1),
    );

    const nextRect = resizeCropRect(
      drag.startCropRect,
      drag.handle,
      deltaImageX,
      deltaImageY,
      { width: imgWidth, height: imgHeight },
      ratio,
      MIN_CROP_SIZE,
    );

    setCropRect(nextRect);
  };

  const handleCropPointerUp = (e: ReactPointerEvent<HTMLElement>) => {
    const drag = activeCropDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }

    activeCropDragRef.current = null;
  };

  // Keyboard shortcut listener for Crop Mode (Escape = Cancel, Enter = Apply)
  useEffect(() => {
    if (!isCropActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cancelCropMode();
      } else if (e.key === "Enter") {
        e.preventDefault();
        applyCrop();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCropActive, cancelCropMode, applyCrop]);

  // ─── Undo & Reset ─────────────────────────────────────────────────────────

  const canUndo = canDrawingUndo || transformHistoryCount > 0;

  const handleUndo = useCallback(() => {
    if (canDrawingUndo) {
      drawingUndo();
    } else if (transformHistoryRef.current.length > 0) {
      const prev = transformHistoryRef.current.pop()!;
      setTransformHistoryCount((c) => Math.max(0, c - 1));
      setWorkingSource(prev.source);
      setImgWidth(prev.width);
      setImgHeight(prev.height);
      setStrokes(prev.strokes);
      onImageChange?.({
        source: prev.source,
        width: prev.width,
        height: prev.height,
      });
    }
  }, [canDrawingUndo, drawingUndo, setStrokes, onImageChange]);

  const handleReset = useCallback(() => {
    const hasEdits = strokes.length > 0 || isModified;
    if (!hasEdits) return;

    if (window.confirm(t("msg.editor.resetConfirm"))) {
      if (originalSourceRef.current) {
        setWorkingSource(originalSourceRef.current);
        setImgWidth(originalWidthRef.current);
        setImgHeight(originalHeightRef.current);
        resetHistory([]);
        setIsModified(false);
        transformHistoryRef.current = [];
        setTransformHistoryCount(0);
        setIsCropActive(false);

        onImageChange?.({
          source: originalSourceRef.current,
          width: originalWidthRef.current,
          height: originalHeightRef.current,
        });
      }
    }
  }, [strokes.length, isModified, t, resetHistory, onImageChange]);

  // ─── Pointer Event Handlers for Drawing ───────────────────────────────────

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (isCropActive) return;
    if (activePointerIdRef.current !== null) return;
    if (e.button !== 0) return;

    const canvas = canvasRef.current;
    if (!canvas || imgWidth <= 0 || imgHeight <= 0) return;

    const rect = canvas.getBoundingClientRect();
    const pt = clientToImageCoords(
      e.clientX,
      e.clientY,
      rect,
      imgWidth,
      imgHeight,
    );

    activePointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    currentPointsRef.current = [pt];

    const strokeWidth = calculateStrokeWidth(size, tool, imgWidth, imgHeight);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.save();
      const scaleX = canvas.width / imgWidth;
      const scaleY = canvas.height / imgHeight;
      ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, strokeWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      if (tool === "highlighter") {
        ctx.globalCompositeOperation = "multiply";
        ctx.globalAlpha = 0.4;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1.0;
      }
      ctx.fill();
      ctx.restore();
    }
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (isCropActive) return;
    if (activePointerIdRef.current !== e.pointerId) return;

    const canvas = canvasRef.current;
    if (!canvas || imgWidth <= 0 || imgHeight <= 0) return;

    const rect = canvas.getBoundingClientRect();
    const pt = clientToImageCoords(
      e.clientX,
      e.clientY,
      rect,
      imgWidth,
      imgHeight,
    );

    const pts = currentPointsRef.current;
    const prevPt = pts[pts.length - 1];
    if (prevPt && prevPt.x === pt.x && prevPt.y === pt.y) return;

    pts.push(pt);

    const ctx = canvas.getContext("2d");
    if (ctx && prevPt) {
      ctx.save();
      const scaleX = canvas.width / imgWidth;
      const scaleY = canvas.height / imgHeight;
      ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);

      const strokeWidth = calculateStrokeWidth(size, tool, imgWidth, imgHeight);
      drawIncrementalSegment(ctx, tool, color, strokeWidth, prevPt, pt);
      ctx.restore();
    }
  };

  const finishStroke = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }

    activePointerIdRef.current = null;
    const pts = [...currentPointsRef.current];
    currentPointsRef.current = [];

    if (pts.length > 0) {
      const strokeWidth = calculateStrokeWidth(size, tool, imgWidth, imgHeight);
      const newStroke: Stroke = {
        id:
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2),
        tool,
        color,
        size,
        width: strokeWidth,
        points: pts,
      };
      addStroke(newStroke);
    }
  };

  // Convert cropRect in image coordinates to display coordinates
  const scaleDisplayX = imgWidth > 0 ? displaySize.width / imgWidth : 1;
  const scaleDisplayY = imgHeight > 0 ? displaySize.height / imgHeight : 1;

  const cropDisplay = {
    left: Math.round(cropRect.x * scaleDisplayX),
    top: Math.round(cropRect.y * scaleDisplayY),
    width: Math.round(cropRect.width * scaleDisplayX),
    height: Math.round(cropRect.height * scaleDisplayY),
  };

  return (
    <div
      className={cn(
        "relative flex flex-col w-full h-full min-h-0 select-none overflow-hidden bg-slate-900 text-slate-100",
        className,
      )}
    >
      {/* Canvas & Crop Overlay Viewport */}
      <div
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center p-3 sm:p-4 min-h-0 overflow-hidden"
      >
        <div
          style={{
            width: displaySize.width ? `${displaySize.width}px` : "auto",
            height: displaySize.height ? `${displaySize.height}px` : "auto",
          }}
          className="relative max-w-full max-h-full"
        >
          {/* Main Drawing Canvas */}
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishStroke}
            onPointerCancel={finishStroke}
            style={{
              width: "100%",
              height: "100%",
              touchAction: "none",
            }}
            className={cn(
              "rounded-lg shadow-md block w-full h-full",
              isCropActive ? "cursor-default" : "cursor-crosshair",
            )}
          />

          {/* Crop Mode Overlay */}
          {isCropActive && displaySize.width > 0 && displaySize.height > 0 && (
            <div
              className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-lg"
              onPointerMove={handleCropPointerMove}
              onPointerUp={handleCropPointerUp}
              onPointerCancel={handleCropPointerUp}
            >
              {/* 4 Dimmed Exterior Panels */}
              <div
                style={{ height: `${Math.max(0, cropDisplay.top)}px` }}
                className="absolute top-0 inset-x-0 bg-black/60 backdrop-blur-[1px]"
              />
              <div
                style={{
                  top: `${Math.max(0, cropDisplay.top + cropDisplay.height)}px`,
                }}
                className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-[1px]"
              />
              <div
                style={{
                  top: `${Math.max(0, cropDisplay.top)}px`,
                  height: `${Math.max(0, cropDisplay.height)}px`,
                  width: `${Math.max(0, cropDisplay.left)}px`,
                }}
                className="absolute left-0 bg-black/60 backdrop-blur-[1px]"
              />
              <div
                style={{
                  top: `${Math.max(0, cropDisplay.top)}px`,
                  height: `${Math.max(0, cropDisplay.height)}px`,
                  left: `${Math.max(0, cropDisplay.left + cropDisplay.width)}px`,
                }}
                className="absolute right-0 bg-black/60 backdrop-blur-[1px]"
              />

              {/* Crop Frame Box */}
              <div
                style={{
                  left: `${cropDisplay.left}px`,
                  top: `${cropDisplay.top}px`,
                  width: `${cropDisplay.width}px`,
                  height: `${cropDisplay.height}px`,
                  touchAction: "none",
                }}
                onPointerDown={(e) => handleCropPointerDown(e, "move")}
                className="absolute pointer-events-auto border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)] cursor-move select-none"
              >
                {/* Rule-of-Thirds Grid */}
                <div className="absolute inset-0 pointer-events-none opacity-40 grid grid-cols-3 grid-rows-3">
                  <div className="border-e border-b border-white" />
                  <div className="border-e border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-e border-b border-white" />
                  <div className="border-e border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-e border-white" />
                  <div className="border-e border-white" />
                  <div />
                </div>

                {/* 4 Corner Handles with 44px Touch Hit Targets */}
                {/* Top-Left (nw) */}
                <div
                  onPointerDown={(e) => handleCropPointerDown(e, "nw")}
                  className="absolute -top-[22px] -left-[22px] w-[44px] h-[44px] flex items-center justify-center cursor-nwse-resize z-30"
                  aria-label="Top-left resize handle"
                >
                  <span className="w-3.5 h-3.5 bg-white border-2 border-slate-900 rounded-sm shadow-md block pointer-events-none" />
                </div>

                {/* Top-Right (ne) */}
                <div
                  onPointerDown={(e) => handleCropPointerDown(e, "ne")}
                  className="absolute -top-[22px] -right-[22px] w-[44px] h-[44px] flex items-center justify-center cursor-nesw-resize z-30"
                  aria-label="Top-right resize handle"
                >
                  <span className="w-3.5 h-3.5 bg-white border-2 border-slate-900 rounded-sm shadow-md block pointer-events-none" />
                </div>

                {/* Bottom-Right (se) */}
                <div
                  onPointerDown={(e) => handleCropPointerDown(e, "se")}
                  className="absolute -bottom-[22px] -right-[22px] w-[44px] h-[44px] flex items-center justify-center cursor-nwse-resize z-30"
                  aria-label="Bottom-right resize handle"
                >
                  <span className="w-3.5 h-3.5 bg-white border-2 border-slate-900 rounded-sm shadow-md block pointer-events-none" />
                </div>

                {/* Bottom-Left (sw) */}
                <div
                  onPointerDown={(e) => handleCropPointerDown(e, "sw")}
                  className="absolute -bottom-[22px] -left-[22px] w-[44px] h-[44px] flex items-center justify-center cursor-nesw-resize z-30"
                  aria-label="Bottom-left resize handle"
                >
                  <span className="w-3.5 h-3.5 bg-white border-2 border-slate-900 rounded-sm shadow-md block pointer-events-none" />
                </div>

                {/* 4 Edge Handles with 44px Touch Hit Targets */}
                {/* Top (n) */}
                <div
                  onPointerDown={(e) => handleCropPointerDown(e, "n")}
                  className="absolute -top-[22px] left-1/2 -translate-x-1/2 w-[44px] h-[44px] flex items-center justify-center cursor-ns-resize z-20"
                  aria-label="Top edge resize handle"
                >
                  <span className="w-6 h-1.5 bg-white border border-slate-900 rounded-full shadow block pointer-events-none" />
                </div>

                {/* Bottom (s) */}
                <div
                  onPointerDown={(e) => handleCropPointerDown(e, "s")}
                  className="absolute -bottom-[22px] left-1/2 -translate-x-1/2 w-[44px] h-[44px] flex items-center justify-center cursor-ns-resize z-20"
                  aria-label="Bottom edge resize handle"
                >
                  <span className="w-6 h-1.5 bg-white border border-slate-900 rounded-full shadow block pointer-events-none" />
                </div>

                {/* Left (w) */}
                <div
                  onPointerDown={(e) => handleCropPointerDown(e, "w")}
                  className="absolute top-1/2 -left-[22px] -translate-y-1/2 w-[44px] h-[44px] flex items-center justify-center cursor-ew-resize z-20"
                  aria-label="Left edge resize handle"
                >
                  <span className="w-1.5 h-6 bg-white border border-slate-900 rounded-full shadow block pointer-events-none" />
                </div>

                {/* Right (e) */}
                <div
                  onPointerDown={(e) => handleCropPointerDown(e, "e")}
                  className="absolute top-1/2 -right-[22px] -translate-y-1/2 w-[44px] h-[44px] flex items-center justify-center cursor-ew-resize z-20"
                  aria-label="Right edge resize handle"
                >
                  <span className="w-1.5 h-6 bg-white border border-slate-900 rounded-full shadow block pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Bottom Toolbar ──────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-slate-800 bg-slate-950/95 backdrop-blur px-3 sm:px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))]">
        {isCropActive ? (
          /* Crop Controls Mode Toolbar */
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            {/* Presets (Free, Original, 1:1, 4:3, 16:9) */}
            <div className="flex items-center gap-1 shrink-0 p-1 bg-slate-900 rounded-xl border border-slate-800">
              {(
                [
                  { id: "free", label: t("msg.editor.presetFree") },
                  { id: "original", label: t("msg.editor.presetOriginal") },
                  { id: "1:1", label: t("msg.editor.preset1_1") },
                  { id: "4:3", label: t("msg.editor.preset4_3") },
                  { id: "16:9", label: t("msg.editor.preset16_9") },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id)}
                  aria-pressed={cropPreset === preset.id}
                  className={cn(
                    "min-h-[44px] px-3 flex items-center justify-center rounded-lg text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-electric-500/50 outline-none",
                    cropPreset === preset.id
                      ? "bg-electric-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800",
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Cancel & Apply Actions */}
            <div className="flex items-center gap-2 shrink-0 ms-auto">
              <button
                type="button"
                onClick={cancelCropMode}
                title={`${t("msg.editor.cropCancel")} (Escape)`}
                aria-label={t("msg.editor.cropCancel")}
                className="min-h-[44px] min-w-[44px] px-3.5 flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-electric-500/50 outline-none"
              >
                <IconClose width={16} height={16} />
                <span>{t("msg.editor.cropCancel")}</span>
              </button>

              <button
                type="button"
                onClick={applyCrop}
                title={`${t("msg.editor.cropApply")} (Enter)`}
                aria-label={t("msg.editor.cropApply")}
                className="min-h-[44px] min-w-[44px] px-4 flex items-center justify-center gap-1.5 rounded-xl bg-electric-500 hover:bg-electric-400 text-white text-xs font-semibold shadow-sm shadow-electric-500/30 transition focus-visible:ring-2 focus-visible:ring-electric-500/50 outline-none"
              >
                <IconCheck width={16} height={16} />
                <span>{t("msg.editor.cropApply")}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Standard Drawing & Transformation Toolbar */
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            {/* Tool Selection (Pen / Highlighter) */}
            <div className="flex items-center gap-1 shrink-0 p-1 bg-slate-900 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTool("pen")}
                aria-label={t("msg.editor.pen")}
                aria-pressed={tool === "pen"}
                className={cn(
                  "min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg px-2.5 text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-electric-500/50 outline-none",
                  tool === "pen"
                    ? "bg-electric-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800",
                )}
              >
                <IconPen width={18} height={18} />
                <span className="ms-1.5 hidden sm:inline">{t("msg.editor.pen")}</span>
              </button>

              <button
                type="button"
                onClick={() => setTool("highlighter")}
                aria-label={t("msg.editor.highlighter")}
                aria-pressed={tool === "highlighter"}
                className={cn(
                  "min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg px-2.5 text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-electric-500/50 outline-none",
                  tool === "highlighter"
                    ? "bg-electric-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800",
                )}
              >
                <IconHighlighter width={18} height={18} />
                <span className="ms-1.5 hidden sm:inline">
                  {t("msg.editor.highlighter")}
                </span>
              </button>
            </div>

            {/* Stroke Size Selector */}
            <div className="flex items-center gap-1 shrink-0 p-1 bg-slate-900 rounded-xl border border-slate-800">
              {(["sm", "md", "lg"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  aria-label={
                    s === "sm"
                      ? t("msg.editor.sizeSm")
                      : s === "md"
                        ? t("msg.editor.sizeMd")
                        : t("msg.editor.sizeLg")
                  }
                  aria-pressed={size === s}
                  className={cn(
                    "min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition focus-visible:ring-2 focus-visible:ring-electric-500/50 outline-none",
                    size === s
                      ? "bg-slate-800 text-electric-400 ring-1 ring-electric-500/50"
                      : "text-slate-400 hover:text-slate-200",
                  )}
                >
                  <span
                    style={{
                      width: s === "sm" ? 5 : s === "md" ? 9 : 14,
                      height: s === "sm" ? 5 : s === "md" ? 9 : 14,
                    }}
                    className="rounded-full bg-current block"
                  />
                </button>
              ))}
            </div>

            {/* 8 Color Swatches */}
            <div className="flex items-center gap-1.5 shrink-0 px-1.5 overflow-x-auto">
              {DRAWING_COLORS.map((c) => {
                const isSelected = color === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`${t("msg.editor.color")} ${c}`}
                    aria-pressed={isSelected}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition focus-visible:ring-2 focus-visible:ring-electric-500/50 outline-none group"
                  >
                    <span
                      style={{ backgroundColor: c }}
                      className={cn(
                        "w-6 h-6 rounded-full border border-slate-700/60 shadow-sm block transition-transform group-hover:scale-110",
                        isSelected &&
                          "ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110",
                      )}
                    />
                  </button>
                );
              })}
            </div>

            {/* Transform Controls (Rotate Left, Rotate Right, Crop) */}
            <div className="flex items-center gap-1 shrink-0 p-1 bg-slate-900 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleRotate(-90)}
                aria-label={t("msg.editor.rotateLeft")}
                title={t("msg.editor.rotateLeft")}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition focus-visible:ring-2 focus-visible:ring-electric-500/50 outline-none"
              >
                <IconRotateCcw width={18} height={18} />
              </button>

              <button
                type="button"
                onClick={() => handleRotate(90)}
                aria-label={t("msg.editor.rotateRight")}
                title={t("msg.editor.rotateRight")}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition focus-visible:ring-2 focus-visible:ring-electric-500/50 outline-none"
              >
                <IconRotateCw width={18} height={18} />
              </button>

              <button
                type="button"
                onClick={enterCropMode}
                aria-label={t("msg.editor.crop")}
                title={t("msg.editor.crop")}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition focus-visible:ring-2 focus-visible:ring-electric-500/50 outline-none"
              >
                <IconCrop width={18} height={18} />
              </button>
            </div>

            {/* History & Reset Controls (Undo, Redo, Clear Strokes, Reset) */}
            <div className="flex items-center gap-1 shrink-0 ms-auto">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                aria-label={t("msg.editor.undo")}
                title={`${t("msg.editor.undo")} (Ctrl+Z)`}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed transition focus-visible:ring-2 focus-visible:ring-electric-500/50 outline-none"
              >
                <IconUndo width={18} height={18} />
              </button>

              <button
                type="button"
                onClick={redo}
                disabled={!canRedo}
                aria-label={t("msg.editor.redo")}
                title={`${t("msg.editor.redo")} (Ctrl+Shift+Z)`}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed transition focus-visible:ring-2 focus-visible:ring-electric-500/50 outline-none"
              >
                <IconRedo width={18} height={18} />
              </button>

              <button
                type="button"
                onClick={clearAll}
                disabled={!canClearAll}
                aria-label={t("msg.editor.clearAll")}
                title={t("msg.editor.clearAll")}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-900/50 disabled:opacity-35 disabled:cursor-not-allowed transition focus-visible:ring-2 focus-visible:ring-rose-500/50 outline-none"
              >
                <IconTrash width={18} height={18} />
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={!isModified && strokes.length === 0}
                aria-label={t("msg.editor.reset")}
                title={t("msg.editor.reset")}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-amber-950/40 hover:text-amber-400 hover:border-amber-900/50 disabled:opacity-35 disabled:cursor-not-allowed transition focus-visible:ring-2 focus-visible:ring-amber-500/50 outline-none"
              >
                <IconRefresh width={18} height={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
