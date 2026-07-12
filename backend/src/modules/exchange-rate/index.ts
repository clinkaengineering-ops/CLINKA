import { ExchangeRateService } from "./exchange-rate.service";
import { OpenExchangeRateProvider } from "./providers/open-exchange-rate.provider";

export const exchangeRateProvider = new OpenExchangeRateProvider();
export const exchangeRateService = new ExchangeRateService(exchangeRateProvider);
