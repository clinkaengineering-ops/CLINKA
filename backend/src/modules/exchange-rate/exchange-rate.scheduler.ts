import cron from "node-cron";
import { exchangeRateService } from "./index";

export function initializeExchangeRateScheduler() {
  console.info("[ExchangeRateScheduler] Initializing...");

  // Warm the cache on startup
  exchangeRateService.warmCache("USD", "EGP").catch((err) => {
    console.error(`[ExchangeRateScheduler] Failed to warm cache on startup: ${err.message}`);
  });

  // Schedule a refresh every 24 hours at midnight
  cron.schedule("0 0 * * *", async () => {
    console.info("[ExchangeRateScheduler] Running scheduled 24-hour rate refresh.");
    try {
      await exchangeRateService.refreshRate("USD", "EGP");
    } catch (err: any) {
      console.error(`[ExchangeRateScheduler] Scheduled refresh failed: ${err.message}`);
    }
  });

  console.info("[ExchangeRateScheduler] Scheduled rate refresh job initialized.");
}
