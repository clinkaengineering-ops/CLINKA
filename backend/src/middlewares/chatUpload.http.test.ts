import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { AddressInfo } from "node:net";
import express from "express";
import { MulterError } from "multer";

jest.mock("multer-storage-cloudinary", () => {
  const multer = require("multer");
  const crypto = require("crypto");
  const p = require("path");
  const f = require("fs");

  return {
    CloudinaryStorage: jest.fn().mockImplementation((options: any) => {
      const folder = options?.params?.folder || "documents";
      return multer.diskStorage({
        destination: (_req: any, _file: any, cb: any) => {
          const dir = p.join(process.env.UPLOAD_DIR || "/tmp", folder);
          f.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req: any, file: any, cb: any) => {
          const ext = p.extname(file.originalname).toLowerCase() || ".bin";
          cb(null, `${crypto.randomUUID()}${ext}`);
        },
      });
    }),
  };
});

jest.mock("../config/cloudinary", () => ({
  __esModule: true,
  default: {
    uploader: {
      destroy: jest.fn().mockResolvedValue({ result: "ok" }),
    },
    config: jest.fn(),
  },
}));

import chatUpload from "./chatUpload.middleware";
import ApiError from "../utils/ApiError";
import { errorHandler } from "./errorHandler.middleware";
import { getStoredUploadPath, ensureUploadRoot } from "../config/upload";

// Magic header bytes for realistic test files
const ZIP_HEADER = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00]);
const RAR_HEADER = Buffer.from([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x00]);
const SEVENZ_HEADER = Buffer.from([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]);
const RVT_SAMPLE = Buffer.from("DUMMY_REVIT_OLE_STRUCTURED_STORAGE_PROJECT_DATA");
const DWG_SAMPLE = Buffer.from("AC1032_AUTOCAD_DRAWING_BINARY_DATA");

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

function createChatApp() {
  const app = express();

  app.post("/api/messages/conversations/:id", (req, res, next) => {
    chatUpload.single("file")(req, res, (err) => {
      if (err) {
        if (err instanceof MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return next(
              new ApiError(
                400,
                "File is too large. Maximum allowed size for chat attachments is 50 MB.",
              ),
            );
          }
          return next(
            new ApiError(
              400,
              err.message || "File upload failed. Please try again.",
            ),
          );
        }

        if (err.message === "FILE_TYPE_BLOCKED_DANGEROUS") {
          return next(
            new ApiError(
              400,
              "File format not allowed. Executable and script files (.exe, .bat, .sh, .cmd, etc.) are blocked for security reasons.",
            ),
          );
        }

        if (err.message === "FILE_FORMAT_NOT_ALLOWED") {
          return next(
            new ApiError(
              400,
              "Unsupported file format. Allowed formats: Images, PDF, Office documents, Archives (.zip, .rar, .7z, etc.), and Engineering/CAD/BIM files (.dwg, .rvt, .ifc, etc.).",
            ),
          );
        }

        return next(err);
      }

      const file = req.file as Express.Multer.File | undefined;
      if (file && file.size === 0) {
        return next(
          new ApiError(
            400,
            "The selected file is empty (0 bytes). Please select a valid file.",
          ),
        );
      }

      res.status(201).json({
        success: true,
        data: {
          attachmentName: file?.originalname,
          attachmentMime: file?.mimetype,
          storedPath: getStoredUploadPath(file, "documents"),
        },
      });
    });
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
): Promise<{ status: number; body: any }> {
  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(body)], { type: contentType }),
    filename,
  );

  const res = await fetch(`${origin}${route}`, {
    method: "POST",
    body: form,
    headers: { connection: "close" },
  });

  const json = await res.json();
  return { status: res.status, body: json };
}

