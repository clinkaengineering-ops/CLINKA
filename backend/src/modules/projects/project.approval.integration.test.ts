import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import db from "../../config/db";
import { approveProjectWork } from "./project.workflow.service";

describe("Escrow Release & Project Approval Concurrency (Real PostgreSQL)", () => {
  let clientId: string;
  let engineerId: string;
  let engineerProfileId: number;
  let walletId: number;

  const createdProjectIds: string[] = [];
  const createdPaymentIds: number[] = [];
  const createdDisputeIds: number[] = [];

  before(async () => {
    // 1. Create client and engineer in real PostgreSQL
    const client = await db.user.create({
      data: {
        email: `client_concurrency_${Date.now()}@test.com`,
        password: "hashedpassword123",
        name: "Concurrency Client",
        role: "CLIENT",
      },
    });
    clientId = client.id;

    const engineer = await db.user.create({
      data: {
        email: `eng_concurrency_${Date.now()}@test.com`,
        password: "hashedpassword123",
        name: "Concurrency Engineer",
        role: "ENGINEER",
      },
    });
    engineerId = engineer.id;

    const profile = await db.engineerProfile.create({
      data: {
        userId: engineerId,
        specialty: "CIVIL",
        bio: "Concurrency Test Engineer",
      },
    });
    engineerProfileId = profile.id;

    const wallet = await db.wallet.create({
      data: {
        userId: engineerId,
        availableBalance: 0,
        pendingBalance: 0,
        heldByDispute: 0,
      },
    });
    walletId = wallet.id;
  });

  after(async () => {
    // Teardown test entities safely
    if (createdDisputeIds.length > 0) {
      await db.dispute.deleteMany({ where: { id: { in: createdDisputeIds } } });
    }
    if (createdPaymentIds.length > 0) {
      await db.paymentLedgerEntry.deleteMany({ where: { paymentId: { in: createdPaymentIds } } });
      await db.walletTransaction.deleteMany({ where: { relatedPaymentId: { in: createdPaymentIds } } });
      await db.payment.deleteMany({ where: { id: { in: createdPaymentIds } } });
    }
    if (createdProjectIds.length > 0) {
      await db.projectDeliverable.deleteMany({
        where: { submission: { projectId: { in: createdProjectIds } } },
      });
      await db.projectSubmission.deleteMany({ where: { projectId: { in: createdProjectIds } } });
      await db.bid.deleteMany({ where: { projectId: { in: createdProjectIds } } });
      await db.systemAuditLog.deleteMany({ where: { targetId: { in: createdProjectIds } } });
      await db.project.deleteMany({ where: { id: { in: createdProjectIds } } });
    }
    await db.walletTransaction.deleteMany({ where: { walletId } });
    await db.wallet.deleteMany({ where: { id: walletId } });
    await db.notification.deleteMany({ where: { userId: { in: [clientId, engineerId] } } });
    await db.engineerProfile.deleteMany({ where: { id: engineerProfileId } });
    await db.user.deleteMany({ where: { id: { in: [clientId, engineerId] } } });
  });

  it("1. Sequential repeated approval: second approval fails, wallet and ledger are credited exactly once", async () => {
    const project = await db.project.create({
      data: {
        clientId,
        title: "Sequential Approval Project",
        description: "Test repeated approvals",
        budget: 500,
        serviceType: "DESIGN",
        status: "SUBMITTED_FOR_REVIEW",
        deliveredAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // > 7 days ago (matured)
      },
    });
    createdProjectIds.push(project.id);

    const payment = await db.payment.create({
      data: {
        projectId: project.id,
        clientId,
        engineerId: engineerProfileId,
        amountUsd: 500,
        amountEgp: 25000,
        exchangeRate: 50,
        commission: 50,
        status: "FUNDED",
      },
    });
    createdPaymentIds.push(payment.id);

    // Initial approval should succeed
    const firstResult = await approveProjectWork(clientId, project.id);
    assert.equal(firstResult.status, "RELEASED");

    // Check project status updated to COMPLETED
    const updatedProj = await db.project.findUniqueOrThrow({ where: { id: project.id } });
    assert.equal(updatedProj.status, "COMPLETED");

    // Second approval attempt should be rejected with 400
    await assert.rejects(
      async () => {
        await approveProjectWork(clientId, project.id);
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        return true;
      }
    );

    // Verify wallet: exactly $450 credited to availableBalance (net of $50 commission)
    const wallet = await db.wallet.findUniqueOrThrow({ where: { id: walletId } });
    assert.equal(wallet.availableBalance.toNumber(), 450);
    assert.equal(wallet.pendingBalance.toNumber(), 0);

    // Verify ledger: exactly 2 entries (1 RELEASED, 1 PLATFORM_COMMISSION)
    const ledger = await db.paymentLedgerEntry.findMany({ where: { paymentId: payment.id } });
    assert.equal(ledger.length, 2);
    const releasedLedger = ledger.filter((l) => l.type === "RELEASED");
    assert.equal(releasedLedger.length, 1);
    assert.equal(releasedLedger[0].amount.toNumber(), 450);

    // Verify wallet transactions: exactly 1 transaction
    const txs = await db.walletTransaction.findMany({ where: { relatedPaymentId: payment.id } });
    assert.equal(txs.length, 1);
    assert.equal(txs[0].amount.toNumber(), 450);
  });

  it("2. Concurrent approval attempts: exactly one request succeeds and the other fails with 409 Conflict", async () => {
    const project = await db.project.create({
      data: {
        clientId,
        title: "Concurrent Approval Race Project",
        description: "Test concurrent race on approveProjectWork",
        budget: 1000,
        serviceType: "DESIGN",
        status: "SUBMITTED_FOR_REVIEW",
        deliveredAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // matured
      },
    });
    createdProjectIds.push(project.id);

    const payment = await db.payment.create({
      data: {
        projectId: project.id,
        clientId,
        engineerId: engineerProfileId,
        amountUsd: 1000,
        amountEgp: 50000,
        exchangeRate: 50,
        commission: 100,
        status: "FUNDED",
      },
    });
    createdPaymentIds.push(payment.id);

    const walletBefore = await db.wallet.findUniqueOrThrow({ where: { id: walletId } });
    const initialAvailable = walletBefore.availableBalance.toNumber();

    // Fire 2 concurrent approval requests simultaneously
    const results = await Promise.allSettled([
      approveProjectWork(clientId, project.id),
      approveProjectWork(clientId, project.id),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // Exactly one must succeed
    assert.equal(fulfilled.length, 1, "Exactly one concurrent approval must fulfill");
    assert.equal(rejected.length, 1, "The competing concurrent approval must be rejected");

    const rejectionReason = (rejected[0] as PromiseRejectedResult).reason;
    // The rejected request must be 409 Conflict or 400
    assert.ok(
      rejectionReason.statusCode === 409 || rejectionReason.statusCode === 400,
      `Expected status 409 or 400, got ${rejectionReason.statusCode}: ${rejectionReason.message}`
    );

    // Verify database state: wallet credited by net $900 ONCE
    const walletAfter = await db.wallet.findUniqueOrThrow({ where: { id: walletId } });
    assert.equal(walletAfter.availableBalance.toNumber(), initialAvailable + 900);

    // Verify ledger: exactly one RELEASED entry for this payment
    const ledger = await db.paymentLedgerEntry.findMany({
      where: { paymentId: payment.id, type: "RELEASED" },
    });
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0].amount.toNumber(), 900);

    // Verify walletTransaction: exactly one for this payment
    const txs = await db.walletTransaction.findMany({
      where: { relatedPaymentId: payment.id },
    });
    assert.equal(txs.length, 1);
    assert.equal(txs[0].amount.toNumber(), 900);
  });

  it("3. Concurrent approval with active dispute: resolves dispute and prevents negative heldByDispute", async () => {
    const project = await db.project.create({
      data: {
        clientId,
        title: "Concurrent Dispute Approval Project",
        description: "Test concurrent dispute claim",
        budget: 600,
        serviceType: "DESIGN",
        status: "SUBMITTED_FOR_REVIEW",
        deliveredAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
    });
    createdProjectIds.push(project.id);

    const payment = await db.payment.create({
      data: {
        projectId: project.id,
        clientId,
        engineerId: engineerProfileId,
        amountUsd: 600,
        amountEgp: 30000,
        exchangeRate: 50,
        commission: 60,
        status: "RELEASED",
      },
    });
    createdPaymentIds.push(payment.id);

    const dispute = await db.dispute.create({
      data: {
        projectId: project.id,
        openedById: clientId,
        reason: "Test dispute",
        status: "OPEN",
      },
    });
    createdDisputeIds.push(dispute.id);

    // Set heldByDispute to exact net amount: $540
    await db.wallet.update({
      where: { id: walletId },
      data: { heldByDispute: 540 },
    });

    const walletBefore = await db.wallet.findUniqueOrThrow({ where: { id: walletId } });
    const initialAvailable = walletBefore.availableBalance.toNumber();

    // Fire 2 concurrent approval attempts
    const results = await Promise.allSettled([
      approveProjectWork(clientId, project.id),
      approveProjectWork(clientId, project.id),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    assert.equal(fulfilled.length, 1, "Exactly one approval must win the dispute claim");
    assert.equal(rejected.length, 1, "The second concurrent attempt must fail");

    const rejectionReason = (rejected[0] as PromiseRejectedResult).reason;
    assert.ok(
      rejectionReason.statusCode === 409 || rejectionReason.statusCode === 400,
      `Expected status 409 or 400, got ${rejectionReason.statusCode}`
    );

    // Verify wallet: heldByDispute decremented to 0, NEVER negative
    const walletAfter = await db.wallet.findUniqueOrThrow({ where: { id: walletId } });
    assert.equal(walletAfter.heldByDispute.toNumber(), 0);
    assert.ok(walletAfter.heldByDispute.toNumber() >= 0);
    assert.equal(walletAfter.availableBalance.toNumber(), initialAvailable + 540);

    // Verify dispute status
    const disputeAfter = await db.dispute.findUniqueOrThrow({ where: { id: dispute.id } });
    assert.equal(disputeAfter.status, "RESOLVED_ENGINEER");
  });
});
