import { Request, Response } from 'express';
import { getErrorMessage } from '../../util/error-message';
import createApp from '../../util/express-app';
import serverless from 'serverless-http';
import { getLeaderboard } from './leaderboard.service';

const app = createApp();

// Public handler - no authentication required for leaderboard
export const handler = serverless(app);

// Get leaderboard
app.get('/leaderboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;

    const leaderboard = await getLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    const message = getErrorMessage(error);
    console.error(`Failed to get leaderboard: ${message}`);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});
