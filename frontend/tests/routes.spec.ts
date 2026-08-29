import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers/devtunnel";

const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/about",
  "/privacy",
  "/terms",
  "/security",
  "/help",
  "/projects",
  "/engineers",
];

for (const route of publicRoutes) {
  test(route, async ({ page }) => {
    await gotoApp(page, route);

    await expect(page.locator("body")).not.toContainText(/developer tunnel/i);
    await expect(page.locator("body")).toBeVisible();
  });
}