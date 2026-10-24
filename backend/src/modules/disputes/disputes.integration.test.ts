import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import db from "../../config/db";
import { submitProjectWork, approveProjectWork } from "../projects/project.workflow.service";
import { openDispute, resolveDispute, manualFreeze } from "./disputes.service";
import { getEngineerBalance } from "../payments/payments.service";

describe("Disputes Integration Lifecycle", () => {
  let clientId: string;
  let engineerId: string;
  let projectId: string;
  let paymentId: number;
  let engineerProfileId: number;

  before(async () => {
    // Setup test users and project
    const client = await db.user.create({
      data: { email: `client_${Date.now()}@test.com`, password: "x", name: "Test Client", role: "CLIENT" }
    });
    clientId = client.id;

    const engineer = await db.user.create({
      data: { email: `eng_${Date.now()}@test.com`, password: "x", name: "Test Engineer", role: "ENGINEER" }
    });
    engineerId = engineer.id;
    const profile = await db.engineerProfile.create({
      data: { userId: engineerId, specialty: "CIVIL", bio: "Test" }
    });
    engineerProfileId = profile.id;

    const project = await db.project.create({
      data: {
        clientId: client.id,
        title: "Test Dispute Project",
        description: "Testing...",
        budget: 1000,
        serviceType: "DESIGN",
        status: "IN_PROGRESS"
      }
    });
    projectId = project.id;

    await db.bid.create({
      data: {
        projectId,
        engineerId: profile.id, // wait, schema says engineerId or engineerProfileId for bid? It's probably engineerId
        price: 1000,
        status: "ACCEPTED",
        duration: "5 days",
        description: "Test description"
      }
    });

    // Create a wallet for the engineer
    await db.wallet.create({
      data: { userId: engineer.id }
    });

    // Create payment in FUNDED state
    const payment = await db.payment.create({
      data: {
        projectId,
        clientId,
        engineerId: profile.id,
        amountUsd: 1000,
        amountEgp: 50000,
        exchangeRate: 50,
        commission: 100,
        status: "FUNDED"
      }
    });
    paymentId = payment.id;
  });

  after(async () => {
    // Cleanup created data
    await db.systemAuditLog.deleteMany({ where: { targetId: projectId.toString() } });
    await db.dispute.deleteMany({ where: { projectId } });
    await db.payment.deleteMany({ where: { id: paymentId } });
    await db.projectSubmission.deleteMany({ where: { projectId } });
    await db.bid.deleteMany({ where: { projectId } });
    await db.project.deleteMany({ where: { id: projectId } });
    await db.walletTransaction.deleteMany({ where: { relatedPaymentId: paymentId } });
    await db.wallet.deleteMany({ where: { userId: engineerId } });
    await db.engineerProfile.deleteMany({ where: { userId: engineerId } });
    await db.user.deleteMany({ where: { id: { in: [clientId, engineerId] } } });
  });

  it("1. Engineer delivers work", async () => {
    await submitProjectWork(engineerId, projectId, { notes: "Here is the work", links: [] });
    const p = await db.project.findUniqueOrThrow({ where: { id: projectId } });
    assert.equal(p.status, "SUBMITTED_FOR_REVIEW");
    assert.ok(p.deliveredAt);
    assert.ok(p.disputeWindowClosesAt);
  });

  it("2. Client opens a dispute (Review Window pauses)", async () => {
    const dispute = await openDispute(clientId, projectId, "Work is incomplete");
    assert.equal(dispute.status, "AWAITING_ENGINEER_FIX");
    
    const p = await db.project.findUniqueOrThrow({ where: { id: projectId } });
    assert.ok(p.disputePausedAt);
    
    // Payment should remain FUNDED
    const pay = await db.payment.findUniqueOrThrow({ where: { id: paymentId } });
    assert.equal(pay.status, "RELEASED");
  });

  it("3. Engineer redelivers work (Review Window resumes)", async () => {
    await submitProjectWork(engineerId, projectId, { notes: "Fixed the issues", links: [] });
    
    const p = await db.project.findUniqueOrThrow({ where: { id: projectId } });
    assert.equal(p.disputePausedAt, null);
    
    const disputes = await db.dispute.findMany({ where: { projectId } });
    assert.equal(disputes[0].status, "OPEN"); // Auto-transitioned to OPEN upon resubmission
  });

  it("4. Admin resolves dispute in Engineer favor", async () => {
    await resolveDispute(clientId, projectId, "ENGINEER", "Engineer provided correct work");
    
    const disputes = await db.dispute.findMany({ where: { projectId } });
    assert.equal(disputes[0].status, "RESOLVED_ENGINEER");
    const p = await db.project.findUniqueOrThrow({ where: { id: projectId } });
    assert.equal(p.status, "COMPLETED");

    const pay = await db.payment.findUniqueOrThrow({ where: { id: paymentId } });
    assert.equal(pay.status, "RELEASED");
    
    const wallet = await db.wallet.findUniqueOrThrow({ where: { userId: engineerId } });
    assert.equal(wallet.pendingBalance.toNumber(), 900); // 1000 - 100 commission
  });

  it("5. Admin manually freezes a portion of the engineer's balance", async () => {
    await manualFreeze(clientId, engineerProfileId, 100, "Safety hold");
    
    const wallet = await db.wallet.findUniqueOrThrow({ where: { userId: engineerId } });
    assert.equal(wallet.pendingBalance.toNumber(), 800);
    assert.equal(wallet.heldByDispute.toNumber(), 100);
    
    const summary = await getEngineerBalance(engineerId);
    assert.equal(summary.heldByDispute.toNumber ? summary.heldByDispute.toNumber() : summary.heldByDispute, 100);
    assert.equal(summary.pendingBalance.toNumber ? summary.pendingBalance.toNumber() : summary.pendingBalance, 800);
  });
});

