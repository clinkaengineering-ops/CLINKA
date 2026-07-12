import db from "../../config/db";
import type { ExchangeRateProvider, CurrencyConverter, ExchangeRateResult } from "./exchange-rate.interface";

export class ExchangeRateService implements CurrencyConverter {
  constructor(private readonly provider: ExchangeRateProvider) {}

  /**
   * Refreshes the rate in the cache by fetching from the provider.
   * If it fails or returns an invalid rate, it keeps the old cache and logs an error.
   */
  async refreshRate(base: string, target: string): Promise<void> {
    try {
      const result = await this.provider.getExchangeRate(base, target);
      if (result.rate <= 0) {
        throw new Error(`Invalid exchange rate <= 0 received: ${result.rate}`);
      }

      await db.exchangeRateCache.upsert({
        where: { base_target: { base, target } },
        update: {
          rate: result.rate,
          provider: result.provider,
          fetchedAt: result.timestamp,
        },
        create: {
          id: `${base}_${target}`,
          base,
          target,
          rate: result.rate,
          provider: result.provider,
          fetchedAt: result.timestamp,
        },
      });

      console.info(`[ExchangeRateService] Refreshed rate ${base}->${target}: ${result.rate}`);
    } catch (err: any) {
      console.error(`[ExchangeRateService] Failed to refresh rate ${base}->${target}: ${err.message}`);
      // Do not crash, keep the old cache
    }
  }

  /**
   * Retrieves the latest rate. Tries to fetch live; falls back to cache.
   * Caching is primarily managed by the background scheduler, but we can hit the DB directly.
   */
  async getExchangeRate(base: string, target: string): Promise<ExchangeRateResult> {
    const cached = await db.exchangeRateCache.findUnique({
      where: { base_target: { base, target } },
    });

    if (!cached) {
      console.warn(`[ExchangeRateService] Cache miss for ${base}->${target}. Attempting synchronous fetch...`);
      // If there is no cache at all, we MUST fetch it synchronously or fail.
      await this.refreshRate(base, target);
      const newlyCached = await db.exchangeRateCache.findUnique({
        where: { base_target: { base, target } },
      });

      if (!newlyCached) {
        throw new Error(`CRITICAL: No exchange rate available for ${base}->${target}. Payment cannot proceed.`);
      }

      return {
        rate: Number(newlyCached.rate),
        provider: newlyCached.provider,
        timestamp: newlyCached.fetchedAt,
      };
    }

    return {
      rate: Number(cached.rate),
      provider: cached.provider,
      timestamp: cached.fetchedAt,
    };
  }

  /**
   * Warms up the cache on server start.
   */
  async warmCache(base: string, target: string): Promise<void> {
    console.info(`[ExchangeRateService] Warming cache for ${base}->${target}...`);
    await this.refreshRate(base, target);
    
    const count = await db.exchangeRateCache.count({
      where: { base, target },
    });

    if (count === 0) {
      console.error(`[ExchangeRateService] CRITICAL: Failed to warm cache for ${base}->${target}. Payments may fail.`);
    } else {
      console.info(`[ExchangeRateService] Cache warmed successfully for ${base}->${target}.`);
    }
  }

  /**
   * CurrencyConverter implementation enforcing a single rounding rule globally.
   */
  async convert(amountUsd: number, from: string, to: string): Promise<{ amountConverted: number; rateUsed: ExchangeRateResult }> {
    if (from === to) {
      return {
        amountConverted: amountUsd,
        rateUsed: { rate: 1, provider: "internal", timestamp: new Date() },
      };
    }

    const rateResult = await this.getExchangeRate(from, to);
    
    // Global rounding rule: round to 2 decimal places.
    const amountConverted = Math.round(amountUsd * rateResult.rate * 100) / 100;
    
    return {
      amountConverted,
      rateUsed: rateResult,
    };
  }
}
