import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  createCloudinaryUpload,
  deleteUploadFile,
  getStoredUploadPath,
  getUploadBaseUrl,
  isAllowedUpload,
  normalizeMimeType,
  normalizeStoredUploadPath,
  normalizeUploadOrigin,
  resolvePublicUploadUrl,
  resolveStoredExtension,
  storedPathToAbsolute,
} from "../config/upload";
import cloudinary from "./cloudinary";

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

  it("normalizes MIME types by stripping parameters, trimming, and lowercasing", () => {
    expect(normalizeMimeType("audio/webm;codecs=opus")).toBe("audio/webm");
    expect(normalizeMimeType("audio/webm; codecs=opus; bitrate=128")).toBe("audio/webm");
    expect(normalizeMimeType(" AUDIO/MP4; codecs=\"mp4a.40.2\" ")).toBe("audio/mp4");
    expect(normalizeMimeType("audio/ogg;codecs=opus")).toBe("audio/ogg");
    expect(normalizeMimeType("audio/mpeg")).toBe("audio/mpeg");
    expect(normalizeMimeType("")).toBe("");
    expect(normalizeMimeType(undefined)).toBe("");
    expect(normalizeMimeType(null)).toBe("");
  });

  it("generates safe extensions from mime type including audio formats", () => {
    expect(resolveStoredExtension("image/jpeg", "evil.exe")).toBe(".jpg");
    expect(resolveStoredExtension("application/pdf", "report.PDF")).toBe(".pdf");
    expect(resolveStoredExtension("audio/webm;codecs=opus", "voice.webm")).toBe(".webm");
    expect(resolveStoredExtension("audio/mp4", "voice.m4a")).toBe(".m4a");
    expect(resolveStoredExtension("audio/mp4", "voice.mp4")).toBe(".mp4");
    expect(resolveStoredExtension("video/mp4", "video.mp4")).toBe(".mp4");
    expect(resolveStoredExtension("audio/ogg", "voice.ogg")).toBe(".ogg");
    expect(resolveStoredExtension("audio/mpeg", "voice.mp3")).toBe(".mp3");
  });

  it("validates mime type and extension together", () => {
    expect(isAllowedUpload("image/png", "photo.png", IMAGE_MIME_TYPES)).toBe(true);
    expect(isAllowedUpload("image/png", "photo.exe", IMAGE_MIME_TYPES)).toBe(false);
    expect(isAllowedUpload("application/pdf", "photo.png", IMAGE_MIME_TYPES)).toBe(false);
    expect(
      isAllowedUpload(
        "audio/webm;codecs=opus",
        "voice.webm",
        new Set(["audio/webm"]),
      ),
    ).toBe(true);
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

  it("createCloudinaryUpload generates public_id with correct extensions for compressed and uncompressed files", async () => {
    const storage = createCloudinaryUpload("documents") as any;
    expect(typeof storage.params).toBe("function");

    const testFiles = [
      { mimetype: "application/zip", originalname: "archive.zip", expectedExt: ".zip" },
      { mimetype: "application/x-rar-compressed", originalname: "archive.rar", expectedExt: ".rar" },
      { mimetype: "application/x-7z-compressed", originalname: "project.7z", expectedExt: ".7z" },
      { mimetype: "application/octet-stream", originalname: "model.rvt", expectedExt: ".rvt" },
      { mimetype: "application/octet-stream", originalname: "drawing.dwg", expectedExt: ".dwg" },
      { mimetype: "application/pdf", originalname: "spec.pdf", expectedExt: ".pdf" },
      { mimetype: "image/png", originalname: "photo.png", expectedExt: ".png" },
    ];

    for (const tf of testFiles) {
      const res = await storage.params({}, { mimetype: tf.mimetype, originalname: tf.originalname });
      expect(res.folder).toBe("documents");
      expect(res.resource_type).toBe("auto");
      expect(res.public_id).toMatch(new RegExp(`^[0-9a-f]{16}\\${tf.expectedExt}$`));
    }
  });

  it("deleteUploadFile handles Cloudinary raw URLs preserving extension and image URLs stripping extension", async () => {
    const destroySpy = jest.spyOn(cloudinary.uploader, "destroy").mockResolvedValue({ result: "ok" } as any);

    // Raw archive URL
    await deleteUploadFile("https://res.cloudinary.com/bkv1llhu/raw/upload/v1792344372/documents/abc12345.zip");
    expect(destroySpy).toHaveBeenCalledWith("documents/abc12345.zip", {
      resource_type: "raw",
      invalidate: true,
    });

    // Image URL - extension should be stripped for Cloudinary public_id
    await deleteUploadFile("https://res.cloudinary.com/bkv1llhu/image/upload/v1792322447/images/profile_avatar.jpg");
    expect(destroySpy).toHaveBeenCalledWith("images/profile_avatar", {
      resource_type: "image",
      invalidate: true,
    });

    // Audio / Video URL - Cloudinary stores audio under resource_type "video" and public_id includes the extension
    await deleteUploadFile("https://res.cloudinary.com/bkv1llhu/video/upload/v1792344372/documents/abc12345.webm");
    expect(destroySpy).toHaveBeenCalledWith("documents/abc12345.webm", {
      resource_type: "video",
      invalidate: true,
    });

    destroySpy.mockRestore();
  });
});
