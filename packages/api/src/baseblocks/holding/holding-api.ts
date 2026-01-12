import { Response } from 'express';
import { holdingMapper } from './holding';
import { RequestContext } from '../../util/request-context.type';
import { getErrorMessage } from '../../util/error-message';
import createApp from '../../util/express-app';
import createAuthenticatedHandler from '../../util/create-authenticated-handler';
import { getHoldingsByPortfolioId } from './holding.service';
import { portfolioService } from '../portfolio/portfolio.service';

const app = createApp();
export const handler = createAuthenticatedHandler(app);

// Get all holdings for the current user's portfolio
app.get('/holding/me', [
  async (req: RequestContext, res: Response) => {
    try {
      const userSub = req.currentUserSub;

      // Get user's portfolio
      const allPortfolios = await portfolioService.getAll();
      const portfolio = allPortfolios.find((p) => p.userId === userSub);

      if (!portfolio) {
        res.json([]); // No portfolio = no holdings
        return;
      }

      // Get all holdings for this portfolio
      const holdings = await getHoldingsByPortfolioId(portfolio.portfolioId);
      const formattedHoldings = holdings.map(holdingMapper);

      res.json(formattedHoldings);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to get holdings: ${message}`);
      res.status(400).json({ error: 'Failed to get holdings' });
    }
  },
]);
