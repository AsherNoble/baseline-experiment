import { Response } from 'express';
import { portfolioMapper } from './portfolio';
import { isAdmin } from '../../middleware/is-admin';
import { RequestContext } from '../../util/request-context.type';
import { Portfolio } from '@baseline/types/portfolio';
import { getErrorMessage } from '../../util/error-message';
import createApp from '../../util/express-app';
import createAuthenticatedHandler from '../../util/create-authenticated-handler';
import { portfolioService } from './portfolio.service';
import { isAdminSub } from '../admin/admin.service';
import { getOrCreateUser } from '../user/user.service';

const app = createApp();
// app.use(isAdmin); // All private endpoints require the user to be an admin
export const handler = createAuthenticatedHandler(app);

// Get or create portfolio for the current authenticated user
app.get('/portfolio/me', [
  async (req: RequestContext, res: Response) => {
    try {
      const userSub = req.currentUserSub;
      const userEmail = req.context?.authorizer?.claims?.email || '';

      // Check if user is an admin
      const userIsAdmin = await isAdminSub(userSub);
      if (userIsAdmin) {
        res.json({ isAdmin: true, portfolio: null, user: null });
        return;
      }

      // Get or create User record for this Cognito user
      const user = await getOrCreateUser(userSub, userEmail);

      // Find existing portfolio for this user
      const allPortfolios = await portfolioService.getAll();
      let portfolio = allPortfolios.find((p) => p.userId === userSub);

      // If no portfolio exists, create one with default values
      if (!portfolio) {
        const newPortfolio: Partial<Portfolio> = {
          userId: userSub,
          cash: 50000,
          totalValue: 0,
        };
        portfolio = await portfolioService.create(newPortfolio);
      }

      res.json({ isAdmin: false, portfolio: portfolioMapper(portfolio), user });
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to get user portfolio: ${message}`);
      res.status(400).json({
        error: 'Failed to get user portfolio',
      });
    }
  },
]);

app.post('/portfolio', [
  isAdmin,
  async (req: RequestContext, res: Response) => {
    try {
      const { userId, cash, totalValue } = req.body as Portfolio;
      const portfolioData: Partial<Portfolio> = {
        userId, cash, totalValue,
      };
      const portfolio = await portfolioService.create(portfolioData);
      res.json(portfolioMapper(portfolio));
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to create portfolio ${message}`);
      res.status(400).json({ error: 'Failed to create portfolio' });
    }
  },
]);

app.patch('/portfolio', [
  isAdmin,
  async (req: RequestContext, res: Response) => {
    try {
      const { portfolioId, userId, cash, totalValue } = req.body as Portfolio;
      const portfolioData: Partial<Portfolio> = {
        portfolioId, userId, cash, totalValue
      };
      const portfolio = await portfolioService.update(portfolioData);
      res.json(portfolioMapper(portfolio));
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to update portfolio: ${message}`);
      res.status(400).json({
        error: 'Failed to update portfolio',
      });
    }
  },
]);

app.delete('/portfolio/:portfolioId', [
  isAdmin,
  async (req: RequestContext, res: Response) => {
    try {
      const portfolioId = req.params.portfolioId;
      await portfolioService.delete(portfolioId);
      res.status(200);
      res.send();
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to delete portfolio: ${message}`);
      res.status(400).json({
        error: 'Failed to delete portfolio',
      });
    }
  },
]);

app.get('/portfolio/list', [
  isAdmin,
  async (req: RequestContext, res: Response) => {
    try {
      const portfolios = await portfolioService.getAll();
      const formattedPortfolios = portfolios.map(portfolioMapper);
      res.json(formattedPortfolios);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to get portfolios: ${message}`);
      res.status(400).json({
        error: 'Failed to get portfolios',
      });
    }
  },
]);

app.get('/portfolio/:portfolioId', [
  isAdmin,
  async (req: RequestContext, res: Response) => {
    try {
      const portfolio = await portfolioService.get(req.params.portfolioId);
      res.json(portfolioMapper(portfolio));
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to get portfolio: ${message}`);
      res.status(400).json({
        error: 'Failed to get portfolio',
      });
    }
  },
]);
