import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers/devtunnel";

const API_BASE =
  process.env.CLINKA_BACKEND_URL ?? "http://127.0.0.1:5000";

test.describe("Backend API smoke tests", () => {
  test("health endpoint", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("public landing snapshot", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/public/landing`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  test("support contact", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/public/support-contact`);
    expect(res.ok()).toBeTruthy();
  });

  test("login rejects invalid credentials", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: "nonexistent@test.com", password: "wrongpassword123" },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("register client validates input", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/register/client`, {
      data: { email: "not-an-email", password: "short" },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("projects list is public", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/projects`);
    expect(res.ok()).toBeTruthy();
  });

  test("engineers list is public", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/users/engineers`);
    expect(res.ok()).toBeTruthy();
  });

  test("protected routes require auth", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/users/me`);
    expect(res.status()).toBe(401);
  });
});

test.describe("Frontend ↔ Backend integration", () => {
  test("homepage loads without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await gotoApp(page, "/");
    await page.waitForTimeout(3000);

    const critical = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("404"),
    );
    expect(critical).toEqual([]);
  });

  test("projects page fetches data", async ({ page }) => {
    await gotoApp(page, "/projects");
    await expect(page.locator("body")).not.toContainText(/developer tunnel/i);
    await expect(page.locator("body")).toBeVisible();
  });

  test("engineers page loads", async ({ page }) => {
    await gotoApp(page, "/engineers");
    await expect(page.locator("body")).not.toContainText(/developer tunnel/i);
    await expect(page.locator("body")).toBeVisible();
  });
});
