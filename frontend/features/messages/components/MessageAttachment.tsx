import type { ChatMessage } from "../types";
import { resolveMediaUrl } from "@/lib/mediaUrl";

interface MessageAttachmentProps {
  message: ChatMessage;
  side: "me" | "them";
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
      <span aria-hidden>📎</span>
      <span className="truncate max-w-[200px] font-medium">{name}</span>
    </a>
  );
}