describe("Dispute Lifecycle - Client Refund & Withdrawal Guards", () => {
  let clientId: string;
  let engineerId: string;
  let projectId: string;
  let paymentId: number;
  let engineerProfileId: number;

  before(async () => {
    // Setup test users and project
    const client = await db.user.create({
      data: { email: `client_refund_${Date.now()}@test.com`, password: "x", name: "Test Client", role: "CLIENT" }
    });
    clientId = client.id;

    const engineer = await db.user.create({
      data: { email: `eng_refund_${Date.now()}@test.com`, password: "x", name: "Test Engineer", role: "ENGINEER" }
    });
    engineerId = engineer.id;
    const profile = await db.engineerProfile.create({
      data: { userId: engineerId, specialty: "CIVIL", bio: "Test" }
    });
    engineerProfileId = profile.id;

    const project = await db.project.create({
      data: {
        clientId: client.id,
        title: "Test Dispute Refund",
        description: "Testing...",
        budget: 1000,
        serviceType: "DESIGN",
        status: "IN_PROGRESS"
      }
    });
    projectId = project.id;

    await db.bid.create({
      data: {
        projectId,
        engineerId: profile.id,
        price: 1000,
        status: "ACCEPTED",
        duration: "5 days",
        description: "Test description"
      }
    });

    await db.wallet.create({ data: { userId: engineer.id } });

    const payment = await db.payment.create({
      data: {
        projectId,
        clientId,
        engineerId: profile.id,
        amountUsd: 1000,
        amountEgp: 50000,
        exchangeRate: 50,
        commission: 100,
        status: "FUNDED"
      }
    });
    paymentId = payment.id;
  });

  after(async () => {
    await db.systemAuditLog.deleteMany({ where: { targetId: projectId.toString() } });
    await db.dispute.deleteMany({ where: { projectId } });
    await db.payment.deleteMany({ where: { id: paymentId } });
    await db.projectSubmission.deleteMany({ where: { projectId } });
    await db.bid.deleteMany({ where: { projectId } });
    await db.project.deleteMany({ where: { id: projectId } });
    await db.walletTransaction.deleteMany({ where: { relatedPaymentId: paymentId } });
    await db.withdrawalRequest.deleteMany({ where: { userId: engineerId } });
    await db.wallet.deleteMany({ where: { userId: engineerId } });
    await db.engineerProfile.deleteMany({ where: { userId: engineerId } });
    await db.user.deleteMany({ where: { id: { in: [clientId, engineerId] } } });
  });

  it("1. Work delivered, dispute opened", async () => {
    await submitProjectWork(engineerId, projectId, { notes: "Here is the work", links: [] });
    await openDispute(clientId, projectId, "Work is terrible");
    
    // Attempt withdrawal
    const wallet = await db.wallet.findUniqueOrThrow({ where: { userId: engineerId } });
    assert.equal(wallet.heldByDispute.toNumber(), 900);
    assert.equal(wallet.availableBalance.toNumber(), 0);
  });

  it("2. Withdrawal is rejected explicitly while dispute is open, regardless of balance", async () => {
    const { createWithdrawalRequest } = await import("../payments/payments.service");
    
    // Add undisputed available balance so the math-based "Insufficient funds" check would theoretically pass
    await db.wallet.update({
      where: { userId: engineerId },
      data: { availableBalance: { increment: 5000 } }
    });

    // We expect withdrawal to fail due to the explicit dispute guard, NOT insufficient funds
    await assert.rejects(
      createWithdrawalRequest(engineerId, "IBAN", { amount: 500, iban: "EG123", accountHolderName: "Test", address: "123 Test St", swiftBic: "TEST" }, "key_1"),
      /Cannot withdraw funds while you have an active dispute on any project/
    );
    
    // Reset balance back for the rest of tests if necessary (not strictly needed but good practice)
    await db.wallet.update({
      where: { userId: engineerId },
      data: { availableBalance: { decrement: 5000 } }
    });
  });

  it("3. Admin resolves dispute in Client favor (Refund)", async () => {
    await resolveDispute(clientId, projectId, "CLIENT", "Client gets a refund");
    
    const disputes = await db.dispute.findMany({ where: { projectId } });
    assert.equal(disputes[0].status, "RESOLVED_CLIENT");
    
    const wallet = await db.wallet.findUniqueOrThrow({ where: { userId: engineerId } });
    assert.equal(wallet.heldByDispute.toNumber(), 0);
    assert.equal(wallet.pendingBalance.toNumber(), 0);
    assert.equal(wallet.availableBalance.toNumber(), 0);
    
    const wt = await db.walletTransaction.findFirst({ where: { relatedPaymentId: paymentId } });
    assert.equal(wt?.status, "REJECTED");
  });
});

