import assert from "node:assert/strict";
import fs from "node:fs";
import { afterEach, describe, it } from "node:test";

import { resolveBackendOrigin } from "./apiBaseUrl.ts";

/** Mirrors `resolveMediaUrl` so this file can run under Node without Next's extensionless imports. */
function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/uploads/")) {
    return `${resolveBackendOrigin()}${url}`;
  }
  return url;
}

describe("resolveMediaUrl", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("prefixes relative server paths with the API origin in production", () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_API_URL = "https://api.clinkaeng.com/api";

    assert.equal(
      resolveMediaUrl("/uploads/avatars/abc.png"),
      "https://api.clinkaeng.com/uploads/avatars/abc.png",
    );
  });

  it("does not double-prefix already public URLs", () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_API_URL = "https://api.clinkaeng.com/api";

    assert.equal(
      resolveMediaUrl("https://api.clinkaeng.com/uploads/avatars/abc.png"),
      "https://api.clinkaeng.com/uploads/avatars/abc.png",
    );
    assert.equal(
      resolveMediaUrl("https://res.cloudinary.com/demo/image.png"),
      "https://res.cloudinary.com/demo/image.png",
    );
  });

  it("uses the local backend origin during development", () => {
    process.env.NODE_ENV = "development";
    process.env.BACKEND_URL = "http://127.0.0.1:5000";
    delete process.env.NEXT_PUBLIC_API_URL;

    assert.equal(
      resolveMediaUrl("/uploads/projects/file.pdf"),
      "http://127.0.0.1:5000/uploads/projects/file.pdf",
    );
  });

  it("keeps the same prefix rules as mediaUrl.ts", () => {
    const source = fs.readFileSync(new URL("./mediaUrl.ts", import.meta.url), "utf8");
    assert.match(source, /url\.startsWith\("\/uploads\/"\)/);
    assert.match(source, /\$\{resolveBackendOrigin\(\)\}\$\{url\}/);
  });
});
