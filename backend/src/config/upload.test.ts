import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

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
    assert.equal(
      resolveStoredExtension("image/jpeg", "evil.exe"),
      ".jpg",
    );
    assert.equal(
      resolveStoredExtension("application/pdf", "report.PDF"),
      ".pdf",
    );
  });

  it("validates mime type and extension together", () => {
    assert.equal(
      isAllowedUpload("image/png", "photo.png", IMAGE_MIME_TYPES),
      true,
    );
    assert.equal(
      isAllowedUpload("image/png", "photo.exe", IMAGE_MIME_TYPES),
      false,
    );
    assert.equal(
      isAllowedUpload("application/pdf", "photo.png", IMAGE_MIME_TYPES),
      false,
    );
  });

  it("normalizes stored upload paths", () => {
    assert.equal(
      normalizeStoredUploadPath("uploads/images/file.png"),
      "/uploads/images/file.png",
    );
    assert.equal(
      normalizeStoredUploadPath("https://res.cloudinary.com/demo/image.png"),
      "https://res.cloudinary.com/demo/image.png",
    );
  });

  it("blocks path traversal when resolving absolute paths", () => {
    const storedPath = "/uploads/images/../../secret.txt";
    assert.equal(storedPathToAbsolute(storedPath), null);
  });

  it("resolves public URLs from stored paths", () => {
    process.env.UPLOAD_BASE_URL = "https://cdn.example.com";
    assert.equal(
      resolvePublicUploadUrl("/uploads/images/abc.png"),
      "https://cdn.example.com/uploads/images/abc.png",
    );
    assert.equal(
      resolvePublicUploadUrl("https://res.cloudinary.com/demo/image.png"),
      "https://res.cloudinary.com/demo/image.png",
    );
  });

  it("derives upload base URL from API_URL without duplicating /uploads", () => {
    process.env.API_URL = "https://api.example.com/";
    assert.equal(getUploadBaseUrl(), "https://api.example.com");
    assert.equal(
      resolvePublicUploadUrl("/uploads/avatars/user.png"),
      "https://api.example.com/uploads/avatars/user.png",
    );
  });

  it("strips a trailing /uploads from UPLOAD_BASE_URL to avoid doubled paths", () => {
    process.env.UPLOAD_BASE_URL = "https://api.example.com/uploads/";
    assert.equal(normalizeUploadOrigin(process.env.UPLOAD_BASE_URL), "https://api.example.com");
    assert.equal(getUploadBaseUrl(), "https://api.example.com");
    assert.equal(
      resolvePublicUploadUrl("/uploads/avatars/user.png"),
      "https://api.example.com/uploads/avatars/user.png",
    );
  });

  it("builds category-based stored paths", () => {
    const file = {
      path: path.join(tempUploadDir, "avatars", "abc.png"),
      filename: "abc.png",
    } as Express.Multer.File;

    assert.equal(
      getStoredUploadPath(file, "avatars"),
      "/uploads/avatars/abc.png",
    );
  });

  it("deletes local files and ignores missing or remote paths", () => {
    const filePath = path.join(tempUploadDir, "images", "delete-me.png");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "test");

    deleteUploadFile("/uploads/images/delete-me.png");
    assert.equal(fs.existsSync(filePath), false);

    deleteUploadFile("/uploads/images/missing.png");
    deleteUploadFile("https://res.cloudinary.com/demo/image.png");
  });
});
