import { test, expect } from "@playwright/test";

const API_BASE = process.env.CLINKA_BACKEND_URL ?? "http://localhost:5000";

test.describe("Payout Flow Security", () => {
  test("create withdrawal requires auth", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/users/me/withdrawals/create`, {
      data: { amount: 100, method: "INSTAPAY", accountNumber: "123" },
    });
    expect(res.status()).toBe(401);
  });

  test("reveal withdrawal bank details requires admin auth", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/admin/withdrawals/1/reveal-bank-details`);
    expect(res.status()).toBe(401);
  });

  test("reject withdrawal requires admin auth", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/admin/withdrawals/1/reject`, {
      data: { reason: "test" },
    });
    expect(res.status()).toBe(401);
  });

  test("complete withdrawal requires admin auth", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/admin/withdrawals/1/complete`, {
      data: { transferReference: "ref123" },
    });
    expect(res.status()).toBe(401);
  });
});