describe("Chat file upload HTTP flow", () => {
  const originalEnv = { ...process.env };
  let tempUploadDir = "";
  let server: http.Server;
  let origin = "";

  beforeAll(async () => {
    tempUploadDir = fs.mkdtempSync(path.join(os.tmpdir(), "clinka-chat-upload-"));
    process.env.UPLOAD_DIR = tempUploadDir;
    ensureUploadRoot();
    ({ server, origin } = await listen(createChatApp()));
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      if ((server as any)?.closeAllConnections) {
        (server as any).closeAllConnections();
      }
      server.close((err) => (err ? reject(err) : resolve()));
    });
    process.env = { ...originalEnv };
    fs.rmSync(tempUploadDir, { recursive: true, force: true });
  });

  it("successfully sends a compressed .zip file in chat", async () => {
    const { status, body } = await postFile(
      origin,
      "/api/messages/conversations/42",
      "structural_drawings.zip",
      "application/zip",
      ZIP_HEADER,
    );

    console.log("[TEST RESULT] Upload .zip -> Status:", status, JSON.stringify(body));
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.attachmentName).toBe("structural_drawings.zip");
    expect(body.data.storedPath).toMatch(/^\/uploads\/documents\/[0-9a-f-]+\.zip$/i);
  });

  it("successfully sends a compressed .rar archive in chat", async () => {
    const { status, body } = await postFile(
      origin,
      "/api/messages/conversations/42",
      "mep_models.rar",
      "application/x-rar-compressed",
      RAR_HEADER,
    );

    console.log("[TEST RESULT] Upload .rar -> Status:", status, JSON.stringify(body));
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.attachmentName).toBe("mep_models.rar");
    expect(body.data.storedPath).toMatch(/^\/uploads\/documents\/[0-9a-f-]+\.rar$/i);
  });

  it("successfully sends a compressed .7z archive in chat", async () => {
    const { status, body } = await postFile(
      origin,
      "/api/messages/conversations/42",
      "etabs_calculations.7z",
      "application/x-7z-compressed",
      SEVENZ_HEADER,
    );

    console.log("[TEST RESULT] Upload .7z -> Status:", status, JSON.stringify(body));
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.attachmentName).toBe("etabs_calculations.7z");
    expect(body.data.storedPath).toMatch(/^\/uploads\/documents\/[0-9a-f-]+\.7z$/i);
  });

  it("successfully sends a Revit BIM (.rvt) file in chat", async () => {
    const { status, body } = await postFile(
      origin,
      "/api/messages/conversations/42",
      "villa_architecture.rvt",
      "application/octet-stream",
      RVT_SAMPLE,
    );

    console.log("[TEST RESULT] Upload .rvt -> Status:", status, JSON.stringify(body));
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.attachmentName).toBe("villa_architecture.rvt");
    expect(body.data.storedPath).toMatch(/^\/uploads\/documents\/[0-9a-f-]+\.rvt$/i);
  });

  it("successfully sends an AutoCAD (.dwg) file in chat", async () => {
    const { status, body } = await postFile(
      origin,
      "/api/messages/conversations/42",
      "ground_floor_plan.dwg",
      "application/octet-stream",
      DWG_SAMPLE,
    );

    console.log("[TEST RESULT] Upload .dwg -> Status:", status, JSON.stringify(body));
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.attachmentName).toBe("ground_floor_plan.dwg");
    expect(body.data.storedPath).toMatch(/^\/uploads\/documents\/[0-9a-f-]+\.dwg$/i);
  });

  it("fails with 400 when sending an empty (0 bytes) file", async () => {
    const { status, body } = await postFile(
      origin,
      "/api/messages/conversations/42",
      "empty_archive.zip",
      "application/zip",
      Buffer.alloc(0),
    );

    console.log("[TEST RESULT] Upload empty file -> Status:", status, JSON.stringify(body));
    expect(status).toBe(400);
    expect(body.message).toBe(
      "The selected file is empty (0 bytes). Please select a valid file.",
    );
  });

  it("fails with 400 when sending a blocked executable (.exe)", async () => {
    const { status, body } = await postFile(
      origin,
      "/api/messages/conversations/42",
      "malware.exe",
      "application/octet-stream",
      Buffer.from("MZ_EXECUTABLE_BINARY"),
    );

    console.log("[TEST RESULT] Upload .exe -> Status:", status, JSON.stringify(body));
    expect(status).toBe(400);
    expect(body.message).toBe(
      "File format not allowed. Executable and script files (.exe, .bat, .sh, .cmd, etc.) are blocked for security reasons.",
    );
  });

  it("fails with 400 when sending a blocked script (.sh)", async () => {
    const { status, body } = await postFile(
      origin,
      "/api/messages/conversations/42",
      "install.sh",
      "application/x-sh",
      Buffer.from("#!/bin/bash\necho dangerous"),
    );

    console.log("[TEST RESULT] Upload .sh -> Status:", status, JSON.stringify(body));
    expect(status).toBe(400);
    expect(body.message).toBe(
      "File format not allowed. Executable and script files (.exe, .bat, .sh, .cmd, etc.) are blocked for security reasons.",
    );
  });

  it("fails with 400 when sending an unsupported file type (.xyz)", async () => {
    const { status, body } = await postFile(
      origin,
      "/api/messages/conversations/42",
      "unknown.xyz",
      "application/octet-stream",
      Buffer.from("RANDOM_DATA"),
    );

    console.log("[TEST RESULT] Upload .xyz -> Status:", status, JSON.stringify(body));
    expect(status).toBe(400);
    expect(body.message).toMatch(/Unsupported file format/i);
    expect(body.message).toMatch(/Archives \(\.zip, \.rar, \.7z, etc\.\)/i);
  });

  it("fails with 400 when file exceeds the 50 MB limit", async () => {
    // 51 MB buffer
    const oversized = Buffer.alloc(51 * 1024 * 1024, 0);

    const { status, body } = await postFile(
      origin,
      "/api/messages/conversations/42",
      "huge_project.zip",
      "application/zip",
      oversized,
    );

    console.log("[TEST RESULT] Upload > 50MB -> Status:", status, JSON.stringify(body));
    expect(status).toBe(400);
    expect(body.message).toBe(
      "File is too large. Maximum allowed size for chat attachments is 50 MB.",
    );
  });
});
