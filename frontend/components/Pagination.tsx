"use client";

import { IconArrow } from "@/components/Icons";
import { Button } from "@/components/UI";
import { useI18n } from "@/i18n";
import { cn } from "@/utils/cn";
import { getPageItems, type PageItem } from "@/utils/pagination";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
};

function PageButtonList({
  items,
  page,
  disabled,
  onPageChange,
  pageLabel,
}: {
  items: PageItem[];
  page: number;
  disabled?: boolean;
  onPageChange: (next: number) => void;
  pageLabel: (n: number) => string;
}) {
  return (
    <>
      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="inline-flex h-10 min-w-8 items-center justify-center px-1 text-sm text-slate-400 select-none"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={item === page ? "primary" : "secondary"}
            disabled={disabled}
            aria-label={pageLabel(item)}
            aria-current={item === page ? "page" : undefined}
            onClick={() => onPageChange(item)}
            className={cn(
              "h-10 min-w-10 px-2.5 tabular-nums",
              item === page && "pointer-events-none",
            )}
          >
            {item}
          </Button>
        ),
      )}
    </>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
  className,
}: PaginationProps) {
  const { t } = useI18n();

  if (totalPages <= 1) return null;

  const compactItems = getPageItems(page, totalPages, 0);
  const expandedItems = getPageItems(page, totalPages, 1);
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  const goTo = (next: number) => {
    if (disabled) return;
    const clamped = Math.min(Math.max(next, 1), totalPages);
    if (clamped !== page) onPageChange(clamped);
  };

  const pageLabel = (n: number) => t("common.pageNumber", { page: n });

  return (
    <nav
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      aria-label={t("common.pagination")}
    >
      <p className="text-center text-xs text-slate-500 sm:text-start">
        {t("common.pageOf", { page, totalPages })}
      </p>

      <div className="flex items-center justify-center gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={disabled || isFirst}
          aria-label={t("common.previous")}
          onClick={() => goTo(page - 1)}
          className="h-10 shrink-0 px-2.5 sm:px-3"
        >
          <IconArrow
            width={14}
            height={14}
            className="rotate-180 rtl:rotate-0"
            aria-hidden="true"
          />
          <span className="hidden sm:inline">{t("common.previous")}</span>
        </Button>

        <div className="flex items-center gap-1 sm:hidden">
          <PageButtonList
            items={compactItems}
            page={page}
            disabled={disabled}
            onPageChange={goTo}
            pageLabel={pageLabel}
          />
        </div>
        <div className="hidden items-center gap-1 sm:flex">
          <PageButtonList
            items={expandedItems}
            page={page}
            disabled={disabled}
            onPageChange={goTo}
            pageLabel={pageLabel}
          />
        </div>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={disabled || isLast}
          aria-label={t("common.next")}
          onClick={() => goTo(page + 1)}
          className="h-10 shrink-0 px-2.5 sm:px-3"
        >
          <span className="hidden sm:inline">{t("common.next")}</span>
          <IconArrow
            width={14}
            height={14}
            className="rtl:rotate-180"
            aria-hidden="true"
          />
        </Button>
      </div>
    </nav>
  );
}
