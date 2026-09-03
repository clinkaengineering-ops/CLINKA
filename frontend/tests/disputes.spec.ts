import { test, expect } from "@playwright/test";

const API_BASE = process.env.CLINKA_BACKEND_URL ?? "http://127.0.0.1:5000";

test.describe("Disputes Security & API", () => {
  test("open dispute requires auth", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/disputes/open`, {
      data: {
        projectId: 1,
        reason: "Issue with the delivery",
      },
    });
    expect(res.status()).toBe(401);
  });

  test("resolve dispute requires admin auth", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/disputes/resolve`, {
      data: {
        projectId: 1,
        resolution: "CLIENT",
        reason: "Admin decision",
      },
    });
    expect(res.status()).toBe(401);
  });

  test("manual freeze requires admin auth", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/disputes/manual-freeze`, {
      data: {
        engineerId: 2,
        amount: 100,
        reason: "Holding funds",
      },
    });
    expect(res.status()).toBe(401);
  });
});
