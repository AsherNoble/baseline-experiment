import { LeaderboardEntry } from '@baseline/types/leaderboard';
import { RequestHandler } from './request-handler';

export const getLeaderboard = async (
  requestHandler: RequestHandler,
  limit?: number,
): Promise<LeaderboardEntry[]> => {
  const url = limit ? `leaderboard?limit=${limit}` : 'leaderboard';
  const response = await requestHandler.request<LeaderboardEntry[]>({
    method: 'GET',
    url,
    hasAuthentication: false, // Public endpoint
  });
  if ('data' in response) {
    return response.data;
  }
  throw response;
};
