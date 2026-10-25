"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type DrawingTool,
  type StrokeSize,
  type Stroke,
  type HistoryState,
  DRAWING_COLORS,
  initialHistoryState,
  addStroke as addStrokeHelper,
  undo as undoHelper,
  redo as redoHelper,
  clearAll as clearAllHelper,
} from "../lib/drawing";

export interface UseDrawingStateOptions {
  initialTool?: DrawingTool;
  initialColor?: string;
  initialSize?: StrokeSize;
  initialStrokes?: Stroke[];
  enableKeyboardShortcuts?: boolean;
}

export function useDrawingState(options: UseDrawingStateOptions = {}) {
  const [tool, setToolState] = useState<DrawingTool>(
    options.initialTool ?? "pen",
  );
  const [color, setColor] = useState<string>(
    options.initialColor ?? (options.initialTool === "highlighter" ? "#facc15" : "#ef4444"),
  );
  const [size, setSize] = useState<StrokeSize>(options.initialSize ?? "md");
  const [history, setHistory] = useState<HistoryState>(() => ({
    strokes: options.initialStrokes ?? [],
    redoStack: [],
  }));

  useEffect(() => {
    if (options.initialStrokes) {
      setHistory({
        strokes: options.initialStrokes,
        redoStack: [],
      });
    }
  }, [options.initialStrokes]);

  // When switching between tools, adjust default color if appropriate
  const setTool = useCallback((newTool: DrawingTool) => {
    setToolState(newTool);
    if (newTool === "highlighter" && color !== "#facc15" && color !== "#22c55e") {
      // Default highlighter to yellow if previously using a dark/opaque color
      setColor("#facc15");
    }
  }, [color]);

  const addStroke = useCallback((stroke: Stroke) => {
    setHistory((prev) => addStrokeHelper(prev, stroke));
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => undoHelper(prev));
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => redoHelper(prev));
  }, []);

  const clear = useCallback(() => {
    setHistory((prev) => clearAllHelper(prev));
  }, []);

  const setStrokes = useCallback((newStrokes: Stroke[]) => {
    setHistory((prev) => ({
      strokes: newStrokes,
      redoStack: [],
    }));
  }, []);

  const resetHistory = useCallback((initialStrokes: Stroke[] = []) => {
    setHistory({
      strokes: initialStrokes,
      redoStack: [],
    });
  }, []);

  const canUndo = history.strokes.length > 0;
  const canRedo = history.redoStack.length > 0;
  const canClearAll = history.strokes.length > 0;

  // Keyboard shortcuts: Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl/Cmd+Y
  useEffect(() => {
    if (options.enableKeyboardShortcuts === false) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      const isModifier = e.metaKey || e.ctrlKey;
      if (!isModifier) return;

      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
      } else if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        if (canRedo) redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canUndo, canRedo, undo, redo, options.enableKeyboardShortcuts]);

  return {
    tool,
    color,
    size,
    strokes: history.strokes,
    canUndo,
    canRedo,
    canClearAll,
    setTool,
    setColor,
    setSize,
    addStroke,
    undo,
    redo,
    clearAll: clear,
    setStrokes,
    resetHistory,
  };
}
