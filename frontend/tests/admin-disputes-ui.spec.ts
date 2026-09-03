import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers/devtunnel";

const ADMIN_AUTH_STATE = JSON.stringify({
  state: {
    user: { id: 1, name: "Admin", email: "admin@clinka.com", role: "ADMIN" },
    sessionReady: true,
  },
  version: 0,
});

test.describe("Admin Disputes UI - Manual Freeze", () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('response', response => {
      if (response.status() === 401) {
        console.log(`401 UNAUTHORIZED: ${response.url()}`);
      }
    });

    // Catch-all to prevent 401s from unmocked endpoints causing redirects
    await page.route("**/api/**", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ json: { success: true, data: [] } });
      } else {
        await route.fulfill({ json: { success: true } });
      }
    });

    // Seed localStorage so Zustand authStore thinks we're an admin
    await page.addInitScript((authState) => {
      window.localStorage.setItem("clinka-auth", authState);
    }, ADMIN_AUTH_STATE);

    // Mock all admin API calls the page makes on mount
    await page.route("**/api/admin/stats*", async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            totalUsers: 0, totalEngineers: 0, totalClients: 0,
            totalProjects: 0, pendingVerifications: 0, gmv: 0,
            inEscrow: 0, openSupportTickets: 0, newUsersLast30: 0,
            newUsersPrev30: 0, activeBans: 0, totalCommission: 0,
          },
        },
      });
    });

    await page.route("**/api/admin/analytics*", async (route) => {
      await route.fulfill({ 
        json: { 
          success: true, 
          data: {
            dailySignups: [],
            dailyGmv: [],
            dailyCommission: [],
            monthlySignups: [],
            monthlyRevenue: [],
            revenueYtd: 0,
            yoyGrowth: 0,
            netMargin: 0,
            platformFeePercent: 0,
            totalGmv: 0,
            totalSignups: 0,
          } 
        } 
      });
    });

    await page.route("**/api/admin/escrow-overview*", async (route) => {
      await route.fulfill({ 
        json: { 
          success: true, 
          data: {
            totalInEscrow: 0,
            released30d: 0,
            refunded30d: 0,
            disputed: 0,
            utilizationPercent: 0,
            dailyEscrowHeld: [],
          } 
        } 
      });
    });

    await page.route("**/api/admin/disputes*", async (route) => {
      await route.fulfill({ json: { success: true, data: [] } });
    });

    await page.route("**/api/admin/verifications/pending*", async (route) => {
      await route.fulfill({ json: { success: true, data: [] } });
    });

    await page.route("**/api/users/me*", async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: { id: 1, name: "Admin", email: "admin@clinka.com", role: "ADMIN" },
        },
      });
    });
  });

  test("submitting a freeze with a valid ID shows the correct engineer's name for confirmation before the request fires", async ({ page }) => {
    let manualFreezeCalled = false;

    // Mock lookup — returns a real engineer
    await page.route("**/api/admin/users/lookup*", async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: { id: 42, name: "Test Engineer", email: "engineer@test.com", role: "ENGINEER" },
        },
      });
    });

    // Track whether freeze endpoint is hit
    await page.route("**/api/disputes/manual-freeze*", async (route) => {
      manualFreezeCalled = true;
      await route.fulfill({ json: { success: true, data: {} } });
    });

    await gotoApp(page, "/admin");

    // Click Disputes tab
    const disputesTab = page.locator("button", { hasText: /^Disputes/ });
    await disputesTab.click();

    // Open Manual Freeze modal
    await page.getByRole("button", { name: /Manual Freeze/i }).click();

    // Should see the lookup step first — not the freeze form
    await expect(page.getByText("Engineer Profile ID")).toBeVisible();
    await expect(page.getByRole("button", { name: "Verify Engineer" })).toBeVisible();

    // Freeze should NOT have been called yet
    expect(manualFreezeCalled).toBe(false);

    // Enter an ID and click Verify
    await page.getByPlaceholder("e.g. 42").fill("42");
    await page.getByRole("button", { name: "Verify Engineer" }).click();

    // Confirmation step should show the engineer's name and email
    await expect(page.getByText("Target Engineer:")).toBeVisible();
    await expect(page.getByText("Test Engineer (engineer@test.com)")).toBeVisible();

    // Fill the actual freeze form
    await page.getByPlaceholder("Amount to freeze").fill("100");
    await page.getByPlaceholder("Reason for freezing funds").fill("Security hold");
    await page.getByRole("button", { name: /Confirm & Freeze/i }).click();

    // Now the freeze endpoint should be called
    await expect(async () => {
      expect(manualFreezeCalled).toBe(true);
    }).toPass({ timeout: 5000 });
  });

  test("submitting an ID that doesn't resolve to any engineer profile is blocked with a clear error", async ({ page }) => {
    let manualFreezeCalled = false;

    // Mock lookup — returns 404
    await page.route("**/api/admin/users/lookup*", async (route) => {
      await route.fulfill({
        status: 404,
        json: { success: false, message: "User not found" },
      });
    });

    // Track whether freeze endpoint is hit
    await page.route("**/api/disputes/manual-freeze*", async (route) => {
      manualFreezeCalled = true;
      await route.fulfill({ json: { success: true, data: {} } });
    });

    await gotoApp(page, "/admin");

    // Click Disputes tab
    const disputesTab = page.locator("button", { hasText: /^Disputes/ });
    await disputesTab.click();

    // Open Manual Freeze modal
    await page.getByRole("button", { name: /Manual Freeze/i }).click();

    // Enter a bad ID and click Verify
    await page.getByPlaceholder("e.g. 42").fill("999");
    await page.getByRole("button", { name: "Verify Engineer" }).click();

    // Should show the error message
    await expect(page.getByText("Could not resolve this ID to an engineer profile.")).toBeVisible();

    // Freeze should NOT have been called
    expect(manualFreezeCalled).toBe(false);
  });
});
