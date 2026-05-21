import { Badge } from "@/components/UI";
import type { ConversationListItem } from "../types";

interface ProjectContextPanelProps {
  conversation: ConversationListItem | null;
}

const STATUS_COLORS: Record<string, "green" | "amber" | "blue" | "slate"> = {
  OPEN: "blue",
  IN_PROGRESS: "amber",
  COMPLETED: "green",
  CANCELLED: "slate",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Inquiry / Bidding",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function ProjectContextPanel({ conversation }: ProjectContextPanelProps) {
  if (!conversation) {
    return (
      <aside className="border-s border-slate-200 dark:border-slate-800 hidden lg:flex flex-col p-4">
        <p className="text-sm text-slate-500">Select a conversation</p>
      </aside>
    );
  }

  return (
    <aside className="border-s border-slate-200 dark:border-slate-800 hidden lg:flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
          Project
        </p>
        <p className="mt-1 font-bold text-sm">{conversation.projectTitle}</p>
        <div className="mt-2">
          <Badge color={STATUS_COLORS[conversation.projectStatus] ?? "slate"}>
            {STATUS_LABELS[conversation.projectStatus] ??
              conversation.projectStatus.replace("_", " ")}
          </Badge>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
          Participant
        </p>
        <p className="text-sm font-medium">{conversation.participantName}</p>
        <p className="text-xs text-slate-500 mt-4">
          {conversation.projectStatus === "OPEN"
            ? "This thread is for questions while the project is open for bidding."
            : "Project messaging is tied to your active contract."}
        </p>
      </div>
    </aside>
  );
}
