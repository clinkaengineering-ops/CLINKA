import crypto from "node:crypto";
import { verifyPaymobPayoutHmac, isWebhookReplayed } from "./modules/payments/paymob.webhook";

async function runTests() {
  console.log("=== Running Paymob Webhook Crypto Tests ===");
  
  // Test 1: Replay Attack Simulation
  console.log("\n[Test 1] Replay Attack Simulation");
  const oldDate = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago
  const isReplayed = isWebhookReplayed(oldDate, 5);
  if (isReplayed) {
    console.log("✅ SUCCESS: 10-minute old webhook correctly flagged as replayed");
  } else {
    console.error("❌ FAIL: Old webhook not flagged as replayed");
  }

  const validDate = new Date(Date.now() - 2 * 60 * 1000).toISOString(); // 2 minutes ago
  const isReplayedValid = isWebhookReplayed(validDate, 5);
  if (!isReplayedValid) {
    console.log("✅ SUCCESS: 2-minute old webhook correctly accepted");
  } else {
    console.error("❌ FAIL: Valid webhook incorrectly flagged as replayed");
  }

  // Test 2: Invalid Signature Rejection
  console.log("\n[Test 2] Invalid Signature Rejection");
  const payload = {
    amount: "1000",
    client_reference: "ref_123",
    created_at: validDate,
    disbursement_status: "successful",
    issuer: "bank",
    transaction_id: "tx_999",
  };
  
  const hmacSecret = "supersecret";
  const hmacSecretPrev = "oldsecret";
  
  // Compute valid HMAC
  const fields = [
    payload.amount,
    payload.client_reference,
    payload.created_at,
    payload.disbursement_status,
    payload.issuer,
    payload.transaction_id,
  ];
  const payloadString = fields.join("");
  const validHmac = crypto.createHmac("sha512", hmacSecret).update(payloadString).digest("hex");
  const validHmacPrev = crypto.createHmac("sha512", hmacSecretPrev).update(payloadString).digest("hex");
  const tamperedHmac = "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

  const secrets = [hmacSecret, hmacSecretPrev];

  if (!verifyPaymobPayoutHmac(payload, tamperedHmac, secrets)) {
    console.log("✅ SUCCESS: Tampered HMAC correctly rejected before business logic");
  } else {
    console.error("❌ FAIL: Tampered HMAC incorrectly accepted");
  }

  // Test 3: Secret Rotation Verification
  console.log("\n[Test 3] Secret Rotation Verification");
  if (verifyPaymobPayoutHmac(payload, validHmac, secrets)) {
    console.log("✅ SUCCESS: Current HMAC Secret accepted");
  } else {
    console.error("❌ FAIL: Current HMAC Secret rejected");
  }

  if (verifyPaymobPayoutHmac(payload, validHmacPrev, secrets)) {
    console.log("✅ SUCCESS: Previous HMAC Secret accepted (zero-downtime rotation works)");
  } else {
    console.error("❌ FAIL: Previous HMAC Secret rejected");
  }
}

runTests().catch(console.error);
