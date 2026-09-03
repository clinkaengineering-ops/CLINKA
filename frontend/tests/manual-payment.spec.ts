import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers/devtunnel";

const API_BASE = process.env.CLINKA_BACKEND_URL ?? "http://localhost:5000";

test.describe("Manual Payment Security", () => {
  test("submit manual payment requires auth", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/payments/manual/submit`, {
      data: {
        paymentId: 1,
        paymentMethod: "bank_transfer",
        transactionReference: "test-ref",
      },
    });
    expect(res.status()).toBe(401);
  });

  test("manual payment settings requires auth", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/payments/manual-settings`);
    expect(res.status()).toBe(401);
  });
});
