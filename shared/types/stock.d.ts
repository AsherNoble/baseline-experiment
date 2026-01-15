export interface StockQuote {
  symbol: string;
  shortName: string;
  longName: string;
  currency: string;
  exchangeName: string;
  instrumentType: string;
  regularMarketPrice: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  previousClose: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  timezone: string;
  sector?: string;
  industry?: string;
}

export interface YahooFinanceChartResponse {
  chart: {
    result: YahooFinanceChartResult[] | null;
    error: YahooFinanceError | null;
  };
}

export interface YahooFinanceChartResult {
  meta: {
    currency: string;
    symbol: string;
    exchangeName: string;
    instrumentType: string;
    shortName: string;
    longName: string;
    regularMarketPrice: number;
    regularMarketDayHigh: number;
    regularMarketDayLow: number;
    regularMarketVolume: number;
    chartPreviousClose: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
    timezone: string;
  };
  timestamp?: number[];
  indicators?: {
    quote: Array<{
      open: number[];
      high: number[];
      low: number[];
      close: number[];
      volume: number[];
    }>;
  };
}

export interface YahooFinanceError {
  code: string;
  description: string;
}

export interface YahooFinanceQuoteSummaryResponse {
  quoteSummary: {
    result: YahooFinanceQuoteSummaryResult[] | null;
    error: YahooFinanceError | null;
  };
}

export interface YahooFinanceQuoteSummaryResult {
  assetProfile?: {
    sector?: string;
    industry?: string;
    [key: string]: unknown;
  };
}
