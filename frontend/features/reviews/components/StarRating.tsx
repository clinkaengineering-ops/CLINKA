"use client";

import { IconStar } from "@/components/Icons";
import { cn } from "@/utils/cn";

export function StarRating({
  value,
  onChange,
  size = 20,
  readonly = false,
}: {
  value: number;
  onChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5" role={readonly ? "img" : "group"}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            "transition",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110",
          )}
          aria-label={`${star} stars`}
        >
          <IconStar
            width={size}
            height={size}
            className={
              star <= value
                ? "text-amber-500 fill-amber-500"
                : "text-slate-300 dark:text-slate-600"
            }
          />
        </button>
      ))}
    </div>
  );
}
