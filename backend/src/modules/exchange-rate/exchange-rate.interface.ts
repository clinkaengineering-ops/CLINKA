export interface ExchangeRateResult {
  rate: number;
  provider: string;
  timestamp: Date;
}

export interface ExchangeRateProvider {
  getExchangeRate(base: string, target: string): Promise<ExchangeRateResult>;
}

export interface CurrencyConverter {
  convert(amountUsd: number, from: string, to: string): Promise<{
    amountConverted: number;
    rateUsed: ExchangeRateResult;
  }>;
}
