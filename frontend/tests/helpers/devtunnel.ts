import type { Page } from "@playwright/test";

const GOTO_OPTS = {
  waitUntil: "domcontentloaded" as const,
  timeout: 90_000,
};

/** Click through Microsoft Dev Tunnels consent interstitial when present. */
export async function bypassDevTunnelWarning(page: Page): Promise<void> {
  const body = await page.locator("body").textContent({ timeout: 5000 }).catch(() => "");
  if (!body?.includes("developer tunnel")) return;

  const continueButton = page.getByRole("button", { name: /^continue$/i });
  await continueButton.click({ timeout: 10_000 });
  await page.waitForLoadState("domcontentloaded");
}

/** Navigate to a path, handling the dev-tunnel warning page first. */
export async function gotoApp(page: Page, path = "/"): Promise<void> {
  await page.goto(path, GOTO_OPTS);
  await bypassDevTunnelWarning(page);

  const stillOnWarning = await page
    .locator("body")
    .textContent()
    .then((t) => t?.includes("developer tunnel") ?? false);

  if (stillOnWarning) {
    await bypassDevTunnelWarning(page);
    await page.goto(path, GOTO_OPTS);
  }

  // Don't wait for "load" — tunnel + Next.js often never fire it.
  await page.waitForLoadState("domcontentloaded");
}
