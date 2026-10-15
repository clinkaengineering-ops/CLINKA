"use client";

import { useEffect, useRef } from "react";
import { IconShield, IconClose } from "@/components/Icons";
import { Button } from "@/components/UI";
import { useI18n } from "@/i18n";

interface MessagesPolicyModalProps {
  open: boolean;
  onClose: () => void;
}

export function MessagesPolicyModal({ open, onClose }: MessagesPolicyModalProps) {
  const { t } = useI18n();
  const acknowledgeButtonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key press
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Autofocus the acknowledge button when modal opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        acknowledgeButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="messaging-rules-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-amber-500/30 bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <IconClose width={18} height={18} />
        </button>

        {/* Header with Shield Icon */}
        <div className="flex items-center gap-3.5 mb-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300">
            <IconShield width={22} height={22} />
          </span>
          <div>
            <h3
              id="messaging-rules-modal-title"
              className="text-base font-bold text-slate-900 dark:text-slate-100"
            >
              {t("msg.rules.title")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("msg.rules.popupSubtitle")}
            </p>
          </div>
        </div>

        {/* Messaging Rules Box (Matching screenshot) */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 mb-5">
          <p className="text-sm font-medium leading-relaxed text-amber-950 dark:text-amber-100">
            {t("msg.rules.body")}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-amber-900/80 dark:text-amber-200/80 border-t border-amber-500/20 pt-2.5">
            {t("msg.rules.banNote")}
          </p>
        </div>

        {/* Acknowledge Button */}
        <Button
          ref={acknowledgeButtonRef}
          type="button"
          variant="primary"
          className="w-full h-11 font-semibold text-sm shadow-md"
          onClick={onClose}
        >
          {t("msg.rules.acknowledge")}
        </Button>
      </div>
    </div>
  );
}

