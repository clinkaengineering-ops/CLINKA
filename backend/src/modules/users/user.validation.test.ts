import { searchQuerySchema } from "./user.validation";

describe("searchQuerySchema pagination", () => {
  it("defaults to page 1 and limit 20", () => {
    const parsed = searchQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
    expect(parsed.sortBy).toBe("RELEVANCE");
  });

  it("coerces page and limit from query strings", () => {
    const parsed = searchQuerySchema.parse({ page: "3", limit: "12" });
    expect(parsed.page).toBe(3);
    expect(parsed.limit).toBe(12);
  });

  it("rejects page numbers below 1", () => {
    expect(() => searchQuerySchema.parse({ page: 0 })).toThrow();
    expect(() => searchQuerySchema.parse({ page: -2 })).toThrow();
  });

  it("rejects limits outside 1–100", () => {
    expect(() => searchQuerySchema.parse({ limit: 0 })).toThrow();
    expect(() => searchQuerySchema.parse({ limit: 101 })).toThrow();
  });
});
