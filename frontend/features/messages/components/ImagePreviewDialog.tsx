"use client";

import { useCallback, useEffect, useRef, useState, useId } from "react";
import {
  IconClose,
  IconEdit,
  IconSend,
  IconCheck,
  IconRefresh,
} from "@/components/Icons";
import { useI18n } from "@/i18n";
import { cn } from "@/utils/cn";
import { ImageEditorCanvas } from "./ImageEditorCanvas";
import { createCompositeCanvas, type Stroke } from "../lib/drawing";
import { exportEditedImage } from "../lib/imageProcessing";

export interface ImagePreviewDialogProps {
  file: File | null;
  open: boolean;
  onClose: () => void;
  onSend: (file: File, caption?: string) => void;
  initialCaption?: string;
  isSending?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface EditorWorkingState {
  source: CanvasImageSource | null;
  width: number;
  height: number;
  strokes: Stroke[];
  isModified: boolean;
}

export function ImagePreviewDialog({
  file,
  open,
  onClose,
  onSend,
  initialCaption = "",
  isSending = false,
}: ImagePreviewDialogProps) {
  const { t } = useI18n();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const captionInputRef = useRef<HTMLTextAreaElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // View mode: "preview" or "editor"
  const [viewMode, setViewMode] = useState<"preview" | "editor">("preview");

  const [caption, setCaption] = useState(initialCaption);

  // Object URLs
  const [originalObjectUrl, setOriginalObjectUrl] = useState<string | null>(null);
  const [editedPreviewUrl, setEditedPreviewUrl] = useState<string | null>(null);

  // Committed edit state
  const [hasEdits, setHasEdits] = useState(false);
  const [committedSource, setCommittedSource] =
    useState<CanvasImageSource | null>(null);
  const [committedWidth, setCommittedWidth] = useState<number>(0);
  const [committedHeight, setCommittedHeight] = useState<number>(0);
  const [committedStrokes, setCommittedStrokes] = useState<Stroke[]>([]);

  // Live editor working state tracker
  const workingStateRef = useRef<EditorWorkingState>({
    source: null,
    width: 0,
    height: 0,
    strokes: [],
    isModified: false,
  });

  // Cached composite canvas
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Export processing state & error
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Sync initial caption
  useEffect(() => {
    if (open) {
      setCaption(initialCaption);
      setExportError(null);
    }
  }, [open, initialCaption]);

  // Manage original file object URL lifecycle
  useEffect(() => {
    if (!open || !file) {
      setOriginalObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setOriginalObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [open, file]);

  // Cleanup edited preview URL when revoked or file changes
  const cleanupEditedUrl = useCallback(() => {
    if (editedPreviewUrl) {
      URL.revokeObjectURL(editedPreviewUrl);
      setEditedPreviewUrl(null);
    }
  }, [editedPreviewUrl]);

  // Reset all editor state when a new file is loaded or dialog closes
  useEffect(() => {
    if (!open) {
      cleanupEditedUrl();
      setViewMode("preview");
      setHasEdits(false);
      setCommittedSource(null);
      setCommittedWidth(0);
      setCommittedHeight(0);
      setCommittedStrokes([]);
      compositeCanvasRef.current = null;
      setExportError(null);
    }
  }, [open, file, cleanupEditedUrl]);

  // Capture trigger element on open and restore focus on close
  useEffect(() => {
    if (open) {
      triggerElementRef.current = document.activeElement as HTMLElement | null;
    } else if (triggerElementRef.current) {
      triggerElementRef.current.focus();
      triggerElementRef.current = null;
    }
  }, [open]);

  // Restore focus if unmounted while still open
  useEffect(() => {
    return () => {
      if (triggerElementRef.current) {
        triggerElementRef.current.focus();
      }
    };
  }, []);

  // Body scroll lock while dialog is open
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // Move focus into the caption on open in preview mode
  useEffect(() => {
    if (open && viewMode === "preview") {
      const timer = setTimeout(() => {
        captionInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, viewMode]);

  // Global escape key handler
  useEffect(() => {
    if (!open) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (viewMode === "editor") {
          e.preventDefault();
          setViewMode("preview");
        } else {
          e.preventDefault();
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [open, viewMode, onClose]);

  // Focus trap inside the dialog
  const handleDialogKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") {
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  };

  // ─── Editor Actions: Done & Cancel ────────────────────────────────────────

  const handleEditorDone = () => {
    const state = workingStateRef.current;
    const isEdited = state.strokes.length > 0 || state.isModified;
    const w =
      state.width > 0
        ? state.width
        : (state.source as any)?.width > 0
          ? (state.source as any).width
          : 800;
    const h =
      state.height > 0
        ? state.height
        : (state.source as any)?.height > 0
          ? (state.source as any).height
          : 600;

    if (isEdited && w > 0 && h > 0) {
      const canvas = createCompositeCanvas(
        state.source,
        w,
        h,
        state.strokes,
      );

      compositeCanvasRef.current = canvas;
      setCommittedSource(state.source);
      setCommittedWidth(w);
      setCommittedHeight(h);
      setCommittedStrokes(state.strokes);
      setHasEdits(true);

      // Convert canvas to blob URL for preview display
      if (editedPreviewUrl) {
        URL.revokeObjectURL(editedPreviewUrl);
      }
      try {
        canvas.toBlob((blob) => {
          if (blob) {
            setEditedPreviewUrl(URL.createObjectURL(blob));
          }
        });
      } catch {
        // In environments without native canvas toBlob (e.g. test jsdom), canvas is preserved in ref
      }
    } else if (!isEdited && !hasEdits) {
      setHasEdits(false);
      compositeCanvasRef.current = null;
    }

    setExportError(null);
    setViewMode("preview");
  };

  const handleEditorCancel = () => {
    // Discard any uncommitted edits made in this editing session
    setExportError(null);
    setViewMode("preview");
  };

  const handleRevertAllEdits = () => {
    cleanupEditedUrl();
    setHasEdits(false);
    setCommittedSource(null);
    setCommittedWidth(0);
    setCommittedHeight(0);
    setCommittedStrokes([]);
    compositeCanvasRef.current = null;
    setExportError(null);
  };

  // ─── Sending: Original vs Edited ──────────────────────────────────────────

  const handleSend = async () => {
    if (!file || isSending || isProcessing) return;

    // 1. If unedited, send original file directly untouched
    if (!hasEdits || !compositeCanvasRef.current) {
      onSend(file, caption.trim() || undefined);
      return;
    }

    // 2. Export edited image
    setIsProcessing(true);
    setExportError(null);

    try {
      const canvas = compositeCanvasRef.current;
      const exportedFile = await exportEditedImage(canvas, file);
      onSend(exportedFile, caption.trim() || undefined);
    } catch (err: unknown) {
      console.error("Failed to export edited image:", err);
      const message =
        err instanceof Error ? err.message : t("msg.preview.exportFailed");
      setExportError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendOriginalFallback = () => {
    if (!file || isSending) return;
    onSend(file, caption.trim() || undefined);
  };

  const handleCaptionKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const isMobile =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(max-width: 768px)").matches;

      if (!isMobile) {
        e.preventDefault();
        void handleSend();
      }
    }
  };

  if (!open || !file) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      ref={dialogRef}
      onKeyDown={handleDialogKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className={cn(
          "relative flex flex-col w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-[900px]",
          "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
          "md:rounded-2xl md:border md:border-slate-200 md:dark:border-slate-800 shadow-2xl overflow-hidden",
          "pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]",
        )}
      >
        {/* ─── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 me-3">
            <h2
              id={titleId}
              className="text-base font-bold text-slate-900 dark:text-slate-100 truncate"
            >
              {viewMode === "editor" ? t("msg.preview.edit") : t("msg.preview.title")}
            </h2>

            {viewMode === "preview" && (
              <>
                <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0 truncate">
                  {file.name} ({formatFileSize(file.size)})
                </span>

                {hasEdits && (
                  <span className="inline-flex items-center gap-1.5 ms-1">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-electric-500/10 text-electric-500 border border-electric-500/20">
                      {t("msg.preview.editedIndicator")}
                    </span>

                    <button
                      type="button"
                      onClick={handleRevertAllEdits}
                      className="text-xs text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 underline transition focus-visible:ring-2 focus-visible:ring-rose-500/50 outline-none rounded"
                    >
                      {t("msg.preview.revertEdits")}
                    </button>
                  </span>
                )}
              </>
            )}
          </div>

          {viewMode === "editor" ? (
            /* Editor Mode Header Buttons (Cancel / Done) */
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleEditorCancel}
                aria-label={t("msg.preview.cancel")}
                className="min-h-[44px] min-w-[44px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-xs transition focus-visible:ring-2 focus-visible:ring-electric-500/50 outline-none"
              >
                {t("msg.preview.cancel")}
              </button>

              <button
                type="button"
                onClick={handleEditorDone}
                aria-label={t("msg.preview.done")}
                className="min-h-[44px] min-w-[44px] px-4 py-1.5 rounded-xl bg-electric-500 hover:bg-electric-400 text-white font-semibold text-xs shadow-sm shadow-electric-500/30 transition focus-visible:ring-2 focus-visible:ring-electric-500/50 outline-none inline-flex items-center gap-1.5"
              >
                <IconCheck width={16} height={16} />
                <span>{t("msg.preview.done")}</span>
              </button>
            </div>
          ) : (
            /* Preview Mode Close Button */
            <button
              type="button"
              onClick={onClose}
              aria-label={t("msg.preview.close")}
              title={t("msg.preview.close")}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus-visible:ring-2 focus-visible:ring-electric-500/50 outline-none"
            >
              <IconClose width={20} height={20} />
            </button>
          )}
        </div>

        {/* ─── Export Error Fallback Banner ─────────────────────────────────── */}
        {exportError && (
          <div className="mx-4 sm:mx-6 my-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between gap-3 shrink-0">
            <span className="flex-1">{exportError}</span>
            <button
              type="button"
              onClick={handleSendOriginalFallback}
              className="underline font-semibold hover:text-rose-700 dark:hover:text-rose-300 shrink-0 text-xs py-1 px-2 rounded focus-visible:ring-2 focus-visible:ring-rose-500/50 outline-none"
            >
              {t("msg.preview.sendOriginal")}
            </button>
          </div>
        )}

        {/* ─── Body: Editor vs Preview ─────────────────────────────────────── */}
        {viewMode === "editor" ? (
          /* Editor View */
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <ImageEditorCanvas
              file={file}
              imageSource={committedSource}
              imageWidth={committedWidth}
              imageHeight={committedHeight}
              initialStrokes={committedStrokes}
              onWorkingStateChange={(state) => {
                workingStateRef.current = state;
              }}
              className="flex-1"
            />
          </div>
        ) : (
          /* Preview View */
          <>
            {/* Image viewport — fits without scrolling */}
            <div className="flex-1 relative flex items-center justify-center p-4 sm:p-6 min-h-0 bg-slate-100/70 dark:bg-slate-950/70 overflow-hidden select-none">
              {editedPreviewUrl || originalObjectUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={editedPreviewUrl || originalObjectUrl!}
                  alt={file.name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                />
              ) : (
                <div className="animate-pulse text-sm text-slate-400">
                  Loading…
                </div>
              )}
            </div>

            {/* Caption input section */}
            <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <div className="relative">
                <textarea
                  ref={captionInputRef}
                  rows={2}
                  dir="auto"
                  maxLength={5000}
                  placeholder={t("msg.preview.captionPlaceholder")}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  onKeyDown={handleCaptionKeyDown}
                  aria-label={t("msg.preview.captionPlaceholder")}
                  className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-500/50 transition"
                />
                {caption.length > 4500 && (
                  <span className="absolute bottom-2 end-3 text-[11px] text-slate-400">
                    {caption.length} / 5000
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("editor")}
                aria-label={t("msg.preview.edit")}
                className="min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 inline-flex items-center justify-center gap-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-electric-500/50 outline-none"
              >
                <IconEdit width={18} height={18} />
                <span>{t("msg.preview.edit")}</span>
              </button>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSending || isProcessing}
                  className="min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-sm transition focus-visible:ring-2 focus-visible:ring-electric-500/50 outline-none"
                >
                  {t("msg.preview.cancel")}
                </button>

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending || isProcessing}
                  aria-label={t("msg.preview.send")}
                  className="min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-xl bg-electric-500 hover:bg-electric-400 text-white font-semibold text-sm shadow-md shadow-electric-500/30 transition focus-visible:ring-2 focus-visible:ring-electric-500/50 outline-none inline-flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <IconRefresh width={16} height={16} className="animate-spin" />
                      <span>{t("msg.preview.processing")}</span>
                    </>
                  ) : (
                    <>
                      <IconSend width={16} height={16} />
                      <span>{isSending ? "…" : t("msg.preview.send")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
