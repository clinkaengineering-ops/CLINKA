import request from "supertest";
import app from "../../app";
import db from "../../config/db";
import axios from "axios";
import generateToken from "../../utils/generateToken";
import * as uploadConfig from "../../config/upload";
import cloudinary from "../../config/cloudinary";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Download Proxy Security Tests (Deliverables & Payment Proofs)", () => {
  const clientToken = generateToken("client-user-id", "CLIENT");
  const strangerToken = generateToken("stranger-user-id", "CLIENT");
  const engineerToken = generateToken("engineer-user-id", "ENGINEER");
  const adminToken = generateToken("admin-user-id", "ADMIN");

  beforeAll(() => {
    cloudinary.config({
      cloud_name: "bkv1llhu",
      api_key: "792594964666692",
      api_secret: "mock-secret-key-12345",
      secure: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/projects/:id/deliverables/:deliverableId/download", () => {
    it("returns 403 Forbidden if requester is neither client, assigned engineer, nor admin", async () => {
      (db.project.findUnique as jest.Mock).mockResolvedValue({
        id: "proj-1",
        clientId: "client-user-id",
        assignedEngineerId: "engineer-user-id",
      });

      const res = await request(app)
        .get("/api/projects/proj-1/deliverables/1/download")
        .set("Authorization", `Bearer ${strangerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/access/i);
    });

    it("rejects deceptive or untrusted upstream hosts with 400 Bad Request", async () => {
      (db.project.findUnique as jest.Mock).mockResolvedValue({
        id: "proj-1",
        clientId: "client-user-id",
        assignedEngineerId: "engineer-user-id",
      });
      (db.projectDeliverable.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        type: "FILE",
        url: "https://attacker-cloudinary.com/evil.zip",
        name: "evil.zip",
      });

      const res = await request(app)
        .get("/api/projects/proj-1/deliverables/1/download")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/untrusted or invalid/i);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it("returns 502 Bad Gateway and NEVER redirects if upstream stream fails", async () => {
      (db.project.findUnique as jest.Mock).mockResolvedValue({
        id: "proj-1",
        clientId: "client-user-id",
        assignedEngineerId: "engineer-user-id",
      });
      (db.projectDeliverable.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        type: "FILE",
        url: "https://res.cloudinary.com/bkv1llhu/raw/authenticated/v1/projects/plans.dwg",
        name: "plans.dwg",
      });

      // Upstream failure
      mockedAxios.get.mockRejectedValueOnce(new Error("Upstream connection reset"));

      const res = await request(app)
        .get("/api/projects/proj-1/deliverables/1/download")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(502);
      expect(res.body.message).toMatch(/failed to stream deliverable file/i);
      // Verify no redirect header is sent
      expect(res.headers.location).toBeUndefined();
    });

    it("fails closed with 400 Bad Request and NEVER redirects if deliverable is an external LINK", async () => {
      (db.project.findUnique as jest.Mock).mockResolvedValue({
        id: "proj-1",
        clientId: "client-user-id",
        assignedEngineerId: "engineer-user-id",
      });
      (db.projectDeliverable.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        type: "LINK",
        url: "https://figma.com/file/sample-design",
        name: "Figma Link",
      });

      const res = await request(app)
        .get("/api/projects/proj-1/deliverables/1/download")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/external link/i);
      expect(res.headers.location).toBeUndefined();
    });

    it("fails closed with 400 Bad Request if deliverable has unexpected transformations", async () => {
      (db.project.findUnique as jest.Mock).mockResolvedValue({
        id: "proj-1",
        clientId: "client-user-id",
        assignedEngineerId: "engineer-user-id",
      });
      (db.projectDeliverable.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        type: "FILE",
        url: "https://res.cloudinary.com/bkv1llhu/image/authenticated/w_500,c_scale/v1/projects/plans.png",
        name: "plans.png",
      });

      const res = await request(app)
        .get("/api/projects/proj-1/deliverables/1/download")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/unexpected transformation/i);
      expect(mockedAxios.get).not.toHaveBeenCalled();
      expect(res.headers.location).toBeUndefined();
    });

    it("fails closed with 400 Bad Request if deliverable has public 'upload' delivery type", async () => {
      (db.project.findUnique as jest.Mock).mockResolvedValue({
        id: "proj-1",
        clientId: "client-user-id",
        assignedEngineerId: "engineer-user-id",
      });
      (db.projectDeliverable.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        type: "FILE",
        url: "https://res.cloudinary.com/bkv1llhu/raw/upload/v1/projects/plans.dwg",
        name: "plans.dwg",
      });

      const res = await request(app)
        .get("/api/projects/proj-1/deliverables/1/download")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/public delivery type \('upload'\)/i);
      expect(mockedAxios.get).not.toHaveBeenCalled();
      expect(res.headers.location).toBeUndefined();
    });
  });

  describe("GET /api/payments/manual-payments/:id/proof", () => {
    it("returns 403 Forbidden if requester is not the submission owner and not admin", async () => {
      (db.manualPaymentSubmission.findUnique as jest.Mock).mockResolvedValue({
        id: 10,
        proofUrl: "https://res.cloudinary.com/bkv1llhu/raw/authenticated/v1/documents/proof.jpg",
        payment: { clientId: "client-user-id" },
      });

      const res = await request(app)
        .get("/api/payments/manual-payments/10/proof")
        .set("Authorization", `Bearer ${strangerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/access denied/i);
    });

    it("rejects deceptive or internal SSRF hostnames with 400 Bad Request", async () => {
      (db.manualPaymentSubmission.findUnique as jest.Mock).mockResolvedValue({
        id: 10,
        proofUrl: "http://169.254.169.254/latest/meta-data",
        payment: { clientId: "client-user-id" },
      });

      const res = await request(app)
        .get("/api/payments/manual-payments/10/proof")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/untrusted or invalid/i);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it("rejects payment proof URLs with embedded credentials or unexpected ports", async () => {
      (db.manualPaymentSubmission.findUnique as jest.Mock).mockResolvedValue({
        id: 10,
        proofUrl: "https://admin:pass@res.cloudinary.com/bkv1llhu/raw/authenticated/v1/documents/proof.pdf",
        payment: { clientId: "client-user-id" },
      });

      const res = await request(app)
        .get("/api/payments/manual-payments/10/proof")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/untrusted or invalid/i);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it("returns 502 Bad Gateway and NEVER redirects if upstream stream fails", async () => {
      (db.manualPaymentSubmission.findUnique as jest.Mock).mockResolvedValue({
        id: 10,
        proofUrl: "https://res.cloudinary.com/bkv1llhu/raw/authenticated/v1/documents/receipt.pdf",
        payment: { clientId: "client-user-id" },
      });

      mockedAxios.get.mockRejectedValueOnce(new Error("Cloudinary 500 error"));

      const res = await request(app)
        .get("/api/payments/manual-payments/10/proof")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(502);
      expect(res.body.message).toMatch(/failed to stream payment proof/i);
      expect(res.headers.location).toBeUndefined();
    });
  });
});

