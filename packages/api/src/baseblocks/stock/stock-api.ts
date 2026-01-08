import { Request, Response } from 'express';
import { getErrorMessage } from '../../util/error-message';
import createApp from '../../util/express-app';
import serverless from 'serverless-http';
import { getStockQuote, getMultipleStockQuotes } from './stock.service';

const app = createApp();

// Public handler - no authentication required for stock quotes
export const handler = serverless(app);

// Get a single stock quote by symbol
app.get('/stock/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      res.status(400).json({ error: 'Symbol is required' });
      return;
    }

    const quote = await getStockQuote(symbol);
    res.json(quote);
  } catch (error) {
    const message = getErrorMessage(error);
    console.error(`Failed to get stock quote: ${message}`);
    res.status(400).json({ error: message });
  }
});

// Get multiple stock quotes
app.post('/stock/quotes', async (req: Request, res: Response) => {
  try {
    const { symbols } = req.body as { symbols: string[] };

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      res.status(400).json({ error: 'Symbols array is required' });
      return;
    }

    if (symbols.length > 20) {
      res.status(400).json({ error: 'Maximum 20 symbols allowed per request' });
      return;
    }

    const quotes = await getMultipleStockQuotes(symbols);
    res.json(quotes);
  } catch (error) {
    const message = getErrorMessage(error);
    console.error(`Failed to get stock quotes: ${message}`);
    res.status(400).json({ error: message });
  }
});
