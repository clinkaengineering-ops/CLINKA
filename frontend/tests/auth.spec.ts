import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers/devtunnel";

test("Login page renders", async ({ page }) => {
  await gotoApp(page, "/login");

  await expect(page.locator("body")).toContainText(/sign|login|welcome/i);
});

test("Register page renders", async ({ page }) => {
  await gotoApp(page, "/register");

  await expect(page.locator("body")).toBeVisible();
});