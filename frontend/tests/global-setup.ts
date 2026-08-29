import { chromium, type FullConfig } from "@playwright/test";

const STORAGE_PATH = "tests/.auth/devtunnel.json";

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL =
    (config.projects[0]?.use?.baseURL as string | undefined) ??
    "https://w3vchznm-3000.uks1.devtunnels.ms";

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 90_000 });

  const continueButton = page.getByRole("button", { name: /^continue$/i });
  try {
    await continueButton.waitFor({ state: "visible", timeout: 8000 });
    await continueButton.click();
    await page.waitForLoadState("domcontentloaded");
  } catch {
    // Already past consent or not shown.
  }

  await context.storageState({ path: STORAGE_PATH });
  await browser.close();
}