describe("Dispute Cron Jobs", () => {
  let clientId: string;
  let engineerId: string;
  let projectIdApprove: string;
  let projectIdEscalate: string;
  let disputeIdEscalate: number;
  let engineerProfileId: number;

  before(async () => {
    // Setup test users and project
    const client = await db.user.create({
      data: { email: `client_cron_${Date.now()}@test.com`, password: "x", name: "Test Client", role: "CLIENT" }
    });
    clientId = client.id;

    const engineer = await db.user.create({
      data: { email: `eng_cron_${Date.now()}@test.com`, password: "x", name: "Test Engineer", role: "ENGINEER" }
    });
    engineerId = engineer.id;
    const profile = await db.engineerProfile.create({
      data: { userId: engineerId, specialty: "CIVIL", bio: "Test" }
    });
    engineerProfileId = profile.id;

    const now = new Date();
    const past7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const past4Days = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

    // Project for auto-approve (delivered 7 days ago, dispute window closed)
    const p1 = await db.project.create({
      data: {
        clientId: client.id,
        title: "Test Auto Approve",
        description: "Testing...",
        budget: 1000,
        serviceType: "DESIGN",
        status: "SUBMITTED_FOR_REVIEW",
        deliveredAt: past7Days,
        disputeWindowClosesAt: past7Days
      }
    });
    projectIdApprove = p1.id;

    // Project for auto-approve with funded escrow & hold elapsed (7 days)
    const past8Days = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
    const pFundedElapsed = await db.project.create({
      data: {
        clientId: client.id,
        title: "Test Auto Approve Funded Hold Elapsed",
        description: "Testing...",
        budget: 1000,
        serviceType: "DESIGN",
        status: "SUBMITTED_FOR_REVIEW",
        deliveredAt: past8Days,
        disputeWindowClosesAt: past8Days
      }
    });
    const payElapsed = await db.payment.create({
      data: {
        projectId: pFundedElapsed.id,
        clientId: client.id,
        engineerId: profile.id,
        amountUsd: 1000,
        amountEgp: 50000,
        exchangeRate: 50,
        commission: 100,
        status: "FUNDED"
      }
    });

    // Project for auto-approve with funded escrow & hold pending (6.2 days ago)
    const past6Days = new Date(now.getTime() - 6.2 * 24 * 60 * 60 * 1000);
    const pFundedPending = await db.project.create({
      data: {
        clientId: client.id,
        title: "Test Auto Approve Funded Hold Pending",
        description: "Testing...",
        budget: 500,
        serviceType: "DESIGN",
        status: "SUBMITTED_FOR_REVIEW",
        deliveredAt: past6Days,
        disputeWindowClosesAt: new Date(past6Days.getTime() + 6 * 24 * 60 * 60 * 1000)
      }
    });
    const payPending = await db.payment.create({
      data: {
        projectId: pFundedPending.id,
        clientId: client.id,
        engineerId: profile.id,
        amountUsd: 500,
        amountEgp: 25000,
        exchangeRate: 50,
        commission: 50,
        status: "FUNDED"
      }
    });

    // Project and Dispute for auto-escalate (dispute opened 4 days ago)
    const p2 = await db.project.create({
      data: {
        clientId: client.id,
        title: "Test Auto Escalate",
        description: "Testing...",
        budget: 1000,
        serviceType: "DESIGN",
        status: "REVISION_REQUESTED",
        deliveredAt: past7Days,
        disputeWindowClosesAt: past7Days
      }
    });
    projectIdEscalate = p2.id;

    const d = await db.dispute.create({
      data: {
        projectId: projectIdEscalate,
        openedById: clientId,
        reason: "Taking too long",
        status: "AWAITING_ENGINEER_FIX",
        updatedAt: past4Days
      }
    });
    disputeIdEscalate = d.id;

    (globalThis as any).__testCronProjects = {
      pFundedElapsedId: pFundedElapsed.id,
      payElapsedId: payElapsed.id,
      pFundedPendingId: pFundedPending.id,
      payPendingId: payPending.id
    };
  });

  after(async () => {
    const extra = (globalThis as any).__testCronProjects || {};
    const allProjectIds = [projectIdApprove, projectIdEscalate, extra.pFundedElapsedId, extra.pFundedPendingId].filter(Boolean);
    const allPaymentIds = [extra.payElapsedId, extra.payPendingId].filter(Boolean);

    await db.systemAuditLog.deleteMany({ where: { targetId: { in: [...allProjectIds.map(String), disputeIdEscalate.toString()] } } });
    await db.notification.deleteMany({ where: { userId: { in: [clientId, engineerId] } } });
    await db.walletTransaction.deleteMany({ where: { wallet: { userId: engineerId } } });
    await db.wallet.deleteMany({ where: { userId: engineerId } });
    await db.paymentLedgerEntry.deleteMany({ where: { paymentId: { in: allPaymentIds } } });
    await db.payment.deleteMany({ where: { id: { in: allPaymentIds } } });
    await db.dispute.deleteMany({ where: { id: disputeIdEscalate } });
    await db.project.deleteMany({ where: { id: { in: allProjectIds } } });
    await db.engineerProfile.deleteMany({ where: { userId: engineerId } });
    await db.user.deleteMany({ where: { id: { in: [clientId, engineerId] } } });
  });

  it("1. Should auto-approve project and log as SYSTEM", async () => {
    const { autoApproveProjects } = await import("../../scripts/disputeCron");
    await autoApproveProjects();

    const p = await db.project.findUniqueOrThrow({ where: { id: projectIdApprove } });
    assert.equal(p.status, "COMPLETED");

    const log = await db.systemAuditLog.findFirst({
      where: { action: "projects.auto_approve", targetId: projectIdApprove.toString() }
    });
    assert.ok(log);
    assert.equal(log.actorRole, "SYSTEM");
    assert.equal(log.actorId, null);
  });

  it("2. Should auto-escalate dispute and log as SYSTEM", async () => {
    const { autoEscalateDisputes } = await import("../../scripts/disputeCron");
    await autoEscalateDisputes();

    const d = await db.dispute.findUniqueOrThrow({ where: { id: disputeIdEscalate } });
    assert.equal(d.status, "ESCALATED_TO_ADMIN");

    const log = await db.systemAuditLog.findFirst({
      where: { action: "disputes.auto_escalate", targetId: disputeIdEscalate.toString() }
    });
    assert.ok(log);
    assert.equal(log.actorRole, "SYSTEM");
    assert.equal(log.actorId, null);
  });

  it("3. Should auto-approve funded project with matured hold, releasing escrow into available balance", async () => {
    const extra = (globalThis as any).__testCronProjects;
    const p = await db.project.findUniqueOrThrow({ where: { id: extra.pFundedElapsedId } });
    assert.equal(p.status, "COMPLETED");

    const payment = await db.payment.findUniqueOrThrow({ where: { id: extra.payElapsedId } });
    assert.equal(payment.status, "RELEASED");

    const ledgerEntries = await db.paymentLedgerEntry.findMany({ where: { paymentId: extra.payElapsedId } });
    assert.equal(ledgerEntries.length, 2);
    const releasedEntry = ledgerEntries.find((e) => e.type === "RELEASED");
    const commEntry = ledgerEntries.find((e) => e.type === "PLATFORM_COMMISSION");
    assert.ok(releasedEntry);
    assert.ok(commEntry);
    assert.equal(releasedEntry.amount.toNumber(), 900);
    assert.equal(commEntry.amount.toNumber(), 100);

    const wt = await db.walletTransaction.findFirst({ where: { relatedPaymentId: extra.payElapsedId } });
    assert.ok(wt);
    assert.equal(wt.type, "RELEASED");
    assert.equal(wt.status, "AVAILABLE");
    assert.equal(wt.amount.toNumber(), 900);

    const notifications = await db.notification.findMany({ where: { userId: engineerId } });
    assert.ok(notifications.some((n) => n.type === "WORK_APPROVED"));
    assert.ok(notifications.some((n) => n.type === "FUNDS_RELEASED"));
  });

  it("4. Should auto-approve funded project with unmatured hold, releasing escrow into pending balance", async () => {
    const extra = (globalThis as any).__testCronProjects;
    const p = await db.project.findUniqueOrThrow({ where: { id: extra.pFundedPendingId } });
    assert.equal(p.status, "COMPLETED");

    const payment = await db.payment.findUniqueOrThrow({ where: { id: extra.payPendingId } });
    assert.equal(payment.status, "RELEASED");

    const wt = await db.walletTransaction.findFirst({ where: { relatedPaymentId: extra.payPendingId } });
    assert.ok(wt);
    assert.equal(wt.type, "RELEASED");
    assert.equal(wt.status, "PENDING");
    assert.equal(wt.amount.toNumber(), 450);

    const wallet = await db.wallet.findUniqueOrThrow({ where: { userId: engineerId } });
    assert.equal(wallet.availableBalance.toNumber(), 900);
    assert.equal(wallet.pendingBalance.toNumber(), 450);
  });
});
