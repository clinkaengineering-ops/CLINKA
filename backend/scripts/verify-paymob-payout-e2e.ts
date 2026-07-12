/**
 * End-to-end Paymob Payout verification script.
 * Run: npx ts-node scripts/verify-paymob-payout-e2e.ts
 */
import { loadEnv } from "../src/config/loadEnv";
loadEnv();

import db from "../src/config/db";
import {
  getPaymobPayoutAccessToken,
  createPaymobInstantCashin,
  inquirePaymobPayoutTransactions,
} from "../src/modules/payments/paymob.payout.api";
import { isPaymobPayoutConfigured, getPaymobPayoutConfig } from "../src/config/paymob";
import { createPaymobPayout as createEngineerPayout } from "../src/modules/payouts/payout.service";
import { ensureWallet } from "../src/utils/wallet";

const TEST_ENGINEER_USER_ID = Number(process.env.PAYOUT_E2E_USER_ID ?? "7");
const TEST_MSISDN = "01023456789";
const TEST_NATIONAL_ID = "29005270102927";
const TEST_AMOUNT = 50;

type StepResult = { step: string; ok: boolean; detail: string };

const results: StepResult[] = [];

function pass(step: string, detail: string) {
  results.push({ step, ok: true, detail });
  console.log(`✅ ${step}: ${detail}`);
}

function fail(step: string, detail: string): never {
  results.push({ step, ok: false, detail });
  console.error(`❌ ${step}: ${detail}`);
  throw new Error(`${step} failed: ${detail}`);
}

async function testConfiguration() {
  if (!isPaymobPayoutConfigured()) {
    fail("Configuration", "Paymob payout credentials missing in .env");
  }
  const config = getPaymobPayoutConfig();
  pass(
    "Configuration",
    `baseUrl=${config.baseUrl}, username=${config.username}, maxAmount=${config.maxWithdrawalAmount}`,
  );
}

async function testOAuthToken() {
  const token = await getPaymobPayoutAccessToken();
  if (!token || token.length < 10) {
    fail("OAuth token", "Empty or invalid access token");
  }
  pass("OAuth token", `Received bearer token (${token.slice(0, 8)}…)`);
}

async function testDirectDisburse() {
  const ref = `clinka-verify-${Date.now()}`;
  const result = await createPaymobInstantCashin({
    issuer: "vodafone",
    amount: TEST_AMOUNT,
    nationalId: TEST_NATIONAL_ID,
    msisdn: TEST_MSISDN,
    clientReference: ref,
  });

  if (!result.transactionId) {
    fail("Direct disburse", `No transaction_id — ${result.statusDescription}`);
  }
  if (result.disbursementStatus.toLowerCase() !== "success" &&
      result.disbursementStatus.toLowerCase() !== "successful") {
    fail(
      "Direct disburse",
      `Unexpected status ${result.disbursementStatus}: ${result.statusDescription}`,
    );
  }
  pass(
    "Direct disburse",
    `txn=${result.transactionId}, status=${result.disbursementStatus}`,
  );
  return { transactionId: result.transactionId!, clientReference: ref };
}

async function testInquiry(ids: { transactionId: string; clientReference: string }) {
  const inquiry = await inquirePaymobPayoutTransactions([
    ids.transactionId,
    ids.clientReference,
  ]);
  if (inquiry.results.length === 0) {
    fail("Transaction inquiry", "No results returned for transaction");
  }
  const match = inquiry.results.find((r) => r.transactionId === ids.transactionId);
  if (!match) {
    fail("Transaction inquiry", "Transaction not found in inquiry results");
  }
  pass(
    "Transaction inquiry",
    `Found ${inquiry.results.length} result(s), status=${match!.disbursementStatus}`,
  );
}

