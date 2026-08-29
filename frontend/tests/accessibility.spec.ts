import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { gotoApp } from "./helpers/devtunnel";

test("accessibility", async ({ page }) => {
  await gotoApp(page, "/");

  const results = await new AxeBuilder({ page }).analyze();

  expect(results.violations).toEqual([]);
});