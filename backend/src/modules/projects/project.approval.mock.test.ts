import { approveProjectWork } from "./project.workflow.service";
import db from "../../config/db";
import ApiError from "../../utils/ApiError";

jest.mock("../../config/db", () => {
  const mockTx = {
    $executeRaw: jest.fn().mockResolvedValue(1),
    dispute: {
      updateMany: jest.fn(),
    },
    wallet: {
      updateMany: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    walletTransaction: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
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
  };

  return {
    __esModule: true,
    default: {
      project: {
        findUnique: jest.fn(),
      },
      dispute: {
        findFirst: jest.fn(),
      },
      engineerProfile: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(mockTx)),
      _mockTx: mockTx,
    },
  };
});

jest.mock("../../utils/notifications", () => ({
  createNotification: jest.fn().mockResolvedValue(true),
}));

jest.mock("../../config/mailer", () => ({
  __esModule: true,
  default: {
    sendMail: jest.fn().mockResolvedValue(true),
  },
  getEmailFrom: jest.fn().mockReturnValue("noreply@test.com"),
}));

jest.mock("../../config/clientUrl", () => ({
  getClientUrl: jest.fn().mockReturnValue("http://localhost:3000"),
}));

const mockDb = db as any;
const mockTx = (db as any)._mockTx;

