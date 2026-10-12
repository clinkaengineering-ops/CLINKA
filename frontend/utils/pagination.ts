export type PageItem = number | "ellipsis";

/** Balanced page size for the engineer card grid (1 / 2 / 3 columns). */
export const ENGINEERS_PAGE_SIZE = 12;

/**
 * Balanced page size for project bids in a single-column stacked list.
 * 5 detailed proposal cards per page keep vertical scroll manageable across
 * mobile, tablet, desktop, and sidebar views while giving clients enough options to compare.
 */
export const BIDS_PAGE_SIZE = 5;

export function parsePageParam(value: string | null | undefined): number {
  if (!value) return 1;
  const page = Number.parseInt(value, 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

/**
 * Compact numbered pagination: first, last, current window, and ellipses.
 * siblingCount 0 is intended for narrow screens (1 … 5 … 20).
 */
export function getPageItems(
  current: number,
  total: number,
  siblingCount = 1,
): PageItem[] {
  if (total <= 0) return [];
  const safeTotal = Math.max(1, Math.floor(total));
  const safeCurrent = Math.min(Math.max(Math.floor(current) || 1, 1), safeTotal);
  const siblings = Math.max(0, Math.floor(siblingCount));

  const pages = new Set<number>();
  pages.add(1);
  pages.add(safeTotal);
  for (let i = safeCurrent - siblings; i <= safeCurrent + siblings; i += 1) {
    if (i >= 1 && i <= safeTotal) pages.add(i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const items: PageItem[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) {
      if (page - previous === 2) items.push(previous + 1);
      else items.push("ellipsis");
    }
    items.push(page);
    previous = page;
  }
  return items;
}
