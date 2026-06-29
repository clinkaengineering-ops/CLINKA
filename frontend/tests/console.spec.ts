import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers/devtunnel";

test("no console errors", async ({ page }) => {
  const errors: string[] = [];

  page.on("console", msg => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  await gotoApp(page, "/");

  await page.waitForTimeout(5000);

  expect(errors).toEqual([]);
});