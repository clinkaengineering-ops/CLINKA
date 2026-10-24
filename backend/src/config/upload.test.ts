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
      type: "upload",
      invalidate: true,
    });

    // Image URL - extension should be stripped for Cloudinary public_id
    await deleteUploadFile("https://res.cloudinary.com/bkv1llhu/image/upload/v1792322447/images/profile_avatar.jpg");
    expect(destroySpy).toHaveBeenCalledWith("images/profile_avatar", {
      resource_type: "image",
      type: "upload",
      invalidate: true,
    });

    // Audio / Video URL - Cloudinary stores audio under resource_type "video" and public_id includes the extension
    await deleteUploadFile("https://res.cloudinary.com/bkv1llhu/video/upload/v1792344372/documents/abc12345.webm");
    expect(destroySpy).toHaveBeenCalledWith("documents/abc12345.webm", {
      resource_type: "video",
      type: "upload",
      invalidate: true,
    });

    // Authenticated delivery URL
    await deleteUploadFile("https://res.cloudinary.com/bkv1llhu/raw/authenticated/v1792344372/projects/confidential.dwg");
    expect(destroySpy).toHaveBeenCalledWith("projects/confidential.dwg", {
      resource_type: "raw",
      type: "authenticated",
      invalidate: true,
    });

    destroySpy.mockRestore();
  });

  it("createCloudinaryUpload marks sensitive categories as authenticated and public categories as upload", async () => {
    const docStorage = createCloudinaryUpload("documents") as any;
    const projStorage = createCloudinaryUpload("projects") as any;
    const imgStorage = createCloudinaryUpload("images") as any;
    const avatarStorage = createCloudinaryUpload("avatars") as any;

    const docParams = await docStorage.params({}, { mimetype: "application/pdf", originalname: "receipt.pdf" });
    const projParams = await projStorage.params({}, { mimetype: "application/zip", originalname: "deliverable.zip" });
    const imgParams = await imgStorage.params({}, { mimetype: "image/png", originalname: "logo.png" });
    const avatarParams = await avatarStorage.params({}, { mimetype: "image/jpeg", originalname: "avatar.jpg" });

    expect(docParams.type).toBe("authenticated");
    expect(projParams.type).toBe("authenticated");
    expect(imgParams.type).toBe("upload");
    expect(avatarParams.type).toBe("upload");
  });

  it("isTrustedUpstreamHost accepts authentic Cloudinary delivery hosts and strictly blocks deceptive, credentialed, or internal hosts", () => {
    const { isTrustedUpstreamHost } = require("./upload");

    // Valid authentic Cloudinary HTTPS delivery hosts
    expect(isTrustedUpstreamHost("https://res.cloudinary.com/demo/image/authenticated/sample.jpg")).toBe(true);
    expect(isTrustedUpstreamHost("https://res-1.cloudinary.com/demo/raw/authenticated/doc.pdf")).toBe(true);
    expect(isTrustedUpstreamHost("https://res-5.cloudinary.com/demo/raw/authenticated/v1/projects/file.dwg")).toBe(true);

    // Arbitrary unverified Cloudinary subdomains are strictly blocked
    expect(isTrustedUpstreamHost("https://subdomain.res.cloudinary.com/raw/authenticated/doc.pdf")).toBe(false);
    expect(isTrustedUpstreamHost("https://my-app.cloudinary.com/raw/authenticated/v1/projects/file.dwg")).toBe(false);
    expect(isTrustedUpstreamHost("https://api.cloudinary.com/v1_1/demo/image/upload")).toBe(false);

    // Deceptive domain attacks
    expect(isTrustedUpstreamHost("https://attacker-cloudinary.com/evil.pdf")).toBe(false);
    expect(isTrustedUpstreamHost("https://res.cloudinary.com.attacker.com/evil.pdf")).toBe(false);
    expect(isTrustedUpstreamHost("https://cloudinary.com.evil.com/evil.pdf")).toBe(false);
    expect(isTrustedUpstreamHost("https://notcloudinary.com/evil.pdf")).toBe(false);

    // Credentials in URL must be rejected
    expect(isTrustedUpstreamHost("https://admin:pass@res.cloudinary.com/demo/image.jpg")).toBe(false);
    expect(isTrustedUpstreamHost("https://user@res.cloudinary.com/demo/image.jpg")).toBe(false);

    // Non-standard ports must be rejected
    expect(isTrustedUpstreamHost("https://res.cloudinary.com:8443/demo/image.jpg")).toBe(false);
    expect(isTrustedUpstreamHost("https://res.cloudinary.com:80/demo/image.jpg")).toBe(false);

    // Protocol check (must be HTTPS)
    expect(isTrustedUpstreamHost("http://res.cloudinary.com/demo/image/upload/sample.jpg")).toBe(false);

    // SSRF / internal network vectors
    expect(isTrustedUpstreamHost("http://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isTrustedUpstreamHost("https://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isTrustedUpstreamHost("http://localhost:3000/internal")).toBe(false);
    expect(isTrustedUpstreamHost("https://localhost:3000/internal")).toBe(false);
    expect(isTrustedUpstreamHost("http://127.0.0.1:5432")).toBe(false);
    expect(isTrustedUpstreamHost("https://127.0.0.1:5432")).toBe(false);

    // Malformed URLs
    expect(isTrustedUpstreamHost("javascript:alert(1)")).toBe(false);
    expect(isTrustedUpstreamHost("data:text/plain;base64,SGVsbG8=")).toBe(false);
    expect(isTrustedUpstreamHost("not-a-valid-url")).toBe(false);
    expect(isTrustedUpstreamHost("")).toBe(false);
  });

  it("isTrustedUpstreamHost evaluates custom upload-base URL safely without authorizing unintended hosts", () => {
    const { isTrustedUpstreamHost } = require("./upload");

    // Explicitly configured dedicated external CDN base URL
    process.env.UPLOAD_BASE_URL = "https://cdn.clinkaeng.com";
    process.env.API_URL = "https://api.clinkaeng.com";
    expect(isTrustedUpstreamHost("https://cdn.clinkaeng.com/uploads/photo.jpg")).toBe(true);

    // Untrusted custom base URL pointing to the backend API itself is rejected
    process.env.UPLOAD_BASE_URL = "https://api.clinkaeng.com";
    expect(isTrustedUpstreamHost("https://api.clinkaeng.com/uploads/photo.jpg")).toBe(false);

    // Custom base URL with private IP or loopback is rejected
    process.env.UPLOAD_BASE_URL = "https://127.0.0.1:443";
    expect(isTrustedUpstreamHost("https://127.0.0.1/uploads/photo.jpg")).toBe(false);

    process.env.UPLOAD_BASE_URL = "https://localhost";
    expect(isTrustedUpstreamHost("https://localhost/uploads/photo.jpg")).toBe(false);

    // Request with credentials targeting custom base URL is rejected
    process.env.UPLOAD_BASE_URL = "https://cdn.clinkaeng.com";
    expect(isTrustedUpstreamHost("https://admin:pass@cdn.clinkaeng.com/uploads/photo.jpg")).toBe(false);

    // Request with non-standard port targeting custom base URL is rejected
    expect(isTrustedUpstreamHost("https://cdn.clinkaeng.com:8080/uploads/photo.jpg")).toBe(false);
  });

  describe("getAuthenticatedCloudinaryDownloadUrl", () => {
    beforeEach(() => {
      cloudinary.config({
        cloud_name: "bkv1llhu",
        api_key: "792594964666692",
        api_secret: "mock-secret-key-12345",
        secure: true,
      });
    });

    it("generates correct signed URL for authenticated image, raw, and video assets", () => {
      const { getAuthenticatedCloudinaryDownloadUrl } = require("./upload");

      // Authenticated image (payment proof receipt)
      const imageUrl = "https://res.cloudinary.com/bkv1llhu/image/authenticated/v1792344372/documents/proof.jpg";
      const signedImage = getAuthenticatedCloudinaryDownloadUrl(imageUrl);
      expect(signedImage).toContain("res.cloudinary.com/bkv1llhu/image/authenticated/");
      expect(signedImage).toContain("/s--");
      expect(signedImage).toContain("/v1792344372/documents/proof.jpg");

      // Authenticated raw file (CAD/BIM project deliverable)
      const rawUrl = "https://res.cloudinary.com/bkv1llhu/raw/authenticated/v1792344372/projects/plans.dwg";
      const signedRaw = getAuthenticatedCloudinaryDownloadUrl(rawUrl);
      expect(signedRaw).toContain("res.cloudinary.com/bkv1llhu/raw/authenticated/");
      expect(signedRaw).toContain("/s--");
      expect(signedRaw).toContain("/v1792344372/projects/plans.dwg");

      // Authenticated video/audio file (voice note)
      const videoUrl = "https://res.cloudinary.com/bkv1llhu/video/authenticated/v1792344372/documents/audio.webm";
      const signedVideo = getAuthenticatedCloudinaryDownloadUrl(videoUrl);
      expect(signedVideo).toContain("res.cloudinary.com/bkv1llhu/video/authenticated/");
      expect(signedVideo).toContain("/s--");
      expect(signedVideo).toContain("/v1792344372/documents/audio.webm");

      // Authenticated URL without version segment
      const noVersionUrl = "https://res.cloudinary.com/bkv1llhu/raw/authenticated/projects/spec.pdf";
      const signedNoVersion = getAuthenticatedCloudinaryDownloadUrl(noVersionUrl);
      expect(signedNoVersion).toContain("res.cloudinary.com/bkv1llhu/raw/authenticated/");
      expect(signedNoVersion).toContain("/s--");
      expect(signedNoVersion).toContain("projects/spec.pdf");
    });

    it("explicitly distinguishes upload vs authenticated and rejects public upload delivery types", () => {
      const { getAuthenticatedCloudinaryDownloadUrl } = require("./upload");

      const publicUploadUrl = "https://res.cloudinary.com/bkv1llhu/raw/upload/v1792344372/documents/proof.pdf";
      expect(() => getAuthenticatedCloudinaryDownloadUrl(publicUploadUrl)).toThrow(
        /Asset has public delivery type \('upload'\)/i,
      );
    });

    it("rejects unexpected transformations and unexpected signature segments", () => {
      const { getAuthenticatedCloudinaryDownloadUrl } = require("./upload");

      // Transformation segment before version
      const transformedUrl = "https://res.cloudinary.com/bkv1llhu/image/authenticated/w_500,c_scale/v1/documents/proof.jpg";
      expect(() => getAuthenticatedCloudinaryDownloadUrl(transformedUrl)).toThrow(
        /unexpected transformation segment/i,
      );

      // Transformation segment without version
      const transformedNoVerUrl = "https://res.cloudinary.com/bkv1llhu/image/authenticated/c_limit,w_800/documents/proof.jpg";
      expect(() => getAuthenticatedCloudinaryDownloadUrl(transformedNoVerUrl)).toThrow(
        /unexpected transformation segment/i,
      );

      // Pre-existing signature segment
      const signedStoredUrl = "https://res.cloudinary.com/bkv1llhu/image/authenticated/s--dummy--/v1/documents/proof.jpg";
      expect(() => getAuthenticatedCloudinaryDownloadUrl(signedStoredUrl)).toThrow(
        /unexpected signature segment/i,
      );
    });

    it("rejects mismatched cloud names and untrusted hosts without returning original URL", () => {
      const { getAuthenticatedCloudinaryDownloadUrl } = require("./upload");

      // Mismatched cloud name
      const wrongCloudUrl = "https://res.cloudinary.com/attacker-cloud/image/authenticated/v1/documents/proof.jpg";
      expect(() => getAuthenticatedCloudinaryDownloadUrl(wrongCloudUrl)).toThrow(
        /cloud name in URL does not match configured cloud name/i,
      );

      // Deceptive host
      const deceptiveUrl = "https://res.cloudinary.com.attacker.com/bkv1llhu/raw/authenticated/v1/documents/proof.pdf";
      expect(() => getAuthenticatedCloudinaryDownloadUrl(deceptiveUrl)).toThrow(
        /untrusted or invalid upstream storage URL host/i,
      );

      // Credentials in URL
      const credsUrl = "https://user:pass@res.cloudinary.com/bkv1llhu/raw/authenticated/v1/documents/proof.pdf";
      expect(() => getAuthenticatedCloudinaryDownloadUrl(credsUrl)).toThrow(
        /untrusted or invalid upstream storage URL host/i,
      );

      // Non-standard port
      const portUrl = "https://res.cloudinary.com:8443/bkv1llhu/raw/authenticated/v1/documents/proof.pdf";
      expect(() => getAuthenticatedCloudinaryDownloadUrl(portUrl)).toThrow(
        /untrusted or invalid upstream storage URL host/i,
      );
    });

    it("throws controlled error on empty, malformed, or missing inputs", () => {
      const { getAuthenticatedCloudinaryDownloadUrl } = require("./upload");

      expect(() => getAuthenticatedCloudinaryDownloadUrl("")).toThrow(/missing or invalid storage URL/i);
      expect(() => getAuthenticatedCloudinaryDownloadUrl(null as any)).toThrow(/missing or invalid storage URL/i);
      expect(() => getAuthenticatedCloudinaryDownloadUrl(undefined as any)).toThrow(/missing or invalid storage URL/i);
      expect(() => getAuthenticatedCloudinaryDownloadUrl("https://res.cloudinary.com/bkv1llhu")).toThrow(
        /insufficient path segments/i,
      );
    });
  });
});
