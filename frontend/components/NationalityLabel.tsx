import { cn } from "@/utils/cn";
import { getNationalityFlag } from "@/lib/nationalities";

type NationalityLabelProps = {
  nationality: string;
  className?: string;
  flagClassName?: string;
};

export function NationalityLabel({
  nationality,
  className,
  flagClassName,
}: NationalityLabelProps) {
  const flag = getNationalityFlag(nationality);

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {flag ? (
        <span
          aria-hidden
          className={cn("text-base leading-none shrink-0", flagClassName)}
          title={nationality}
        >
          {flag}
        </span>
      ) : null}
      <span>{nationality}</span>
    </span>
  );
}
