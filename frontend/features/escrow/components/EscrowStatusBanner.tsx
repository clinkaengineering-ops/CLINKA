"use client";

import { Button } from "@/components/UI";
import { IconAlert, IconCheck, IconClock, IconClose } from "@/components/Icons";
import { cn } from "@/utils/cn";

type BannerType = "success" | "fail" | "pending" | "info";

const styles: Record<BannerType, string> = {
  success:
    "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200",
  fail: "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200",
  pending:
    "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200",
  info: "bg-electric-500/10 border-electric-500/30 text-electric-800 dark:text-electric-200",
};

const icons: Record<BannerType, React.ReactNode> = {
  success: <IconCheck width={18} height={18} />,
  fail: <IconAlert width={18} height={18} />,
  pending: <IconClock width={18} height={18} />,
  info: <IconAlert width={18} height={18} />,
};

export function EscrowStatusBanner({
  type,
  message,
  onDismiss,
}: {
  type: BannerType;
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm",
        styles[type],
      )}
    >
      {icons[type]}
      <p className="flex-1 font-medium">{message}</p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onDismiss}
        aria-label="Dismiss"
        icon={<IconClose width={14} height={14} />}
      />
    </div>
  );
}
