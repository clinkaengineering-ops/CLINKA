import { adminVerifyManualPayment } from "./manual-payment.service";
import db from "../../config/db";
import ApiError from "../../utils/ApiError";

jest.mock("../../config/db", () => {
  return {
    __esModule: true,
    default: {
      $transaction: jest.fn(),
      $executeRaw: jest.fn(),
      manualPaymentSubmission: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      payment: {
        updateMany: jest.fn(),
      },
      paymentLedgerEntry: {
        findFirst: jest.fn(),
        createMany: jest.fn(),
      },
      project: {
        update: jest.fn(),
      },
    },
  };
});

jest.mock("../../utils/notifications", () => ({
  createNotification: jest.fn().mockResolvedValue(true),
}));

jest.mock("../../utils/auditLogger", () => ({
  logSystemEvent: jest.fn().mockResolvedValue(true),
}));

describe("Manual Payment Verification Workflow - Security & Integrity Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("1. Transaction Failure Atomicity", () => {
    it("rolls back submission status when ledger creation or project update fails", async () => {
      const mockSubmission = {
        id: 101,
        status: "PENDING",
        payment: {
          id: 55,
          status: "PENDING",
          amountUsd: 500,
          commission: 50,
          projectId: "proj-1",
          project: { id: "proj-1", status: "AWAITING_PAYMENT", title: "Site Design" },
          engineer: { user: { id: "eng-1", name: "Engineer Alice" } },
        },
      };

      // Mock transaction executor to simulate failure halfway through
      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          $executeRaw: jest.fn().mockResolvedValue(1),
          manualPaymentSubmission: {
            findUnique: jest.fn().mockResolvedValue(mockSubmission),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          payment: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          paymentLedgerEntry: {
            findFirst: jest.fn().mockResolvedValue(null),
            createMany: jest.fn().mockRejectedValue(new Error("Database connection lost")),
          },
          project: { update: jest.fn() },
        };
        return callback(tx);
      });

      await expect(
        adminVerifyManualPayment(101, "admin-1", "Approve proof"),
      ).rejects.toThrow("Database connection lost");

      // Verify that no outside-of-transaction commit occurred on global db
      expect(db.manualPaymentSubmission.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("2. Concurrent Verification Conflict", () => {
    it("rejects the second admin when payment was already funded or transitioned", async () => {
      // Payment status is already FUNDED
      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          $executeRaw: jest.fn().mockResolvedValue(1),
          manualPaymentSubmission: {
            findUnique: jest.fn().mockResolvedValue({
              id: 102,
              status: "PENDING",
              payment: {
                id: 55,
                status: "FUNDED",
                project: { id: "proj-1", status: "IN_PROGRESS" },
                engineer: { user: { id: "eng-1" } },
              },
            }),
          },
        };
        return callback(tx);
      });

      await expect(
        adminVerifyManualPayment(102, "admin-2", "Approve submission 2"),
      ).rejects.toThrow(ApiError);

      await expect(
        adminVerifyManualPayment(102, "admin-2", "Approve submission 2"),
      ).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining("Payment cannot be funded because current status is FUNDED"),
      });
    });

    it("rejects when submission was concurrently modified", async () => {
      const mockSubmission = {
        id: 101,
        status: "PENDING",
        payment: {
          id: 55,
          status: "PENDING",
          amountUsd: 100,
          commission: 10,
          projectId: "proj-1",
          project: { id: "proj-1", status: "AWAITING_PAYMENT", title: "Project" },
          engineer: { user: { id: "eng-1", name: "Engineer" } },
        },
      };

      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          $executeRaw: jest.fn().mockResolvedValue(1),
          manualPaymentSubmission: {
            findUnique: jest.fn().mockResolvedValue(mockSubmission),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }), // Concurrently changed by another process
          },
          payment: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return callback(tx);
      });

      await expect(
        adminVerifyManualPayment(101, "admin-1"),
      ).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining("Conflict: submission was modified concurrently"),
      });
    });
  });

  describe("3. Idempotent Retries", () => {
    it("returns existing verified submission on repeated calls without duplicating side effects", async () => {
      const mockVerifiedSubmission = {
        id: 101,
        status: "VERIFIED",
        payment: {
          id: 55,
          status: "FUNDED",
          project: { id: "proj-1", status: "IN_PROGRESS", title: "Site Design" },
          engineer: { user: { id: "eng-1", name: "Engineer Alice" } },
        },
      };

      const mockTx = {
        $executeRaw: jest.fn().mockResolvedValue(1),
        manualPaymentSubmission: {
          findUnique: jest.fn().mockResolvedValue(mockVerifiedSubmission),
          updateMany: jest.fn(),
        },
        payment: {
          updateMany: jest.fn(),
        },
        paymentLedgerEntry: {
          createMany: jest.fn(),
        },
      };

      (db.$transaction as jest.Mock).mockImplementation(async (callback) => callback(mockTx));

      const result = await adminVerifyManualPayment(101, "admin-1");

      expect(result.status).toBe("VERIFIED");
      // Assert that no updates or ledger entries were created
      expect(mockTx.payment.updateMany).not.toHaveBeenCalled();
      expect(mockTx.paymentLedgerEntry.createMany).not.toHaveBeenCalled();
    });
  });

  describe("4. Duplicate Ledger Entry Prevention", () => {
    it("skips ledger creation if a FUNDED ledger entry already exists", async () => {
      const mockSubmission = {
        id: 101,
        status: "PENDING",
        payment: {
          id: 55,
          status: "PENDING",
          amountUsd: 500,
          commission: 50,
          projectId: "proj-1",
          project: { id: "proj-1", status: "AWAITING_PAYMENT", title: "Site Design" },
          engineer: { user: { id: "eng-1", name: "Engineer Alice" } },
        },
      };

      const mockTx = {
        $executeRaw: jest.fn().mockResolvedValue(1),
        manualPaymentSubmission: {
          findUnique: jest.fn().mockResolvedValue(mockSubmission),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        payment: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        paymentLedgerEntry: {
          // Simulate FUNDED ledger entry already present
          findFirst: jest.fn().mockResolvedValue({ id: 999, type: "FUNDED" }),
          createMany: jest.fn(),
        },
        project: {
          update: jest.fn().mockResolvedValue({}),
        },
      };

      (db.$transaction as jest.Mock).mockImplementation(async (callback) => callback(mockTx));

      await adminVerifyManualPayment(101, "admin-1");

      expect(mockTx.paymentLedgerEntry.createMany).not.toHaveBeenCalled();
    });
  });
});
