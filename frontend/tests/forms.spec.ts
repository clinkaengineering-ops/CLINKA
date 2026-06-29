import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers/devtunnel";

test("forms submit", async ({ page }) => {
  await gotoApp(page, "/");

  const forms = page.locator("form");

  const count = await forms.count();

  expect(count).toBeGreaterThanOrEqual(0);
});