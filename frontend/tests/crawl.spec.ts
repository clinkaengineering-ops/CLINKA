import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers/devtunnel";

test("crawl application", async ({ page }) => {
  const visited = new Set<string>();
  const queue = ["/"];

  while (queue.length) {
    const current = queue.shift()!;

    if (visited.has(current)) continue;

    visited.add(current);

    await gotoApp(page, current);
    const response = page.url();

    expect(response).toBeTruthy();

    const links = await page.locator("a").evaluateAll(nodes =>
      nodes
        .map(n => n.getAttribute("href"))
        .filter(Boolean)
    );

    for (const link of links) {
      if (
        link &&
        link.startsWith("/") &&
        !visited.has(link)
      ) {
        queue.push(link);
      }
    }
  }
});