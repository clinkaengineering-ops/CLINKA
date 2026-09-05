import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  collectUploadImagePatterns,
  remotePatternFromUrl,
} from "./imageRemotePatterns.ts";

describe("next/image upload hosts", () => {
  it("allows the production API host from NEXT_PUBLIC_API_URL", () => {
    const patterns = collectUploadImagePatterns({
      backendOrigin: "http://127.0.0.1:5000",
      nextPublicApiUrl: "https://api.clinkaeng.com/api",
    });

    assert.deepEqual(
      patterns.find((pattern) => pattern.hostname === "api.clinkaeng.com"),
      { protocol: "https", hostname: "api.clinkaeng.com" },
    );
  });

  it("parses upload origins even when they include /uploads", () => {
    assert.deepEqual(remotePatternFromUrl("https://api.clinkaeng.com/uploads"), {
      protocol: "https",
      hostname: "api.clinkaeng.com",
    });
  });
});
