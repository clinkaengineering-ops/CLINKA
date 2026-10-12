import {
  BIDS_PAGE_SIZE,
  ENGINEERS_PAGE_SIZE,
  getPageItems,
  parsePageParam,
} from "./pagination";

describe("parsePageParam", () => {
  it("defaults missing values to page 1", () => {
    expect(parsePageParam(null)).toBe(1);
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam("")).toBe(1);
  });

  it("parses positive integers", () => {
    expect(parsePageParam("3")).toBe(3);
  });

  it("rejects invalid page numbers", () => {
    expect(parsePageParam("0")).toBe(1);
    expect(parsePageParam("-2")).toBe(1);
    expect(parsePageParam("1.5")).toBe(1);
    expect(parsePageParam("abc")).toBe(1);
  });
});

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

describe("ENGINEERS_PAGE_SIZE", () => {
  it("fills complete rows on 1, 2, and 3 column grids", () => {
    expect(ENGINEERS_PAGE_SIZE % 1).toBe(0);
    expect(ENGINEERS_PAGE_SIZE % 2).toBe(0);
    expect(ENGINEERS_PAGE_SIZE % 3).toBe(0);
  });
});

describe("BIDS_PAGE_SIZE", () => {
  it("provides a balanced positive integer page size for vertical bid lists", () => {
    expect(Number.isInteger(BIDS_PAGE_SIZE)).toBeTruthy();
    expect(BIDS_PAGE_SIZE > 0).toBeTruthy();
    expect(BIDS_PAGE_SIZE).toBe(5);
  });
});

describe("bids pagination logic", () => {
  it("calculates total pages correctly for various bid counts", () => {
    expect(Math.ceil(0 / BIDS_PAGE_SIZE)).toBe(0);
    expect(Math.ceil(1 / BIDS_PAGE_SIZE)).toBe(1);
    expect(Math.ceil(5 / BIDS_PAGE_SIZE)).toBe(1);
    expect(Math.ceil(6 / BIDS_PAGE_SIZE)).toBe(2);
    expect(Math.ceil(12 / BIDS_PAGE_SIZE)).toBe(3);
  });

  it("correctly slices bids across multiple pages", () => {
    const dummyBids = Array.from({ length: 12 }, (_, i) => ({ id: i + 1 }));
    const totalPages = Math.ceil(dummyBids.length / BIDS_PAGE_SIZE);
    expect(totalPages).toBe(3);

    // Page 1 (items 1..5)
    const p1Start = (1 - 1) * BIDS_PAGE_SIZE;
    const p1 = dummyBids.slice(p1Start, p1Start + BIDS_PAGE_SIZE);
    expect(p1.length).toBe(5);
    expect(p1[0].id).toBe(1);
    expect(p1[4].id).toBe(5);

    // Page 2 (items 6..10)
    const p2Start = (2 - 1) * BIDS_PAGE_SIZE;
    const p2 = dummyBids.slice(p2Start, p2Start + BIDS_PAGE_SIZE);
    expect(p2.length).toBe(5);
    expect(p2[0].id).toBe(6);
    expect(p2[4].id).toBe(10);

    // Page 3 (items 11..12)
    const p3Start = (3 - 1) * BIDS_PAGE_SIZE;
    const p3 = dummyBids.slice(p3Start, p3Start + BIDS_PAGE_SIZE);
    expect(p3.length).toBe(2);
    expect(p3[0].id).toBe(11);
    expect(p3[1].id).toBe(12);
  });

  it("produces correct pagination items for bids pages", () => {
    // 1 page of bids -> returns single item [1]
    expect(getPageItems(1, 1)).toEqual([1]);

    // 3 pages of bids -> returns [1, 2, 3]
    expect(getPageItems(2, 3)).toEqual([1, 2, 3]);

    // Many pages of bids -> returns compact view with ellipsis
    expect(getPageItems(5, 10, 1)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
  });
});
