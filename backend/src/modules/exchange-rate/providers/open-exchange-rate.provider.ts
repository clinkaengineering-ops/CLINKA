import axios from "axios";
import type { ExchangeRateProvider, ExchangeRateResult } from "../exchange-rate.interface";

export class OpenExchangeRateProvider implements ExchangeRateProvider {
  async getExchangeRate(base: string, target: string): Promise<ExchangeRateResult> {
    const apiUrl = process.env.EXCHANGE_RATE_API_URL;
    if (!apiUrl) {
      throw new Error("EXCHANGE_RATE_API_URL environment variable is not configured.");
    }

    try {
      // Assuming a standard endpoint like: https://open.er-api.com/v6/latest/USD
      // If the API requires appending the base, we use template interpolation,
      // but for open.er-api it provides base USD if we just hit /USD
      const url = apiUrl.replace("{base}", base);
      const response = await axios.get(url);
      
      const rates = response.data?.rates;
      if (!rates || typeof rates[target] !== "number") {
        throw new Error(`Target currency ${target} not found in response`);
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
        provider: "OpenExchangeRate (or ExchangeRate.fun proxy)",
        timestamp,
      };
    } catch (err: any) {
      console.error(`[ExchangeRateProvider] Failed to fetch exchange rate: ${err.message}`);
      throw err;
    }
  }
}
