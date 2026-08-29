import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers/devtunnel";

test("all links work", async ({ page }) => {
  await gotoApp(page, "/");

  const links = page.locator("a");

  const count = await links.count();

  for (let i = 0; i < count; i++) {
    const href = await links.nth(i).getAttribute("href");

    expect(href).toBeTruthy();
  }
});