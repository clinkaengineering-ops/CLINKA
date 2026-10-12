import fs from "node:fs";
import path from "node:path";
import { resolveMediaUrl } from "./mediaUrl";

describe("resolveMediaUrl", () => {
  const originalEnv = { ...process.env };
  const originalLocation = window.location;

  afterEach(() => {
    process.env = { ...originalEnv };
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("prefixes relative server paths with the API origin in production", () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_API_URL = "https://api.clinkaeng.com/api";
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("https://app.clinkaeng.com"),
    });

    expect(resolveMediaUrl("/uploads/avatars/abc.png")).toBe(
      "https://api.clinkaeng.com/uploads/avatars/abc.png",
    );
  });

  it("does not double-prefix already public URLs", () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_API_URL = "https://api.clinkaeng.com/api";
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("https://app.clinkaeng.com"),
    });

    expect(
      resolveMediaUrl("https://api.clinkaeng.com/uploads/avatars/abc.png"),
    ).toBe("https://api.clinkaeng.com/uploads/avatars/abc.png");
    expect(
      resolveMediaUrl("https://res.cloudinary.com/demo/image.png"),
    ).toBe("https://res.cloudinary.com/demo/image.png");
  });

  it("uses the local backend origin during development", () => {
    process.env.NODE_ENV = "development";
    process.env.BACKEND_URL = "http://127.0.0.1:5000";
    delete process.env.NEXT_PUBLIC_API_URL;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("http://localhost:3000"),
    });

    expect(resolveMediaUrl("/uploads/projects/file.pdf")).toBe(
      "http://127.0.0.1:5000/uploads/projects/file.pdf",
    );
  });

  it("keeps the same prefix rules as mediaUrl.ts", () => {
    const filePath = path.resolve(__dirname, "./mediaUrl.ts");
    const source = fs.readFileSync(filePath, "utf8");
    expect(source).toMatch(/url\.startsWith\("\/uploads\/"\)/);
    expect(source).toMatch(/resolveBackendOrigin\(\)/);
    expect(source).toMatch(/\$\{base\}\$\{url\}/);
  });
});
