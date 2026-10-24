import {
  adminVerifyManualPayment,
  adminRejectManualPayment,
  submitManualPayment,
} from "./manual-payment.service";
import db from "../../config/db";
import ApiError from "../../utils/ApiError";

jest.mock("../../config/db", () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    manualPaymentSubmission: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    paymentLedgerEntry: {
      findFirst: jest.fn(),
      createMany: jest.fn(),
    },
    user: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

jest.mock("../../utils/notifications", () => ({
  createNotification: jest.fn().mockResolvedValue(true),
}));

jest.mock("../../utils/auditLogger", () => ({
  logSystemEvent: jest.fn().mockResolvedValue(true),
}));

jest.mock("../../config/mailer", () => ({
  __esModule: true,
  default: {
    sendMail: jest.fn().mockResolvedValue(true),
  },
}));

describe("Manual Payment Service - Concurrency, Reliability & Idempotency", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockSubmission = (overrides = {}) => ({
    id: 101,
    paymentId: 55,
    status: "PENDING",
    paymentMethod: "bank_transfer",
    transactionReference: "REF-TEST-001",
    amount: 500,
    currency: "USD",
    payment: {
      id: 55,
      projectId: "proj-1",
      clientId: "client-1",
      amountUsd: 500,
      amountEgp: 25000,
      commission: 50,
      status: "PENDING",
      project: { id: "proj-1", title: "Test Project", status: "AWAITING_PAYMENT", clientId: "client-1" },
      engineer: {
        id: 10,
        user: { id: "eng-1", name: "Engineer Name" },
      },
    },
    ...overrides,
  });

  // ─── 1. CONCURRENT VERIFICATION TEST ─────────────────────────────────────────
  describe("Concurrent Verification", () => {
    it("prevents two admins from verifying different submissions for the same payment concurrently", async () => {
      const submission1 = createMockSubmission({ id: 101, transactionReference: "REF-001" });
      const submission2 = createMockSubmission({ id: 102, transactionReference: "REF-002" });

      // Admin 1 executes first inside a transaction
      (db.$transaction as jest.Mock).mockImplementationOnce(async (callback) => {
        const mockTx = {
          $executeRaw: jest.fn().mockResolvedValue(1),
          manualPaymentSubmission: {
            findUnique: jest.fn().mockResolvedValue(submission1),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          payment: {
            // Admin 1 successfully moves payment from PENDING to FUNDED
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          paymentLedgerEntry: {
            findFirst: jest.fn().mockResolvedValue(null),
            createMany: jest.fn().mockResolvedValue({ count: 3 }),
          },
          project: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      const admin1Result = await adminVerifyManualPayment(101, "admin-1", "Verified by Admin 1");
      expect(admin1Result.status).toBe("VERIFIED");

      // Admin 2 attempts to verify submission 102 concurrently, but payment is now already FUNDED
      (db.$transaction as jest.Mock).mockImplementationOnce(async (callback) => {
        const mockTx = {
          $executeRaw: jest.fn().mockResolvedValue(1),
          manualPaymentSubmission: {
            findUnique: jest.fn().mockResolvedValue(submission2),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          payment: {
            // Conditional update fails because status is no longer PENDING!
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
        };
        return callback(mockTx);
      });

      // Admin 2 is rejected with a 409 Conflict, preventing double funding
      await expect(adminVerifyManualPayment(102, "admin-2", "Verified by Admin 2")).rejects.toThrow(
        expect.objectContaining({
          statusCode: 409,
          message: expect.stringContaining("Conflict: payment was funded or modified concurrently"),
        }),
      );
    });
  });

  // ─── 2. ATOMIC ROLLBACK ON TRANSACTION FAILURE ───────────────────────────────
  describe("Transaction Failure & Atomic Rollback", () => {
    it("ensures submission is not marked VERIFIED if payment update or ledger recording fails", async () => {
      const submission = createMockSubmission();

      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          $executeRaw: jest.fn().mockResolvedValue(1),
          manualPaymentSubmission: {
            findUnique: jest.fn().mockResolvedValue(submission),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          payment: {
            // Simulate sudden database error during payment update
            updateMany: jest.fn().mockRejectedValue(new Error("Connection terminated unexpectedly")),
          },
          paymentLedgerEntry: {
            findFirst: jest.fn(),
            createMany: jest.fn(),
          },
          project: {
            update: jest.fn(),
          },
        };
        return callback(mockTx);
      });

      await expect(adminVerifyManualPayment(101, "admin-1")).rejects.toThrow(
        "Connection terminated unexpectedly",
      );

      // Verify that no standalone uncommitted updates occurred outside db.$transaction
      expect(db.manualPaymentSubmission.updateMany).not.toHaveBeenCalled();
      expect(db.payment.updateMany).not.toHaveBeenCalled();
    });
  });

  // ─── 3. IDEMPOTENT RETRIES ───────────────────────────────────────────────────
  describe("Idempotent Retries", () => {
    it("returns successfully on repeated verification without duplicate side-effects", async () => {
      const alreadyVerifiedSubmission = createMockSubmission({
        status: "VERIFIED",
        payment: {
          id: 55,
          projectId: "proj-1",
          clientId: "client-1",
          amountUsd: 500,
          commission: 50,
          status: "FUNDED", // Payment already funded
          project: { id: "proj-1", title: "Test Project", status: "IN_PROGRESS", clientId: "client-1" },
          engineer: { user: { id: "eng-1", name: "Engineer Name" } },
        },
      });

      const mockTx = {
        $executeRaw: jest.fn(),
        manualPaymentSubmission: {
          findUnique: jest.fn().mockResolvedValue(alreadyVerifiedSubmission),
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

      // Returns the verified submission gracefully
      expect(result.status).toBe("VERIFIED");
      // Side-effect queries are NOT called
      expect(mockTx.manualPaymentSubmission.updateMany).not.toHaveBeenCalled();
      expect(mockTx.payment.updateMany).not.toHaveBeenCalled();
      expect(mockTx.paymentLedgerEntry.createMany).not.toHaveBeenCalled();
    });
  });

  // ─── 4. DUPLICATE LEDGER ENTRIES PREVENTION ──────────────────────────────────
  describe("Duplicate Ledger Prevention", () => {
    it("skips recording ledger entries if FUNDED ledger row already exists", async () => {
      const submission = createMockSubmission();
      const mockCreateMany = jest.fn();

      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          $executeRaw: jest.fn().mockResolvedValue(1),
          manualPaymentSubmission: {
            findUnique: jest.fn().mockResolvedValue(submission),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          payment: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          paymentLedgerEntry: {
            // FUNDED ledger entry already found (e.g. from prior webhook or system event)
            findFirst: jest.fn().mockResolvedValue({ id: 99, type: "FUNDED" }),
            createMany: mockCreateMany,
          },
          project: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      const result = await adminVerifyManualPayment(101, "admin-1");
      expect(result.status).toBe("VERIFIED");
      // Ledger createMany must NOT be called
      expect(mockCreateMany).not.toHaveBeenCalled();
    });
  });

  // ─── 5. TERMINAL STATE PROTECTION ────────────────────────────────────────────
  describe("Terminal State Protection", () => {
    it("refuses to verify and overwrite a payment that was already RELEASED", async () => {
      const releasedSubmission = createMockSubmission({
        payment: {
          id: 55,
          projectId: "proj-1",
          clientId: "client-1",
          amountUsd: 500,
          commission: 50,
          status: "RELEASED", // Payment already released to engineer!
          project: { id: "proj-1", title: "Test Project", status: "COMPLETED", clientId: "client-1" },
          engineer: { user: { id: "eng-1", name: "Engineer Name" } },
        },
      });

      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          manualPaymentSubmission: {
            findUnique: jest.fn().mockResolvedValue(releasedSubmission),
          },
        };
        return callback(mockTx);
      });

      await expect(adminVerifyManualPayment(101, "admin-1")).rejects.toThrow(
        expect.objectContaining({
          statusCode: 409,
          message: expect.stringContaining("Payment cannot be funded because current status is RELEASED"),
        }),
      );
    });

    it("refuses to verify and overwrite a payment that was already REFUNDED", async () => {
      const refundedSubmission = createMockSubmission({
        payment: {
          id: 55,
          projectId: "proj-1",
          clientId: "client-1",
          amountUsd: 500,
          commission: 50,
          status: "REFUNDED", // Payment already refunded to client!
          project: { id: "proj-1", title: "Test Project", status: "CANCELLED", clientId: "client-1" },
          engineer: { user: { id: "eng-1", name: "Engineer Name" } },
        },
      });

      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          manualPaymentSubmission: {
            findUnique: jest.fn().mockResolvedValue(refundedSubmission),
          },
        };
        return callback(mockTx);
      });

      await expect(adminVerifyManualPayment(101, "admin-1")).rejects.toThrow(
        expect.objectContaining({
          statusCode: 409,
          message: expect.stringContaining("Payment cannot be funded because current status is REFUNDED"),
        }),
      );
    });
  });

  // ─── 6. AUTO-REJECTION OF SUPERSEDED SUBMISSIONS ─────────────────────────────
  describe("Auto-Rejection of Superseded Submissions", () => {
    it("automatically rejects any other pending submissions for the same payment", async () => {
      const submission = createMockSubmission();
      const mockUpdateMany = jest.fn().mockResolvedValue({ count: 1 });

      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          $executeRaw: jest.fn().mockResolvedValue(1),
          manualPaymentSubmission: {
            findUnique: jest.fn().mockResolvedValue(submission),
            updateMany: mockUpdateMany,
          },
          payment: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          paymentLedgerEntry: {
            findFirst: jest.fn().mockResolvedValue(null),
            createMany: jest.fn().mockResolvedValue({ count: 3 }),
          },
          project: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      await adminVerifyManualPayment(101, "admin-1");

      // Verify that the second call to updateMany auto-rejects other submissions
      expect(mockUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            paymentId: 55,
            id: { not: 101 },
            status: "PENDING",
          },
          data: expect.objectContaining({
            status: "REJECTED",
          }),
        }),
      );
    });
  });

  // ─── 7. REJECT MANUAL PAYMENT NOTIFICATIONS ──────────────────────────────────
  describe("adminRejectManualPayment", () => {
    it("rejects a pending submission and informs client", async () => {
      const pendingSub = {
        id: 101,
        status: "PENDING",
        payment: {
          id: 55,
          status: "PENDING",
          projectId: "proj-1",
          project: { id: "proj-1", title: "Test Project", clientId: "client-1" },
        },
      };

      const rejectedSub = {
        ...pendingSub,
        status: "REJECTED",
        adminNote: "Invalid receipt screenshot",
      };

      (db.manualPaymentSubmission.findUnique as jest.Mock)
        .mockResolvedValueOnce(pendingSub)
        .mockResolvedValueOnce(rejectedSub);
      (db.manualPaymentSubmission.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await adminRejectManualPayment(101, "admin-1", "Invalid receipt screenshot");

      expect(result!.status).toBe("REJECTED");
      expect(db.manualPaymentSubmission.updateMany).toHaveBeenCalledWith({
        where: { id: 101, status: "PENDING" },
        data: expect.objectContaining({
          status: "REJECTED",
          adminNote: "Invalid receipt screenshot",
        }),
      });
    });

    it("returns cleanly if already rejected (idempotent)", async () => {
      const rejectedSub = {
        id: 101,
        status: "REJECTED",
        payment: {
          id: 55,
          status: "PENDING",
          projectId: "proj-1",
          project: { id: "proj-1", title: "Test Project", clientId: "client-1" },
        },
      };

      (db.manualPaymentSubmission.findUnique as jest.Mock).mockResolvedValue(rejectedSub);

      const result = await adminRejectManualPayment(101, "admin-1", "reason");
      expect(result!.status).toBe("REJECTED");
      expect(db.manualPaymentSubmission.updateMany).not.toHaveBeenCalled();
    });

    it("throws 400 if submission is already verified", async () => {
      const verifiedSub = {
        id: 101,
        status: "VERIFIED",
        payment: {
          id: 55,
          status: "FUNDED",
          projectId: "proj-1",
          project: { id: "proj-1", title: "Test Project", clientId: "client-1" },
        },
      };

      (db.manualPaymentSubmission.findUnique as jest.Mock).mockResolvedValue(verifiedSub);

      await expect(adminRejectManualPayment(101, "admin-1", "reason")).rejects.toThrow(
        expect.objectContaining({
          statusCode: 400,
          message: "Submission is no longer pending (already verified)",
        }),
      );
    });
  });
});
