import { defineConfig } from "@playwright/test";

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.CLINKA_FRONTEND_URL ??
  "http://localhost:3000";

const isTunnel = baseURL.includes("devtunnels.ms");

export default defineConfig({
  testDir: "./tests",
  ...(isTunnel ? { globalSetup: "./tests/global-setup.ts" } : {}),

  // Dev tunnels choke under parallel browser load.
  fullyParallel: !isTunnel,
  workers: isTunnel ? 1 : undefined,

  retries: isTunnel ? 2 : 1,
  timeout: isTunnel ? 120_000 : 60_000,

  use: {
    baseURL,
    ...(isTunnel ? { storageState: "tests/.auth/devtunnel.json" } : {}),
    headless: true,
    navigationTimeout: isTunnel ? 90_000 : 30_000,

    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },

  reporter: [["html"], ["list"]],
});
