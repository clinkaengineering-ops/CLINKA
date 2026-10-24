import {
  initiateProjectCheckout,
  prepareProjectCheckoutSession,
} from "./payments.service";
import { adminVerifyManualPayment, submitManualPayment } from "./manual-payment.service";
import db from "../../config/db";

jest.mock("../../config/db", () => ({
  __esModule: true,
  default: {
    project: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    bid: {
      findFirst: jest.fn(),
    },
    projectInvitation: {
      findFirst: jest.fn(),
    },
    engineerProfile: {
      findUnique: jest.fn(),
    },
    platformSettings: {
      findFirst: jest.fn(),
    },
    manualPaymentSubmission: {
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
    paymentLedgerEntry: {
      createMany: jest.fn(),
      findFirst: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("../exchange-rate", () => ({
  exchangeRateService: {
    convert: jest.fn().mockResolvedValue({
      amountConverted: 5000,
      rateUsed: { rate: 50, provider: "MOCK", timestamp: new Date() },
    }),
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
    sendMail: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock("../../config/paymob", () => ({
  getPaymobConfig: jest.fn().mockImplementation(() => {
    throw new Error("Payment gateway is not configured (PAYMOB_SECRET_KEY)");
  }),
}));

describe("Payments Service - Project Status Checks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initiateProjectCheckout", () => {
    it("allows checkout when project status is IN_PROGRESS", async () => {
      (db.project.findUnique as jest.Mock).mockResolvedValue({
        id: "proj-1",
        clientId: "client-1",
        status: "IN_PROGRESS",
        budget: 100,
        payment: null,
      });
      (db.bid.findFirst as jest.Mock).mockResolvedValue({
        engineerId: 10,
        price: 100,
      });
      (db.platformSettings.findFirst as jest.Mock).mockResolvedValue({
        platformFeePercent: 10,
      });
      (db.payment.create as jest.Mock).mockResolvedValue({
        id: 1,
        status: "PENDING",
      });
      (db.payment.update as jest.Mock).mockResolvedValue({
        id: 1,
        provider: "MANUAL",
        status: "PENDING",
      });

      const res = await initiateProjectCheckout("client-1", "proj-1", {});
      expect(res.payment.status).toBe("PENDING");
    });

    it("allows checkout when project status is AWAITING_PAYMENT", async () => {
      (db.project.findUnique as jest.Mock).mockResolvedValue({
        id: "proj-2",
        clientId: "client-1",
        status: "AWAITING_PAYMENT",
        budget: 150,
        payment: null,
      });
      (db.bid.findFirst as jest.Mock).mockResolvedValue({
        engineerId: 10,
        price: 150,
      });
      (db.platformSettings.findFirst as jest.Mock).mockResolvedValue({
        platformFeePercent: 10,
      });
      (db.payment.create as jest.Mock).mockResolvedValue({
        id: 2,
        status: "PENDING",
      });
      (db.payment.update as jest.Mock).mockResolvedValue({
        id: 2,
        provider: "MANUAL",
        status: "PENDING",
      });

      const res = await initiateProjectCheckout("client-1", "proj-2", {});
      expect(res.payment.status).toBe("PENDING");
    });

    it("throws 400 when project status is OPEN", async () => {
      (db.project.findUnique as jest.Mock).mockResolvedValue({
        id: "proj-3",
        clientId: "client-1",
        status: "OPEN",
        budget: 100,
      });

      await expect(
        initiateProjectCheckout("client-1", "proj-3", {})
      ).rejects.toThrow("Escrow payment is only available for in-progress projects");
    });

    it("throws 400 when project status is COMPLETED", async () => {
      (db.project.findUnique as jest.Mock).mockResolvedValue({
        id: "proj-4",
        clientId: "client-1",
        status: "COMPLETED",
        budget: 100,
      });

      await expect(
        initiateProjectCheckout("client-1", "proj-4", {})
      ).rejects.toThrow("Escrow payment is only available for in-progress projects");
    });
  });

  describe("prepareProjectCheckoutSession", () => {
    it("allows checkout session preparation when project status is IN_PROGRESS", async () => {
      (db.project.findUnique as jest.Mock).mockResolvedValue({
        id: "proj-1",
        title: "Test Project",
        clientId: "client-1",
        status: "IN_PROGRESS",
        budget: 100,
        payment: null,
      });
      (db.bid.findFirst as jest.Mock).mockResolvedValue({
        engineerId: 10,
        price: 100,
      });
      (db.platformSettings.findFirst as jest.Mock).mockResolvedValue({
        platformFeePercent: 10,
      });
      (db.payment.create as jest.Mock).mockResolvedValue({
        id: 1,
        status: "PENDING",
      });
      (db.payment.update as jest.Mock).mockResolvedValue({
        id: 1,
        provider: "MANUAL",
        status: "PENDING",
      });

      const res = await prepareProjectCheckoutSession("client-1", "proj-1");
      expect(res.paymentId).toBe(1);
      expect(res.currency).toBe("USD");
    });

    it("allows checkout session preparation when project status is AWAITING_PAYMENT", async () => {
      (db.project.findUnique as jest.Mock).mockResolvedValue({
        id: "proj-2",
        title: "Test Project 2",
        clientId: "client-1",
        status: "AWAITING_PAYMENT",
        budget: 200,
        payment: null,
      });
      (db.bid.findFirst as jest.Mock).mockResolvedValue({
        engineerId: 10,
        price: 200,
      });
      (db.platformSettings.findFirst as jest.Mock).mockResolvedValue({
        platformFeePercent: 10,
      });
      (db.payment.create as jest.Mock).mockResolvedValue({
        id: 2,
        status: "PENDING",
      });
      (db.payment.update as jest.Mock).mockResolvedValue({
        id: 2,
        provider: "MANUAL",
        status: "PENDING",
      });

      const res = await prepareProjectCheckoutSession("client-1", "proj-2");
      expect(res.paymentId).toBe(2);
      expect(res.currency).toBe("USD");
    });

    it("throws 400 when project status is OPEN", async () => {
      (db.project.findUnique as jest.Mock).mockResolvedValue({
        id: "proj-3",
        clientId: "client-1",
        status: "OPEN",
        budget: 100,
      });

      await expect(
        prepareProjectCheckoutSession("client-1", "proj-3")
      ).rejects.toThrow("Escrow payment is only available for in-progress projects");
    });
  });

  describe("Payment funding project transition", () => {
    it("transitions project status to IN_PROGRESS when manual payment is verified", async () => {
      const mockProject = {
        id: "proj-10",
        title: "Project 10",
        clientId: "client-1",
        status: "AWAITING_PAYMENT",
      };

      const mockSubmission = {
        id: 1,
        status: "PENDING",
        payment: {
          id: 55,
          status: "PENDING",
          projectId: "proj-10",
          clientId: "client-1",
          amountUsd: 100,
          commission: 10,
          project: mockProject,
          engineer: {
            user: { id: "eng-1", name: "Engineer" },
          },
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
          update: jest.fn().mockResolvedValue({}),
        },
        paymentLedgerEntry: {
          findFirst: jest.fn().mockResolvedValue(null),
          createMany: jest.fn().mockResolvedValue({}),
        },
        project: { update: jest.fn().mockResolvedValue({}) },
      };

      (db.manualPaymentSubmission.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (db.manualPaymentSubmission.findUnique as jest.Mock).mockResolvedValue(mockSubmission);

      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      await adminVerifyManualPayment(1, "admin-user", "Approved");

      expect(mockTx.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 55, status: "PENDING" },
          data: { status: "FUNDED", provider: "MANUAL" },
        })
      );

      expect(mockTx.project.update).toHaveBeenCalledWith({
        where: { id: "proj-10" },
        data: { status: "IN_PROGRESS" },
      });

      expect(mockProject.status).toBe("IN_PROGRESS");
    });
  });

  describe("submitManualPayment validations", () => {
    it("rejects submission if payment method is disabled in platform settings", async () => {
      (db.project.findUnique as jest.Mock).mockResolvedValue({
        id: "proj-1",
        clientId: "client-1",
        status: "IN_PROGRESS",
        payment: { id: 10, status: "PENDING", amountUsd: 100, amountEgp: 5000 },
        client: { name: "Client", email: "client@test.com" },
      });
      (db.platformSettings.findFirst as jest.Mock).mockResolvedValue({
        manualPaymentSettings: {
          instapay: { enabled: false },
        },
      });

      await expect(
        submitManualPayment("client-1", "proj-1", {
          paymentMethod: "instapay",
          transactionReference: "TX-1",
          amount: 100,
          currency: "USD",
          proofUrl: "/uploads/proof.jpg",
        }),
      ).rejects.toThrow(/Payment method 'instapay' is currently disabled/);
    });

    it("rejects submission if project status is not IN_PROGRESS or AWAITING_PAYMENT", async () => {
      (db.project.findUnique as jest.Mock).mockResolvedValue({
        id: "proj-cancelled",
        clientId: "client-1",
        status: "CANCELLED",
        payment: { id: 11, status: "PENDING", amountUsd: 100, amountEgp: 5000 },
        client: { name: "Client", email: "client@test.com" },
      });

      await expect(
        submitManualPayment("client-1", "proj-cancelled", {
          paymentMethod: "bank_transfer",
          transactionReference: "TX-2",
          amount: 100,
          currency: "USD",
          proofUrl: "/uploads/proof.jpg",
        }),
      ).rejects.toThrow(/Escrow payment is only available for in-progress projects/);
    });

    it("resolves destination snapshot server-side from destinationAccountId", async () => {
      (db.project.findUnique as jest.Mock).mockResolvedValue({
        id: "proj-dest",
        clientId: "client-1",
        status: "IN_PROGRESS",
        payment: { id: 12, status: "PENDING", amountUsd: 100, amountEgp: 5000 },
        client: { name: "Client", email: "client@test.com" },
      });
      (db.platformSettings.findFirst as jest.Mock).mockResolvedValue({
        manualPaymentSettings: {
          bankTransfer: { enabled: true },
          bankAccounts: [
            {
              id: "bank-cib",
              country: "EG",
              bankName: "CIB",
              accountHolder: "CLINKA CORP",
              accountNumber: "100020003000",
              iban: "EG1234567890",
              currency: "EGP",
              enabled: true,
            },
          ],
        },
      });

      const mockCreate = jest.fn().mockImplementation((args) => Promise.resolve({ id: 99, ...args.data }));
      (db.$transaction as jest.Mock).mockImplementation(async (cb) => {
        return cb({
          manualPaymentSubmission: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: mockCreate,
          },
        });
      });
      (db.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await submitManualPayment("client-1", "proj-dest", {
        paymentMethod: "bank_transfer",
        destinationAccountId: "bank-cib",
        transactionReference: "TX-3",
        amount: 100,
        currency: "USD",
        proofUrl: "/uploads/proof.jpg",
        // Client attempts to spoof bank name:
        receivingBankName: "Attacker Fake Bank",
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            receivingBankName: "CIB",
            receivingAccountName: "CLINKA CORP",
            receivingAccountNumber: "100020003000",
            receivingIban: "EG1234567890",
          }),
        }),
      );
    });

    it("converts Prisma P2002 duplicate reference to 409 conflict error", async () => {
      (db.project.findUnique as jest.Mock).mockResolvedValue({
        id: "proj-dup",
        clientId: "client-1",
        status: "IN_PROGRESS",
        payment: { id: 13, status: "PENDING", amountUsd: 100, amountEgp: 5000 },
        client: { name: "Client", email: "client@test.com" },
      });
      (db.platformSettings.findFirst as jest.Mock).mockResolvedValue({
        manualPaymentSettings: { bankTransfer: { enabled: true } },
      });

      const p2002Error: any = new Error("Unique constraint failed");
      p2002Error.code = "P2002";

      (db.$transaction as jest.Mock).mockImplementation(async (cb) => {
        return cb({
          manualPaymentSubmission: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockRejectedValue(p2002Error),
          },
        });
      });

      await expect(
        submitManualPayment("client-1", "proj-dup", {
          paymentMethod: "bank_transfer",
          transactionReference: "TX-DUPLICATE",
          amount: 100,
          currency: "USD",
          proofUrl: "/uploads/proof.jpg",
        }),
      ).rejects.toThrow(/A submission with this transaction reference already exists/);
    });
  });
});
