import {
  collectUploadImagePatterns,
  remotePatternFromUrl,
} from "./imageRemotePatterns";

describe("next/image upload hosts", () => {
  it("allows the production API host from NEXT_PUBLIC_API_URL", () => {
    const patterns = collectUploadImagePatterns({
      backendOrigin: "http://127.0.0.1:5000",
      nextPublicApiUrl: "https://api.clinkaeng.com/api",
    });

    expect(
      patterns.find((pattern) => pattern.hostname === "api.clinkaeng.com"),
    ).toEqual({ protocol: "https", hostname: "api.clinkaeng.com" });
  });

  it("parses upload origins even when they include /uploads", () => {
    expect(remotePatternFromUrl("https://api.clinkaeng.com/uploads")).toEqual({
      protocol: "https",
      hostname: "api.clinkaeng.com",
    });
  });
});
