import axios from "axios";
import type { ExchangeRateProvider, ExchangeRateResult } from "../exchange-rate.interface";

const FETCH_TIMEOUT_MS = 10_000; // 10 seconds

/**
 * Secondary (free) API sources to try when the primary one fails.
 * These are public, no-auth APIs that return USD-based rates.
 */
const FALLBACK_URLS = [
  "https://open.er-api.com/v6/latest/USD",
  "https://api.exchangerate-api.com/v4/latest/USD",
];

export class OpenExchangeRateProvider implements ExchangeRateProvider {
  async getExchangeRate(base: string, target: string): Promise<ExchangeRateResult> {
    const primaryUrl = process.env.EXCHANGE_RATE_API_URL;
    const urls: string[] = [];

    if (primaryUrl) {
      urls.push(primaryUrl.replace("{base}", base));
    }

    // Append fallback URLs that aren't already in the list
    for (const fallback of FALLBACK_URLS) {
      const resolved = fallback.replace("{base}", base);
      if (!urls.includes(resolved)) {
        urls.push(resolved);
      }
    }

    if (urls.length === 0) {
      throw new Error("No exchange rate API URLs configured.");
    }

    let lastError: Error | null = null;

    for (const url of urls) {
      try {
        const response = await axios.get(url, { timeout: FETCH_TIMEOUT_MS });
        
        const rates = response.data?.rates;
        if (!rates || typeof rates[target] !== "number") {
          throw new Error(`Target currency ${target} not found in response from ${url}`);
        }

        const rate = rates[target];
        if (rate <= 0) {
          throw new Error(`Invalid rate received for ${target}: ${rate}`);
        }

        // Convert Unix timestamp to Date if available, else use current time
        const timestamp = response.data.time_last_update_unix 
          ? new Date(response.data.time_last_update_unix * 1000)
          : new Date();

        return {
          rate,
          provider: `OpenExchangeRate (${new URL(url).hostname})`,
          timestamp,
        };
      } catch (err: any) {
        console.warn(`[ExchangeRateProvider] Failed to fetch from ${url}: ${err.message}`);
        lastError = err;
        // Try next URL
      }
    }

    console.error(`[ExchangeRateProvider] All exchange rate sources failed for ${base}->${target}`);
    throw lastError ?? new Error(`All exchange rate sources failed for ${base}->${target}`);
  }
}
