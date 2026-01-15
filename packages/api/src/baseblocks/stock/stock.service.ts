import {
  StockQuote,
  YahooFinanceChartResponse,
  YahooFinanceQuoteSummaryResponse,
} from '@baseline/types/stock';

const YAHOO_FINANCE_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
const YAHOO_FINANCE_SUMMARY_URL = 'https://query1.finance.yahoo.com/v10/finance/quoteSummary';

export const getStockQuote = async (symbol: string): Promise<StockQuote> => {
  const asxSymbol = symbol.toUpperCase().endsWith('.AX')
    ? symbol.toUpperCase()
    : `${symbol.toUpperCase()}.AX`;

  const response = await fetch(`${YAHOO_FINANCE_BASE_URL}/${asxSymbol}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch stock data: ${response.statusText}`);
  }

  const data: YahooFinanceChartResponse = await response.json();

  if (data.chart.error) {
    throw new Error(data.chart.error.description);
  }

  if (!data.chart.result || data.chart.result.length === 0) {
    throw new Error(`No data found for symbol: ${asxSymbol}`);
  }

  const meta = data.chart.result[0].meta;

  // Fetch quoteSummary for sector/industry
  let sector: string | undefined;
  let industry: string | undefined;

  try {
    const summaryResponse = await fetch(
      `${YAHOO_FINANCE_SUMMARY_URL}/${asxSymbol}?modules=assetProfile`,
    );
    console.log(`Fetching sector for ${asxSymbol}, status: ${summaryResponse.status}`);

    if (summaryResponse.ok) {
      const summaryData: YahooFinanceQuoteSummaryResponse = await summaryResponse.json();
      console.log(`Summary data for ${asxSymbol}:`, JSON.stringify(summaryData, null, 2));

      if (summaryData.quoteSummary.result && summaryData.quoteSummary.result[0]) {
        const assetProfile = summaryData.quoteSummary.result[0].assetProfile;
        sector = assetProfile?.sector;
        industry = assetProfile?.industry;
        console.log(`${asxSymbol} sector: ${sector}, industry: ${industry}`);
      }
    } else {
      console.warn(`Failed to fetch sector for ${asxSymbol}: ${summaryResponse.status} ${summaryResponse.statusText}`);
    }
  } catch (error) {
    // Log but don't fail - sector data is optional
    console.warn(`Failed to fetch sector data for ${asxSymbol}:`, error);
  }

  return {
    symbol: meta.symbol,
    shortName: meta.shortName,
    longName: meta.longName,
    currency: meta.currency,
    exchangeName: meta.exchangeName,
    instrumentType: meta.instrumentType,
    regularMarketPrice: meta.regularMarketPrice,
    regularMarketDayHigh: meta.regularMarketDayHigh,
    regularMarketDayLow: meta.regularMarketDayLow,
    regularMarketVolume: meta.regularMarketVolume,
    previousClose: meta.chartPreviousClose,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
    timezone: meta.timezone,
    sector,
    industry,
  };
};

export const getMultipleStockQuotes = async (symbols: string[]): Promise<StockQuote[]> => {
  // Add small delay between requests to avoid rate limiting
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const quotes: (StockQuote | null)[] = [];

  for (let i = 0; i < symbols.length; i++) {
    try {
      const quote = await getStockQuote(symbols[i]);
      quotes.push(quote);

      // Add 100ms delay between requests to avoid rate limiting
      if (i < symbols.length - 1) {
        await delay(100);
      }
    } catch (error) {
      console.error(`Failed to fetch ${symbols[i]}: ${(error as Error).message}`);
      quotes.push(null);
    }
  }

  return quotes.filter((quote): quote is StockQuote => quote !== null);
};
