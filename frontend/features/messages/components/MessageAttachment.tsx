import type { ChatMessage } from "../types";
import { resolveMediaUrl } from "@/lib/mediaUrl";

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

  const badge = getAttachmentBadge(name, message.attachmentMime);

  return (
    <a
      href={attachmentUrl}
      target="_blank"
      rel="noopener noreferrer"
      download={name}
      className={
        side === "me"
          ? "flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm hover:bg-white/25 transition mb-1"
          : "flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition mb-1"
      }
    >
      <span aria-hidden className="text-base">
        {badge.icon}
      </span>
      <span className="truncate max-w-[200px] font-medium">{name}</span>
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
