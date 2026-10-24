import request from "supertest";
import app from "../app";
import { submitWorkSchema } from "../modules/projects/project.validation";
import { engineerPortfolioOnly } from "../middlewares/engineerUpload.middleware";
import express from "express";

describe("File Upload and Document Access Security Controls", () => {
  describe("1. Static Upload Endpoint Access Control", () => {
    it("returns 403 Forbidden for direct access to /uploads/documents/*", async () => {
      const res = await request(app).get("/uploads/documents/sensitive_receipt.pdf");
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Direct access to documents is forbidden");
    });

    it("returns 403 Forbidden for direct access to /uploads/projects/* (deliverables)", async () => {
      const res = await request(app).get("/uploads/projects/contract_blueprint.dwg");
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Direct access to project deliverables is forbidden");
    });

    it("does not forbid public static categories (e.g. avatars returns 404 if missing, not 403)", async () => {
      const res = await request(app).get("/uploads/avatars/non_existent.png");
      expect(res.status).toBe(404);
    });
  });

  describe("2. Engineer Upload Middleware Security Validation", () => {
    let testApp: express.Express;

    beforeAll(() => {
      testApp = express();
      testApp.post(
        "/test/engineer-upload",
        engineerPortfolioOnly,
        (_req, res) => {
          res.status(200).json({ success: true });
        },
      );
      testApp.use(
        (
          err: any,
          _req: express.Request,
          res: express.Response,
          _next: express.NextFunction,
        ) => {
          res.status(400).json({ error: err.message });
        },
      );
    });

    it("rejects dangerous executable extensions (.exe) even with valid image mime type", async () => {
      const res = await request(testApp)
        .post("/test/engineer-upload")
        .attach("portfolio", Buffer.from("fake image content"), {
          filename: "malicious.exe",
          contentType: "image/jpeg",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("FILE_TYPE_BLOCKED_DANGEROUS");
    });

    it("rejects dangerous script extensions (.sh, .php, .html)", async () => {
      const res = await request(testApp)
        .post("/test/engineer-upload")
        .attach("portfolio", Buffer.from("<?php echo 'xss'; ?>"), {
          filename: "payload.php",
          contentType: "application/pdf",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("FILE_TYPE_BLOCKED_DANGEROUS");
    });

    it("rejects unsupported extensions and mismatched mime types", async () => {
      const res = await request(testApp)
        .post("/test/engineer-upload")
        .attach("portfolio", Buffer.from("some data"), {
          filename: "document.xyz",
          contentType: "image/png",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("FILE_FORMAT_NOT_ALLOWED");
    });
  });

  describe("3. Deliverable Link Scheme Protocol Validation", () => {
    it("accepts valid https and http links", () => {
      const result = submitWorkSchema.safeParse({
        notes: "Work completed",
        links: [
          { url: "https://drive.google.com/file/d/123", name: "Drive Link" },
          { url: "http://example.com/assets", name: "HTTP Link" },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("rejects dangerous javascript: protocol URLs", () => {
      const result = submitWorkSchema.safeParse({
        notes: "Work completed",
        links: [{ url: "javascript:alert(document.cookie)", name: "XSS Link" }],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("must start with http:// or https://");
      }
    });

    it("rejects data: URI schemes", () => {
      const result = submitWorkSchema.safeParse({
        notes: "Work completed",
        links: [{ url: "data:text/html;base64,PHNjcmlwdD4=", name: "Data URI" }],
      });
      expect(result.success).toBe(false);
    });
  });
});
