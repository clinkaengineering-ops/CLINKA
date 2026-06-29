import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers/devtunnel";

test("homepage loads quickly", async ({ page }) => {
  const start = Date.now();

  await gotoApp(page, "/");

  const duration = Date.now() - start;

  expect(duration).toBeLessThan(5000);
});