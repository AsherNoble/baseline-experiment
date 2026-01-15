import { Response } from 'express';
import { transactionMapper } from './transaction';
import { RequestContext } from '../../util/request-context.type';
import { getErrorMessage } from '../../util/error-message';
import createApp from '../../util/express-app';
import createAuthenticatedHandler from '../../util/create-authenticated-handler';
import { getTransactionsByPortfolioId } from './transaction.service';
import { portfolioService } from '../portfolio/portfolio.service';

const app = createApp();
export const handler = createAuthenticatedHandler(app);

// Get all transactions for the current user's portfolio
app.get('/transaction/me', [
  async (req: RequestContext, res: Response) => {
    try {
      const userSub = req.currentUserSub;

      // Get user's portfolio
      const allPortfolios = await portfolioService.getAll();
      const portfolio = allPortfolios.find((p) => p.userId === userSub);

      if (!portfolio) {
        res.json([]); // No portfolio = no transactions
        return;
      }

      // Get all transactions for this portfolio (sorted by timestamp desc)
      const transactions = await getTransactionsByPortfolioId(portfolio.portfolioId);
      const formattedTransactions = transactions.map(transactionMapper);

      res.json(formattedTransactions);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to get transactions: ${message}`);
      res.status(400).json({ error: 'Failed to get transactions' });
    }
  },
]);
