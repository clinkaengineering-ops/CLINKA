import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  deleteUploadFile,
  getStoredUploadPath,
  getUploadBaseUrl,
  isAllowedUpload,
  normalizeStoredUploadPath,
  normalizeUploadOrigin,
  resolvePublicUploadUrl,
  resolveStoredExtension,
  storedPathToAbsolute,
} from "../config/upload";

const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

describe("upload config", () => {
  const originalEnv = { ...process.env };
  let tempUploadDir = "";

  beforeEach(() => {
    tempUploadDir = fs.mkdtempSync(path.join(os.tmpdir(), "clinka-uploads-"));
    process.env.UPLOAD_DIR = tempUploadDir;
    delete process.env.UPLOAD_BASE_URL;
    delete process.env.API_URL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    fs.rmSync(tempUploadDir, { recursive: true, force: true });
  });

  it("generates safe extensions from mime type", () => {
    expect(resolveStoredExtension("image/jpeg", "evil.exe")).toBe(".jpg");
    expect(resolveStoredExtension("application/pdf", "report.PDF")).toBe(".pdf");
  });

  it("validates mime type and extension together", () => {
    expect(isAllowedUpload("image/png", "photo.png", IMAGE_MIME_TYPES)).toBe(true);
    expect(isAllowedUpload("image/png", "photo.exe", IMAGE_MIME_TYPES)).toBe(false);
    expect(isAllowedUpload("application/pdf", "photo.png", IMAGE_MIME_TYPES)).toBe(false);
  });

  it("normalizes stored upload paths", () => {
    expect(normalizeStoredUploadPath("uploads/images/file.png")).toBe(
      "/uploads/images/file.png",
    );
    expect(
      normalizeStoredUploadPath("https://res.cloudinary.com/demo/image.png"),
    ).toBe("https://res.cloudinary.com/demo/image.png");
  });

  it("blocks path traversal when resolving absolute paths", () => {
    const storedPath = "/uploads/images/../../secret.txt";
    expect(storedPathToAbsolute(storedPath)).toBeNull();
  });

  it("resolves public URLs from stored paths", () => {
    process.env.UPLOAD_BASE_URL = "https://cdn.example.com";
    expect(resolvePublicUploadUrl("/uploads/images/abc.png")).toBe(
      "https://cdn.example.com/uploads/images/abc.png",
    );
    expect(
      resolvePublicUploadUrl("https://res.cloudinary.com/demo/image.png"),
    ).toBe("https://res.cloudinary.com/demo/image.png");
  });

  it("derives upload base URL from API_URL without duplicating /uploads", () => {
    process.env.API_URL = "https://api.example.com/";
    expect(getUploadBaseUrl()).toBe("https://api.example.com");
    expect(resolvePublicUploadUrl("/uploads/avatars/user.png")).toBe(
      "https://api.example.com/uploads/avatars/user.png",
    );
  });

  it("strips a trailing /uploads from UPLOAD_BASE_URL to avoid doubled paths", () => {
    process.env.UPLOAD_BASE_URL = "https://api.example.com/uploads/";
    expect(normalizeUploadOrigin(process.env.UPLOAD_BASE_URL)).toBe("https://api.example.com");
    expect(getUploadBaseUrl()).toBe("https://api.example.com");
    expect(resolvePublicUploadUrl("/uploads/avatars/user.png")).toBe(
      "https://api.example.com/uploads/avatars/user.png",
    );
  });

  it("builds category-based stored paths", () => {
    const file = {
      path: path.join(tempUploadDir, "avatars", "abc.png"),
      filename: "abc.png",
    } as Express.Multer.File;

    expect(getStoredUploadPath(file, "avatars")).toBe(
      "/uploads/avatars/abc.png",
    );
  });

  it("deletes local files and ignores missing or remote paths", () => {
    const filePath = path.join(tempUploadDir, "images", "delete-me.png");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "test");

    deleteUploadFile("/uploads/images/delete-me.png");
    expect(fs.existsSync(filePath)).toBe(false);

    deleteUploadFile("/uploads/images/missing.png");
    deleteUploadFile("https://res.cloudinary.com/demo/image.png");
  });
});
