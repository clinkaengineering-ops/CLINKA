import { test, expect } from "@playwright/test";

const API_BASE = process.env.CLINKA_BACKEND_URL ?? "http://127.0.0.1:5000";

test.describe("Admin Payment Review Security", () => {
  test("verify manual payment requires admin auth", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/admin/payments/manual/1/verify`);
    expect(res.status()).toBe(401);
  });

  test("reject manual payment requires admin auth", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/admin/payments/manual/1/reject`, {
      data: { reason: "test" },
    });
    expect(res.status()).toBe(401);
  });

  test("override escrow payment requires admin auth", async ({ request }) => {
    const res = await request.patch(`${API_BASE}/api/admin/payments/1/override`, {
      data: { status: "RELEASED" },
    });
    expect(res.status()).toBe(401);
  });
});
