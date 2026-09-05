import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";

import express from "express";
import helmet from "helmet";

import { isAllowedOrigin } from "./cors";
import {
  createUploadMiddleware,
  ensureUploadRoot,
  getStoredUploadPath,
  getUploadRoot,
} from "./upload";
import { errorHandler } from "../middlewares/errorHandler.middleware";

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function listen(
  app: express.Express,
): Promise<{ server: http.Server; origin: string }> {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address() as AddressInfo;
  return { server, origin: `http://127.0.0.1:${port}` };
}

function createUploadApp() {
  const app = express();
  const uploadDir = getUploadRoot();
  const imageUpload = createUploadMiddleware("images", {
    allowedMimeTypes: new Set(["image/jpeg", "image/png", "image/webp"]),
    maxFileSize: 1024,
  });
  const documentUpload = createUploadMiddleware("documents", {
    allowedMimeTypes: new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ]),
    maxFileSize: 1024,
  });

  app.use("/uploads", express.static(uploadDir, {
    setHeaders: (res, filePath) => {
      const origin = res.req.headers.origin;
      if (origin && isAllowedOrigin(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
      }
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

      const normalized = filePath.replace(/\\/g, "/");
      if (normalized.includes("/documents/")) {
        res.setHeader("Cache-Control", "private, no-store");
        return;
      }
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  }));

  app.use(helmet());

  app.post("/upload/image", imageUpload.single("file"), (req, res) => {
    res.status(201).json({ path: getStoredUploadPath(req.file, "images") });
  });

  app.post("/upload/document", documentUpload.single("file"), (req, res) => {
    res.status(201).json({ path: getStoredUploadPath(req.file, "documents") });
  });

  app.use(errorHandler);
  return app;
}

async function postFile(
  origin: string,
  route: string,
  filename: string,
  contentType: string,
  body: Buffer,
): Promise<Response> {
  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(body)], { type: contentType }),
    filename,
  );
  return fetch(`${origin}${route}`, { method: "POST", body: form });
}

describe("local upload HTTP flow", () => {
  const originalEnv = { ...process.env };
  let tempUploadDir = "";
  let server: http.Server;
  let origin = "";

  before(async () => {
    tempUploadDir = fs.mkdtempSync(path.join(os.tmpdir(), "clinka-upload-http-"));
    process.env.UPLOAD_DIR = tempUploadDir;
    process.env.CLIENT_URL = "https://clinkaeng.com";
    delete process.env.UPLOAD_BASE_URL;
    ensureUploadRoot();
    ({ server, origin } = await listen(createUploadApp()));
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    process.env = { ...originalEnv };
    fs.rmSync(tempUploadDir, { recursive: true, force: true });
  });

  it("stores an image on disk and serves it from /uploads", async () => {
    const uploaded = await postFile(
      origin,
      "/upload/image",
      "avatar.png",
      "image/png",
      PNG_1X1,
    );
    assert.equal(uploaded.status, 201);
    const payload = (await uploaded.json()) as { path: string };
    assert.match(payload.path, /^\/uploads\/images\/[0-9a-f-]+\.png$/i);

    const absolute = path.join(tempUploadDir, payload.path.replace("/uploads/", ""));
    assert.equal(fs.existsSync(absolute), true);
    assert.deepEqual(fs.readFileSync(absolute), PNG_1X1);

    const served = await fetch(`${origin}${payload.path}`, {
      headers: { Origin: "https://clinkaeng.com" },
    });
    assert.equal(served.status, 200);
    assert.equal(served.headers.get("cross-origin-resource-policy"), "cross-origin");
    assert.equal(served.headers.get("access-control-allow-origin"), "https://clinkaeng.com");
    assert.match(served.headers.get("cache-control") ?? "", /immutable/);
    assert.deepEqual(Buffer.from(await served.arrayBuffer()), PNG_1X1);
  });

  it("keeps verification documents uncached", async () => {
    const uploaded = await postFile(
      origin,
      "/upload/document",
      "id.png",
      "image/png",
      PNG_1X1,
    );
    const payload = (await uploaded.json()) as { path: string };
    const served = await fetch(`${origin}${payload.path}`);
    assert.equal(served.status, 200);
    assert.equal(served.headers.get("cache-control"), "private, no-store");
  });

  it("rejects executable disguises and oversized files", async () => {
    const blocked = await postFile(
      origin,
      "/upload/image",
      "payload.php",
      "image/png",
      PNG_1X1,
    );
    assert.equal(blocked.status, 400);
    const blockedBody = (await blocked.json()) as { message: string };
    assert.match(blockedBody.message, /not allowed/i);

    const oversized = await postFile(
      origin,
      "/upload/image",
      "huge.png",
      "image/png",
      Buffer.alloc(2048, 1),
    );
    assert.equal(oversized.status, 400);
    const oversizedBody = (await oversized.json()) as { message: string };
    assert.match(oversizedBody.message, /too large/i);
  });

  it("does not serve files outside the upload root", async () => {
    const leaked = await fetch(`${origin}/uploads/images/../../package.json`);
    assert.notEqual(leaked.status, 200);
  });
});
