import { test, expect } from "@playwright/test";

const API_BASE = process.env.CLINKA_BACKEND_URL ?? "http://127.0.0.1:5000";

test.describe("Admin Logs Security", () => {
  test("get system logs requires admin auth", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/admin/system-logs`);
    expect(res.status()).toBe(401);
  });

  test("get audit trail requires admin auth", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/admin/withdrawals/1/audit`);
    expect(res.status()).toBe(401);
  });
});
