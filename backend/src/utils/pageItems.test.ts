type PageItem = number | "ellipsis";

function getPageItems(current: number, total: number, siblingCount = 1): PageItem[] {
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

describe("getPageItems", () => {
  it("returns an empty list when there are no pages", () => {
    expect(getPageItems(1, 0)).toEqual([]);
  });

  it("returns a single page without ellipses", () => {
    expect(getPageItems(1, 1)).toEqual([1]);
  });

  it("lists every page when the range is small", () => {
    expect(getPageItems(2, 5, 1)).toEqual([1, 2, 3, 4, 5]);
  });

  it("inserts ellipses for a large range", () => {
    expect(getPageItems(10, 20, 1)).toEqual([1, "ellipsis", 9, 10, 11, "ellipsis", 20]);
  });

  it("uses a compact window when siblingCount is 0", () => {
    expect(getPageItems(5, 20, 0)).toEqual([1, "ellipsis", 5, "ellipsis", 20]);
  });

  it("clamps invalid current pages", () => {
    expect(getPageItems(0, 3)).toEqual([1, 2, 3]);
    expect(getPageItems(99, 3)).toEqual([1, 2, 3]);
  });
});