async function prepareEngineerWallet() {
  const user = await db.user.findUnique({
    where: { id: TEST_ENGINEER_USER_ID },
    include: { profile: true },
  });
  if (!user || user.role !== "ENGINEER") {
    fail("Engineer setup", `User ${TEST_ENGINEER_USER_ID} is not an engineer`);
  }

  if (!user.profile?.nationalId) {
    await db.engineerProfile.update({
      where: { userId: TEST_ENGINEER_USER_ID },
      data: { nationalId: TEST_NATIONAL_ID },
    });
    pass("Engineer setup", `Set nationalId on user ${TEST_ENGINEER_USER_ID}`);
  } else {
    pass("Engineer setup", `User ${user.email} has nationalId`);
  }

  await db.$transaction(async (tx) => {
    const wallet = await ensureWallet(tx, TEST_ENGINEER_USER_ID);
    const current = Number(wallet.availableBalance);
    if (current < TEST_AMOUNT + 10) {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { availableBalance: TEST_AMOUNT + 100 },
      });
      pass(
        "Engineer wallet",
        `Credited wallet to ${TEST_AMOUNT + 100} (was ${current})`,
      );
    } else {
      pass("Engineer wallet", `Available balance \${current} — sufficient`);
    }
  });
}

async function testPayoutServiceFlow() {
  const idempotencyKey = `e2e-${Date.now()}`;
  const withdrawal = await createEngineerPayout(
    TEST_ENGINEER_USER_ID,
    {
      amount: TEST_AMOUNT,
      channel: "mobile_wallet",
      msisdn: TEST_MSISDN,
    },
    { idempotencyKey },
  );

  if (withdrawal.status !== "COMPLETED" && withdrawal.status !== "PROCESSING") {
    fail(
      "Payout service",
      `Status=${withdrawal.status}, reason=${withdrawal.failureReason ?? withdrawal.paymobStatusDescription}`,
    );
  }
  if (!withdrawal.paymobTransactionId) {
    fail("Payout service", "Missing paymobTransactionId on withdrawal");
  }

  const auditCount = await db.payoutAuditLog.count({
    where: { withdrawalId: withdrawal.id },
  });
  if (auditCount < 3) {
    fail("Payout service", `Expected audit trail entries, got ${auditCount}`);
  }

  pass(
    "Payout service",
    `withdrawal #${withdrawal.id} → ${withdrawal.status}, paymob=${withdrawal.paymobTransactionId}, audit=${auditCount} events`,
  );

  // Idempotency replay
  const replay = await createEngineerPayout(
    TEST_ENGINEER_USER_ID,
    {
      amount: TEST_AMOUNT,
      channel: "mobile_wallet",
      msisdn: TEST_MSISDN,
    },
    { idempotencyKey },
  );
  if (replay.id !== withdrawal.id) {
    fail("Idempotency", `Replay created new withdrawal #${replay.id} instead of #${withdrawal.id}`);
  }
  pass("Idempotency", `Replay returned same withdrawal #${withdrawal.id}`);

  return withdrawal;
}

async function testIdempotencyHeaderSimulation() {
  const key = `header-e2e-${Date.now()}`;
  const w1 = await createEngineerPayout(
    TEST_ENGINEER_USER_ID,
    { amount: 10, channel: "mobile_wallet", msisdn: TEST_MSISDN },
    { idempotencyKey: key },
  );
  const w2 = await createEngineerPayout(
    TEST_ENGINEER_USER_ID,
    { amount: 10, channel: "mobile_wallet", msisdn: TEST_MSISDN },
    { idempotencyKey: key },
  );
  if (w1.id !== w2.id) {
    fail("Idempotency header path", "Duplicate key created second withdrawal");
  }
  pass("Idempotency header path", `Single withdrawal #${w1.id} for key ${key}`);
}

async function main() {
  console.log("\n=== Paymob Payout E2E Verification ===\n");

  await testConfiguration();
  await testOAuthToken();
  const ids = await testDirectDisburse();
  await testInquiry(ids);
  await prepareEngineerWallet();
  await testPayoutServiceFlow();
  await testIdempotencyHeaderSimulation();

  const failed = results.filter((r) => !r.ok);
  console.log("\n=== Summary ===");
  console.log(`Passed: ${results.filter((r) => r.ok).length}/${results.length}`);
  if (failed.length > 0) {
    console.error("FAILED STEPS:", failed);
    process.exit(1);
  }
  console.log("\n🎉 All Paymob payout checks passed.\n");
}

main()
  .catch((err) => {
    console.error("\n💥 Verification aborted:", err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
