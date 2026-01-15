import { CachedQuote } from '@baseline/types/quote';
import { StockQuote } from '@baseline/types/stock';
import { getDynamodbConnection } from '@baselinejs/dynamodb';
import { ServiceObject } from '../../util/service-object';
import { getStockQuote as fetchFromYahoo } from '../stock/stock.service';

const dynamoDb = getDynamodbConnection({
  region: `${process.env.API_REGION}`,
});

const quoteServiceObject = new ServiceObject<CachedQuote>({
  dynamoDb: dynamoDb,
  objectName: 'Quote',
  table: `${process.env.APP_NAME}-${process.env.NODE_ENV}-quote`,
  primaryKey: 'symbol',
});

// Cache TTL: 20 minutes (in milliseconds)
const CACHE_TTL_MS = 20 * 60 * 1000;

/**
 * Get a stock quote with caching.
 * Checks cache first, falls back to Yahoo Finance API if not cached or expired.
 */
export const getCachedStockQuote = async (symbol: string): Promise<StockQuote> => {
  const normalizedSymbol = symbol.toUpperCase().endsWith('.AX')
    ? symbol.toUpperCase()
    : `${symbol.toUpperCase()}.AX`;

  try {
    // Try to get from cache
    const cached = await quoteServiceObject.get(normalizedSymbol);

    // Check if cache is still valid
    if (cached && cached.cachedAt && Date.now() < cached.expiresAt) {
      console.log(`Cache hit for ${normalizedSymbol}`);
      // Return quote without cache metadata
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { cachedAt, expiresAt, ...quote } = cached;
      return quote;
    }

    console.log(`Cache miss for ${normalizedSymbol}, fetching from Yahoo Finance`);
  } catch (error) {
    // Cache miss is fine, we'll fetch fresh data
    console.log(`Cache miss for ${normalizedSymbol}: ${(error as Error).message}`);
  }

  // Fetch fresh data from Yahoo Finance
  const freshQuote = await fetchFromYahoo(symbol);

  // Cache the result
  const now = Date.now();
  const cachedQuote: CachedQuote = {
    ...freshQuote,
    cachedAt: now,
    expiresAt: Math.floor((now + CACHE_TTL_MS) / 1000), // DynamoDB TTL uses seconds
  };

  try {
    await quoteServiceObject.create(cachedQuote);
    console.log(`Cached ${normalizedSymbol} until ${new Date(now + CACHE_TTL_MS).toISOString()}`);
  } catch (error) {
    // If cache write fails, log but don't fail the request
    console.error(`Failed to cache ${normalizedSymbol}:`, error);
  }

  return freshQuote;
};

/**
 * Get multiple stock quotes with caching.
 * Batches cache lookups and only fetches uncached quotes from Yahoo.
 */
export const getCachedMultipleStockQuotes = async (
  symbols: string[],
): Promise<StockQuote[]> => {
  const normalizedSymbols = symbols.map((s) =>
    s.toUpperCase().endsWith('.AX') ? s.toUpperCase() : `${s.toUpperCase()}.AX`,
  );

  const results: StockQuote[] = [];
  const symbolsToFetch: string[] = [];
  const now = Date.now();

  // Check cache for all symbols
  for (const symbol of normalizedSymbols) {
    try {
      const cached = await quoteServiceObject.get(symbol);

      if (cached && cached.cachedAt && Date.now() < cached.expiresAt) {
        console.log(`Cache hit for ${symbol}`);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { cachedAt, expiresAt, ...quote } = cached;
        results.push(quote);
      } else {
        symbolsToFetch.push(symbol);
      }
    } catch {
      // Cache miss, add to fetch list
      symbolsToFetch.push(symbol);
    }
  }

  // Fetch uncached symbols from Yahoo Finance
  if (symbolsToFetch.length > 0) {
    console.log(`Fetching ${symbolsToFetch.length} quotes from Yahoo Finance`);

    // Add delay between requests to avoid rate limiting
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let i = 0; i < symbolsToFetch.length; i++) {
      try {
        const freshQuote = await fetchFromYahoo(symbolsToFetch[i]);
        results.push(freshQuote);

        // Cache the result
        const cachedQuote: CachedQuote = {
          ...freshQuote,
          cachedAt: now,
          expiresAt: Math.floor((now + CACHE_TTL_MS) / 1000),
        };

        await quoteServiceObject.create(cachedQuote);

        // Add 100ms delay between requests
        if (i < symbolsToFetch.length - 1) {
          await delay(100);
        }
      } catch (error) {
        console.error(`Failed to fetch ${symbolsToFetch[i]}: ${(error as Error).message}`);
      }
    }
  }

  return results;
};

/**
 * Clear all cached quotes (useful for admin operations)
 */
export const clearQuoteCache = async (): Promise<void> => {
  const allQuotes = await quoteServiceObject.getAll();
  for (const quote of allQuotes) {
    await quoteServiceObject.delete(quote.symbol);
  }
  console.log(`Cleared ${allQuotes.length} cached quotes`);
};
