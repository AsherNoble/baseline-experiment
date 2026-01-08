import { StockQuote, YahooFinanceChartResponse } from '@baseline/types/stock';

const YAHOO_FINANCE_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

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
  };
};

export const getMultipleStockQuotes = async (symbols: string[]): Promise<StockQuote[]> => {
  const quotes = await Promise.all(
    symbols.map(symbol => getStockQuote(symbol).catch(error => {
      console.error(`Failed to fetch ${symbol}: ${error.message}`);
      return null;
    }))
  );

  return quotes.filter((quote): quote is StockQuote => quote !== null);
};
