import { Request, Response } from 'express';
import { getErrorMessage } from '../../util/error-message';
import createApp from '../../util/express-app';
import serverless from 'serverless-http';
import createAuthenticatedHandler from '../../util/create-authenticated-handler';
import { RequestContext } from '../../util/request-context.type';
import { getStockQuote, getMultipleStockQuotes } from './stock.service';
import { portfolioService } from '../portfolio/portfolio.service';
import { portfolioMapper } from '../portfolio/portfolio';
import {
  holdingService,
  getHoldingByPortfolioAndSymbol,
  getHoldingsByPortfolioId,
} from '../holding/holding.service';
import { holdingMapper } from '../holding/holding';
import { transactionService } from '../transaction/transaction.service';
import { transactionMapper } from '../transaction/transaction';
import { Portfolio } from '@baseline/types/portfolio';
import { Holding } from '@baseline/types/holding';
import { Transaction } from '@baseline/types/transaction';

const app = createApp();
const authenticatedApp = createApp();

// Public handler - no authentication required for stock quotes
export const handler = serverless(app);

// Authenticated handler - for buy/sell operations
export const authHandler = createAuthenticatedHandler(authenticatedApp);

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

// Buy stock - authenticated endpoint
authenticatedApp.post('/stock/buy', async (req: RequestContext, res: Response) => {
  try {
    const { symbol, quantity } = req.body as { symbol: string; quantity: number };
    const userSub = req.currentUserSub;

    // Validation
    if (!symbol || quantity === undefined) {
      res.status(400).json({ error: 'Symbol and quantity are required' });
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      res.status(400).json({ error: 'Quantity must be a positive integer' });
      return;
    }

    // Get user's portfolio
    const allPortfolios = await portfolioService.getAll();
    const portfolio = allPortfolios.find((p) => p.userId === userSub);

    if (!portfolio) {
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }

    // Fetch current stock price
    const stockQuote = await getStockQuote(symbol);
    const totalCost = stockQuote.regularMarketPrice * quantity;

    // Check sufficient funds
    if (portfolio.cash < totalCost) {
      res.status(400).json({
        error: 'Insufficient funds',
        required: totalCost,
        available: portfolio.cash,
      });
      return;
    }

    // Get or create holding
    const existingHolding = await getHoldingByPortfolioAndSymbol(
      portfolio.portfolioId,
      stockQuote.symbol,
    );

    let updatedHolding: Holding;

    if (existingHolding) {
      // Update existing holding with new average cost
      const newQuantity = existingHolding.quantity + quantity;
      const newAverageCost =
        (existingHolding.quantity * existingHolding.averageCost +
          quantity * stockQuote.regularMarketPrice) /
        newQuantity;

      updatedHolding = await holdingService.update({
        holdingId: existingHolding.holdingId,
        quantity: newQuantity,
        averageCost: newAverageCost,
        totalCost: newQuantity * newAverageCost,
        currentValue: newQuantity * stockQuote.regularMarketPrice,
        lastUpdated: new Date().toISOString(),
      });
    } else {
      // Create new holding
      updatedHolding = await holdingService.create({
        portfolioId: portfolio.portfolioId,
        symbol: stockQuote.symbol,
        quantity: quantity,
        averageCost: stockQuote.regularMarketPrice,
        totalCost: totalCost,
        currentValue: totalCost,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Create transaction record
    const transaction = await transactionService.create({
      portfolioId: portfolio.portfolioId,
      holdingId: updatedHolding.holdingId,
      symbol: stockQuote.symbol,
      type: 'BUY' as const,
      quantity: quantity,
      pricePerShare: stockQuote.regularMarketPrice,
      totalAmount: totalCost,
      timestamp: new Date().toISOString(),
      status: 'COMPLETED' as const,
    });

    // Update portfolio cash and total value
    const newCash = portfolio.cash - totalCost;
    const allHoldings = await getHoldingsByPortfolioId(portfolio.portfolioId);

    // Fetch current prices for all holdings to calculate total value
    const holdingsSymbols = allHoldings.map((h) => h.symbol);
    const currentQuotes = await getMultipleStockQuotes(holdingsSymbols);
    const quotesMap = new Map(currentQuotes.map((q) => [q.symbol, q]));

    const totalHoldingsValue = allHoldings.reduce((sum, h) => {
      const currentPrice = quotesMap.get(h.symbol)?.regularMarketPrice || 0;
      return sum + h.quantity * currentPrice;
    }, 0);

    const updatedPortfolio = await portfolioService.update({
      portfolioId: portfolio.portfolioId,
      cash: newCash,
      totalValue: newCash + totalHoldingsValue,
    });

    // Return success response
    res.json({
      success: true,
      transaction: transactionMapper(transaction),
      holding: holdingMapper(updatedHolding),
      portfolio: portfolioMapper(updatedPortfolio),
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error(`Failed to buy stock: ${message}`);
    res.status(500).json({ error: 'Failed to process stock purchase' });
  }
});

// Sell stock - authenticated endpoint
authenticatedApp.post('/stock/sell', async (req: RequestContext, res: Response) => {
  try {
    const { symbol, quantity } = req.body as { symbol: string; quantity: number };
    const userSub = req.currentUserSub;

    // Validation
    if (!symbol || quantity === undefined) {
      res.status(400).json({ error: 'Symbol and quantity are required' });
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      res.status(400).json({ error: 'Quantity must be a positive integer' });
      return;
    }

    // Get user's portfolio
    const allPortfolios = await portfolioService.getAll();
    const portfolio = allPortfolios.find((p) => p.userId === userSub);

    if (!portfolio) {
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }

    // Get holding for this symbol
    const existingHolding = await getHoldingByPortfolioAndSymbol(
      portfolio.portfolioId,
      symbol,
    );

    if (!existingHolding) {
      res.status(404).json({ error: "You don't own this stock" });
      return;
    }

    // Check if user owns enough shares
    if (quantity > existingHolding.quantity) {
      res.status(400).json({
        error: 'Insufficient shares',
        owned: existingHolding.quantity,
        requested: quantity,
      });
      return;
    }

    // Fetch current stock price
    const stockQuote = await getStockQuote(symbol);
    const totalProceeds = stockQuote.regularMarketPrice * quantity;

    // Update or delete holding
    let updatedHolding: Holding | null = null;

    if (quantity === existingHolding.quantity) {
      // Selling all shares - delete the holding
      await holdingService.delete(existingHolding.holdingId);
    } else {
      // Selling partial shares - update the holding
      const newQuantity = existingHolding.quantity - quantity;
      const newTotalCost = newQuantity * existingHolding.averageCost;

      updatedHolding = await holdingService.update({
        holdingId: existingHolding.holdingId,
        quantity: newQuantity,
        averageCost: existingHolding.averageCost, // Keep original average cost
        totalCost: newTotalCost,
        currentValue: newQuantity * stockQuote.regularMarketPrice,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Create transaction record
    const transaction = await transactionService.create({
      portfolioId: portfolio.portfolioId,
      holdingId: existingHolding.holdingId,
      symbol: stockQuote.symbol,
      type: 'SELL' as const,
      quantity: quantity,
      pricePerShare: stockQuote.regularMarketPrice,
      totalAmount: totalProceeds,
      timestamp: new Date().toISOString(),
      status: 'COMPLETED' as const,
    });

    // Update portfolio cash and total value
    const newCash = portfolio.cash + totalProceeds;
    const allHoldings = await getHoldingsByPortfolioId(portfolio.portfolioId);

    // Fetch current prices for all holdings to calculate total value
    const holdingsSymbols = allHoldings.map((h) => h.symbol);
    const currentQuotes = holdingsSymbols.length > 0
      ? await getMultipleStockQuotes(holdingsSymbols)
      : [];
    const quotesMap = new Map(currentQuotes.map((q) => [q.symbol, q]));

    const totalHoldingsValue = allHoldings.reduce((sum, h) => {
      const currentPrice = quotesMap.get(h.symbol)?.regularMarketPrice || 0;
      return sum + h.quantity * currentPrice;
    }, 0);

    const updatedPortfolio = await portfolioService.update({
      portfolioId: portfolio.portfolioId,
      cash: newCash,
      totalValue: newCash + totalHoldingsValue,
    });

    // Return success response
    res.json({
      success: true,
      transaction: transactionMapper(transaction),
      holding: updatedHolding ? holdingMapper(updatedHolding) : null,
      portfolio: portfolioMapper(updatedPortfolio),
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error(`Failed to sell stock: ${message}`);
    res.status(500).json({ error: 'Failed to process stock sale' });
  }
});