describe("Project Approval - Concurrency & Duplicate Release Unit Tests (Mocked)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseProject = {
    id: "proj-1",
    clientId: "client-1",
    title: "Construction Blueprint",
    status: "SUBMITTED_FOR_REVIEW",
    deliveredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago (matured)
    payment: {
      id: 101,
      engineerId: 5,
      amountUsd: 1000,
      commission: 100,
      status: "FUNDED",
    },
  };

  const engineerProfile = {
    id: 5,
    userId: "eng-user-1",
  };

  it("should successfully approve project work, claim payment atomically, credit wallet, and record ledger", async () => {
    mockDb.project.findUnique.mockResolvedValue(baseProject);
    mockDb.dispute.findFirst.mockResolvedValue(null);
    mockDb.engineerProfile.findUnique.mockResolvedValue(engineerProfile);
    mockDb.user.findUnique.mockResolvedValue({ id: "eng-user-1", name: "Engineer Bob", email: "bob@test.com" });

    // Mock tx operations
    mockTx.payment.updateMany.mockResolvedValue({ count: 1 });
    mockTx.wallet.findUnique.mockResolvedValue({ id: 1, userId: "eng-user-1", availableBalance: 0, pendingBalance: 0, heldByDispute: 0 });
    mockTx.paymentLedgerEntry.findFirst.mockResolvedValue(null);
    mockTx.paymentLedgerEntry.createMany.mockResolvedValue({ count: 2 });
    mockTx.wallet.update.mockResolvedValue({});
    mockTx.walletTransaction.findFirst.mockResolvedValue(null);
    mockTx.walletTransaction.create.mockResolvedValue({});
    mockTx.project.update.mockResolvedValue({ ...baseProject, status: "COMPLETED" });

    const result = await approveProjectWork("client-1", "proj-1");

    expect(result.status).toBe("RELEASED");
    // Verify row lock executed
    expect(mockTx.$executeRaw).toHaveBeenCalled();
    // Verify atomic claim executed with FUNDED filter
    expect(mockTx.payment.updateMany).toHaveBeenCalledWith({
      where: { id: 101, status: "FUNDED" },
      data: { status: "RELEASED" },
    });
    // Verify wallet updated with net earnings ($900)
    expect(mockTx.wallet.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { availableBalance: { increment: 900 } },
    });
    // Verify ledger entries created
    expect(mockTx.paymentLedgerEntry.createMany).toHaveBeenCalled();
  });

  it("repeated approval attempt: should fail with 400 when project is already COMPLETED", async () => {
    mockDb.project.findUnique.mockResolvedValue({
      ...baseProject,
      status: "COMPLETED",
    });

    await expect(approveProjectWork("client-1", "proj-1")).rejects.toThrow(ApiError);
    await expect(approveProjectWork("client-1", "proj-1")).rejects.toMatchObject({
      statusCode: 400,
      message: "No submitted work is awaiting your approval",
    });

    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("repeated approval attempt: should fail with 400 when payment is already RELEASED without active dispute", async () => {
    mockDb.project.findUnique.mockResolvedValue({
      ...baseProject,
      payment: {
        ...baseProject.payment,
        status: "RELEASED",
      },
    });
    mockDb.dispute.findFirst.mockResolvedValue(null);

    await expect(approveProjectWork("client-1", "proj-1")).rejects.toThrow(ApiError);
    await expect(approveProjectWork("client-1", "proj-1")).rejects.toMatchObject({
      statusCode: 400,
      message: "Escrow must be funded before approving work",
    });

    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("concurrent approval attempt: should throw 409 Conflict and abort when atomic payment claim loses race (count: 0)", async () => {
    mockDb.project.findUnique.mockResolvedValue(baseProject);
    mockDb.dispute.findFirst.mockResolvedValue(null);
    mockDb.engineerProfile.findUnique.mockResolvedValue(engineerProfile);
    mockTx.wallet.findUnique.mockResolvedValue({ id: 1, userId: "eng-user-1", availableBalance: 0, pendingBalance: 0, heldByDispute: 0 });

    // Simulate losing the race: another concurrent request updated the payment status from FUNDED to RELEASED first
    mockTx.payment.updateMany.mockResolvedValue({ count: 0 });

    await expect(approveProjectWork("client-1", "proj-1")).rejects.toThrow(ApiError);
    await expect(approveProjectWork("client-1", "proj-1")).rejects.toMatchObject({
      statusCode: 409,
      message: "Conflict: payment was already released or modified concurrently",
    });

    // Ensure wallet was NEVER credited
    expect(mockTx.wallet.update).not.toHaveBeenCalled();
    // Ensure ledger was NEVER recorded
    expect(mockTx.paymentLedgerEntry.createMany).not.toHaveBeenCalled();
    // Ensure walletTransaction was NEVER created
    expect(mockTx.walletTransaction.create).not.toHaveBeenCalled();
  });

  it("concurrent dispute resolution: should throw 409 Conflict if dispute claim returns count: 0", async () => {
    const activeDispute = { id: 88, status: "OPEN" };
    mockDb.project.findUnique.mockResolvedValue({
      ...baseProject,
      payment: { ...baseProject.payment, status: "RELEASED" },
    });
    mockDb.dispute.findFirst.mockResolvedValue(activeDispute);
    mockDb.engineerProfile.findUnique.mockResolvedValue(engineerProfile);
    mockTx.wallet.findUnique.mockResolvedValue({ id: 1, userId: "eng-user-1", heldByDispute: 900 });

    // Concurrent request already resolved the dispute
    mockTx.dispute.updateMany.mockResolvedValue({ count: 0 });

    await expect(approveProjectWork("client-1", "proj-1")).rejects.toThrow(ApiError);
    await expect(approveProjectWork("client-1", "proj-1")).rejects.toMatchObject({
      statusCode: 409,
      message: "Conflict: dispute was already resolved concurrently",
    });

    expect(mockTx.wallet.updateMany).not.toHaveBeenCalled();
  });

  it("insufficient heldByDispute balance: should throw 409 Conflict if wallet held funds do not cover release", async () => {
    const activeDispute = { id: 88, status: "OPEN" };
    mockDb.project.findUnique.mockResolvedValue({
      ...baseProject,
      payment: { ...baseProject.payment, status: "RELEASED" },
    });
    mockDb.dispute.findFirst.mockResolvedValue(activeDispute);
    mockDb.engineerProfile.findUnique.mockResolvedValue(engineerProfile);
    mockTx.wallet.findUnique.mockResolvedValue({ id: 1, userId: "eng-user-1", heldByDispute: 100 }); // only 100, needs 900

    mockTx.dispute.updateMany.mockResolvedValue({ count: 1 });
    // Conditional update fails because heldByDispute is less than 900
    mockTx.wallet.updateMany.mockResolvedValue({ count: 0 });

    await expect(approveProjectWork("client-1", "proj-1")).rejects.toThrow(ApiError);
    await expect(approveProjectWork("client-1", "proj-1")).rejects.toMatchObject({
      statusCode: 409,
      message: "Conflict: insufficient heldByDispute balance to release",
    });
  });
});
