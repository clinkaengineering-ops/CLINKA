import { cn } from "@/utils/cn";
import { nationalityFlag } from "@/lib/nationalityFlags";

export function NationalityLabel({
  nationality,
  className,
  flagClassName,
}: {
  nationality: string;
  className?: string;
  flagClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("text-base leading-none", flagClassName)} aria-hidden>
        {nationalityFlag(nationality)}
      </span>
      <span>{nationality}</span>
    </span>
  );
}
