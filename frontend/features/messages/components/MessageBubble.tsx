import { Avatar } from "@/components/UI";
import { cn } from "@/utils/cn";

interface MessageBubbleProps {
  side: "me" | "them";
  name?: string;
  time: string;
  children: React.ReactNode;
}

export function MessageBubble({ side, name, time, children }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex gap-2 max-w-[80%]",
        side === "me" ? "ms-auto flex-row-reverse" : "",
      )}
    >
      {side === "them" && <Avatar name={name ?? "U"} size={28} />}
      <div>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
            side === "me"
              ? "bg-electric-500 text-white rounded-tr-md"
              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-tl-md",
          )}
        >
          {children}
        </div>
        <p
          className={cn(
            "text-[10px] text-slate-400 mt-1",
            side === "me" ? "text-end" : "",
          )}
        >
          {time}
        </p>
      </div>
    </div>
  );
}
