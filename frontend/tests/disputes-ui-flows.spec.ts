import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers/devtunnel";

const CLIENT_AUTH_STATE = JSON.stringify({
  state: {
    user: { id: 10, name: "Test Client", email: "client@test.com", role: "CLIENT" },
    sessionReady: true,
  },
  version: 0,
});

const ADMIN_AUTH_STATE = JSON.stringify({
  state: {
    user: { id: 1, name: "Admin", email: "admin@clinka.com", role: "ADMIN" },
    sessionReady: true,
  },
  version: 0,
});

const TEST_PROJECT = {
  id: 42,
  title: "Test Project",
  description: "A test project for dispute flow",
  status: "SUBMITTED_FOR_REVIEW",
  clientId: 10,
  engineerId: 5,
  budget: 1000,
  price: 1000,
  createdAt: new Date().toISOString(),
  disputeWindowClosesAt: new Date(Date.now() + 86400000).toISOString(),
  payment: { status: "FUNDED", amountUsd: 1000, manualSubmissions: [] },
  bids: [{
    id: 1,
    engineerId: 5,
    price: 1000,
    status: "ACCEPTED",
    engineer: { user: { id: 5, name: "Test Engineer" } },
  }],
};

test.describe("Dispute UI Flows", () => {
  test("client can open a dispute end-to-end through the UI", async ({ page }) => {
    let openDisputeCalled = false;

    page.on("console", (msg) => console.log("BROWSER:", msg.text()));

    // Seed localStorage so Zustand authStore thinks we're a client
    await page.addInitScript((authState) => {
      window.localStorage.setItem("clinka-auth", authState);
    }, CLIENT_AUTH_STATE);

    // Mock catch-all FIRST so specific routes override it
    await page.route("**/api/**", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ json: { success: true, data: [] } });
      } else {
        await route.fulfill({ json: { success: true } });
      }
    });

    // Mock users/me for client
    await page.route("**/api/users/me*", async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: { id: 10, name: "Test Client", email: "client@test.com", role: "CLIENT" },
        },
      });
    });

    // Mock project list (public browse)
    await page.route("**/api/projects?*", async (route) => {
      await route.fulfill({
        json: { success: true, data: [TEST_PROJECT] },
      });
    });
    await page.route("**/api/projects", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          json: { success: true, data: [TEST_PROJECT] },
        });
      } else {
        await route.continue();
      }
    });

    // Mock client's own projects
    await page.route("**/api/projects/my*", async (route) => {
      await route.fulfill({
        json: { success: true, data: [TEST_PROJECT] },
      });
    });

    // Mock project detail
    await page.route("**/api/projects/42", async (route) => {
      await route.fulfill({
        json: { success: true, data: TEST_PROJECT },
      });
    });

    // Mock the open dispute endpoint
    await page.route("**/api/disputes/open", async (route) => {
      openDisputeCalled = true;
      await route.fulfill({ json: { success: true, data: {} } });
    });

    // Navigate to the projects marketplace
    await gotoApp(page, "/projects");

    // Wait for the project detail panel to load and the button to appear
    const reportButton = page.getByRole("button", { name: /Report an issue/i });
    await expect(reportButton).toBeVisible({ timeout: 15000 });
    await reportButton.click();

    // Fill the dispute reason in the modal
    await page.getByPlaceholder(/Provide a reason for the issue/i).fill(
      "The engineer did not deliver the required features."
    );

    // Submit the dispute
    await page.getByRole("button", { name: /Submit Dispute/i }).click();

    // Verify the endpoint was hit
    await expect(async () => {
      expect(openDisputeCalled).toBe(true);
    }).toPass({ timeout: 5000 });
  });

  test("admin can resolve a dispute end-to-end through the UI", async ({ page }) => {
    let resolveDisputeCalled = false;
    let resolvePayload: any = null;

    page.on("console", (msg) => console.log("BROWSER:", msg.text()));

    // Seed localStorage so Zustand authStore thinks we're an admin
    await page.addInitScript((authState) => {
      window.localStorage.setItem("clinka-auth", authState);
    }, ADMIN_AUTH_STATE);

    // Mock catch-all FIRST so specific routes override it (Playwright matches last-registered first)
    await page.route("**/api/**", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ json: { success: true, data: [] } });
      } else {
        await route.fulfill({ json: { success: true } });
      }
    });

    // Mock users/me for admin
    await page.route("**/api/users/me*", async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: { id: 1, name: "Admin", email: "admin@clinka.com", role: "ADMIN" },
        },
      });
    });

    await page.route("**/api/admin/verifications/pending*", async (route) => {
      await route.fulfill({ json: { success: true, data: [] } });
    });

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
            dailySignups: [], dailyGmv: [], dailyCommission: [],
            monthlySignups: [], monthlyRevenue: [],
            revenueYtd: 0, yoyGrowth: 0, netMargin: 0,
            platformFeePercent: 0, totalGmv: 0, totalSignups: 0,
          },
        },
      });
    });

    await page.route("**/api/admin/escrow-overview*", async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            totalInEscrow: 0, released30d: 0, refunded30d: 0,
            disputed: 0, utilizationPercent: 0, dailyEscrowHeld: [],
          },
        },
      });
    });

    // Mock the active disputes endpoint
    await page.route("**/api/admin/disputes*", async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: [
            {
              id: 1,
              projectId: 42,
              projectTitle: "Test Project",
              parties: "Test Client vs Test Engineer",
              amount: 1000,
              status: "OPEN",
              subject: "Non-delivery",
              openedAt: new Date().toISOString(),
            },
          ],
        },
      });
    });

    // Mock the resolve dispute endpoint
    await page.route("**/api/disputes/resolve", async (route) => {
      resolveDisputeCalled = true;
      resolvePayload = route.request().postDataJSON();
      await route.fulfill({ json: { success: true, data: {} } });
    });

    await gotoApp(page, "/admin");

    // Click Disputes tab
    const disputesTab = page.locator("button", { hasText: /^Disputes/ });
    await disputesTab.click();

    // Click "Favor Client (Refund)" button on the dispute card
    await page.getByRole("button", { name: /Favor Client/i }).click();

    // Verify modal opens and fill the reason
    await expect(page.getByText("Resolve Dispute")).toBeVisible();
    await page.locator("textarea").fill("Client provided clear evidence of non-delivery.");

    // Confirm resolution
    await page.getByRole("button", { name: "Confirm Resolution" }).click();

    // Verify the endpoint was hit with correct payload
    await expect(async () => {
      expect(resolveDisputeCalled).toBe(true);
      expect(resolvePayload).toMatchObject({
        projectId: 42,
        resolution: "CLIENT",
      });
    }).toPass({ timeout: 5000 });
  });
});
