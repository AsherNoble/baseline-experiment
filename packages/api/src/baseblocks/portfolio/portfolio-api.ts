import { Response } from 'express';
import { portfolioMapper } from './portfolio';
import { isAdmin } from '../../middleware/is-admin';
import { RequestContext } from '../../util/request-context.type';
import { Portfolio } from '@baseline/types/portfolio';
import { getErrorMessage } from '../../util/error-message';
import createApp from '../../util/express-app';
import createAuthenticatedHandler from '../../util/create-authenticated-handler';
import { portfolioService } from './portfolio.service';

const app = createApp();
// app.use(isAdmin); // All private endpoints require the user to be an admin
export const handler = createAuthenticatedHandler(app);

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
