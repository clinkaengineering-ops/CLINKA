import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { serializeMediaUrls } from "./serializeMediaUrls";

class FakeDecimal {
  constructor(
    public s: number,
    public e: number,
    public d: number[],
    private value: number,
  ) {}

  toJSON() {
    return String(this.value);
  }

  toNumber() {
    return this.value;
  }
}

describe("serializeMediaUrls", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.UPLOAD_BASE_URL = "https://cdn.example.com";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("rewrites relative media paths and leaves remote URLs", () => {
    const result = serializeMediaUrls({
      avatarUrl: "/uploads/avatars/abc.png",
      coverImageUrl: "https://res.cloudinary.com/demo/image.png",
    });

    assert.equal(result.avatarUrl, "https://cdn.example.com/uploads/avatars/abc.png");
    assert.equal(result.coverImageUrl, "https://res.cloudinary.com/demo/image.png");
  });

  it("preserves Date instances so JSON output stays an ISO timestamp", () => {
    const createdAt = new Date("2026-08-29T21:19:35.111Z");
    const result = serializeMediaUrls({ createdAt, nested: { updatedAt: createdAt } });

    assert.equal(result.createdAt, createdAt);
    assert.equal(result.nested.updatedAt, createdAt);
    assert.equal(JSON.parse(JSON.stringify(result)).createdAt, createdAt.toISOString());
  });

  it("preserves Prisma Decimal-like objects so amounts serialize as numbers/strings", () => {
    const amount = new FakeDecimal(1, 1, [2500], 25);
    const result = serializeMediaUrls({ amount, payment: { commission: amount } });

    assert.equal(result.amount, amount);
    assert.equal(JSON.parse(JSON.stringify(result)).amount, "25");
  });

  it("does not rewrite non-upload url fields", () => {
    const result = serializeMediaUrls({
      url: "https://paymob.example/webhook",
      fileUrl: "/uploads/projects/file.pdf",
    });

    assert.equal(result.url, "https://paymob.example/webhook");
    assert.equal(result.fileUrl, "https://cdn.example.com/uploads/projects/file.pdf");
  });
});
