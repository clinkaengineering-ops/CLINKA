"use client";

import { useCallback, useState } from "react";
import type { ChatMessage } from "../types";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";

interface MessageAttachmentProps {
  message: ChatMessage;
  side: "me" | "them";
}

function getAttachmentBadge(name: string, mime?: string | null) {
  const ext = ("." + (name.split(".").pop() || "")).toLowerCase();

  if (ext === ".pdf" || mime === "application/pdf") {
    return { icon: "📄", label: "PDF" };
  }
  if (
    [".zip", ".rar", ".7z", ".tar", ".gz", ".tgz", ".bz2"].includes(ext) ||
    mime?.includes("zip") ||
    mime?.includes("compressed") ||
    mime?.includes("tar")
  ) {
    return { icon: "📦", label: ext.replace(".", "").toUpperCase() || "ZIP" };
  }
  if ([".rvt", ".rfa", ".rte", ".ifc", ".nwd", ".nwc", ".nwf"].includes(ext)) {
    return { icon: "🏗️", label: ext.replace(".", "").toUpperCase() || "BIM" };
  }
  if ([".dwg", ".dxf", ".dgn", ".dwf", ".dwfx"].includes(ext)) {
    return { icon: "📐", label: ext.replace(".", "").toUpperCase() || "CAD" };
  }
  if (
    [
      ".skp",
      ".pln",
      ".pla",
      ".3ds",
      ".max",
      ".blend",
      ".obj",
      ".stl",
      ".step",
      ".stp",
      ".iges",
      ".igs",
      ".fbx",
      ".dae",
    ].includes(ext)
  ) {
    return { icon: "🏛️", label: ext.replace(".", "").toUpperCase() || "3D" };
  }
  if ([".sdb", ".edb", ".std", ".landxml"].includes(ext)) {
    return { icon: "⚡", label: ext.replace(".", "").toUpperCase() || "CALC" };
  }
  if ([".xlsx", ".xls", ".csv"].includes(ext)) {
    return { icon: "📊", label: ext.replace(".", "").toUpperCase() || "XLS" };
  }
  if ([".docx", ".doc", ".txt"].includes(ext)) {
    return { icon: "📝", label: ext.replace(".", "").toUpperCase() || "DOC" };
  }
  return { icon: "📎", label: ext.replace(".", "").toUpperCase() || "FILE" };
}

/**
 * Force-download a cross-origin file with the desired filename.
 *
 * Browsers ignore the `download` attribute on `<a>` for cross-origin hrefs
 * (e.g. Cloudinary URLs). We fetch the file as a Blob using the browser fetch
 * API (Cloudinary sends `Access-Control-Allow-Origin: *`), create a same-origin
 * object URL, and trigger a download with the original filename.
 */
async function downloadWithName(url: string, filename: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

export function MessageAttachment({ message, side }: MessageAttachmentProps) {
  if (!message.attachmentUrl) return null;

  const attachmentUrl = resolveMediaUrl(message.attachmentUrl);
  if (!attachmentUrl) return null;

  const isImage = message.attachmentMime?.startsWith("image/");
  const name = message.attachmentName ?? "Attachment";

  if (isImage) {
    return (
      <a
        href={attachmentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block mb-1"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachmentUrl}
          alt={name}
          className="max-w-[240px] max-h-[200px] rounded-lg object-cover"
        />
      </a>
    );
  }

  const isAudio =
    message.attachmentMime?.toLowerCase().startsWith("audio/") ||
    /\.(webm|weba|ogg|opus|m4a|mp4|mp3|wav|aac)$/i.test(name) ||
    name.startsWith("voice-message") ||
    name.startsWith("voice_note");

  if (isAudio) {
    return (
      <VoiceMessagePlayer
        message={message}
        url={attachmentUrl}
        side={side}
        name={name}
        storedDuration={message.attachmentDuration}
      />
    );
  }

  return <FileDownloadLink url={attachmentUrl} name={name} side={side} mime={message.attachmentMime} />;
}

export { VoiceMessagePlayer };

function FileDownloadLink({
  url,
  name,
  side,
  mime,
}: {
  url: string;
  name: string;
  side: "me" | "them";
  mime?: string | null;
}) {
  const [downloading, setDownloading] = useState(false);
  const badge = getAttachmentBadge(name, mime);

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Only intercept cross-origin downloads where the browser would ignore download attr
      const isCrossOrigin =
        typeof window !== "undefined" && url.startsWith("http") && !url.startsWith(window.location.origin);

      if (!isCrossOrigin) return; // Let the browser handle same-origin downloads natively

      e.preventDefault();
      if (downloading) return;

      setDownloading(true);
      try {
        await downloadWithName(url, name);
      } catch {
        // If blob download fails (e.g. CORS issue), fall back to opening in new tab
        window.open(url, "_blank");
      } finally {
        setDownloading(false);
      }
    },
    [url, name, downloading],
  );

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download={name}
      onClick={handleClick}
      className={
        side === "me"
          ? "flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm hover:bg-white/25 transition mb-1"
          : "flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition mb-1"
      }
    >
      <span aria-hidden className="text-base">
        {badge.icon}
      </span>
      <span className="truncate max-w-[200px] font-medium">
        {downloading ? "Downloading…" : name}
      </span>
      <span
        className={
          side === "me"
            ? "text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/20 text-white shrink-0"
            : "text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0"
        }
      >
        {badge.label}
      </span>
    </a>
  );
}
