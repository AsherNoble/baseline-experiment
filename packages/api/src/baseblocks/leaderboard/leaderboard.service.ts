import { LeaderboardEntry } from '@baseline/types/leaderboard';
import { portfolioService } from '../portfolio/portfolio.service';
import { userService } from '../user/user.service';
import { isAdminSub } from '../admin/admin.service';
import { getHoldingsByPortfolioId } from '../holding/holding.service';
import { getMultipleStockQuotes } from '../stock/stock.service';

const INITIAL_CASH = 50000;

export const getLeaderboard = async (
  limit: number = 100,
): Promise<LeaderboardEntry[]> => {
  // 1. Fetch all portfolios
  const allPortfolios = await portfolioService.getAll();

  // 2. Fetch all users
  const allUsers = await userService.getAll();
  const userMap = new Map(allUsers.map((u) => [u.userSub, u]));

  // 3. Fetch holdings for all portfolios
  const holdingsMap = new Map<string, any[]>();
  const allSymbols = new Set<string>();

  for (const portfolio of allPortfolios) {
    const holdings = await getHoldingsByPortfolioId(portfolio.portfolioId);
    holdingsMap.set(portfolio.portfolioId, holdings);
    holdings.forEach((h) => allSymbols.add(h.symbol));
  }

  // 4. Fetch current stock prices for all symbols (one batch call)
  const quotes =
    allSymbols.size > 0
      ? await getMultipleStockQuotes(Array.from(allSymbols))
      : [];
  const quotesMap = new Map(quotes.map((q) => [q.symbol, q]));

  // 5. Filter out admins and calculate real-time total values
  const entries: LeaderboardEntry[] = [];

  for (const portfolio of allPortfolios) {
    const isAdmin = await isAdminSub(portfolio.userId);
    if (isAdmin) continue; // Skip admin users

    const user = userMap.get(portfolio.userId);
    if (!user) continue; // Skip if user not found

    // Calculate real-time holdings value using current prices
    const holdings = holdingsMap.get(portfolio.portfolioId) || [];
    const holdingsValue = holdings.reduce((sum, holding) => {
      const currentPrice =
        quotesMap.get(holding.symbol)?.regularMarketPrice || 0;
      return sum + holding.quantity * currentPrice;
    }, 0);

    // Real-time total value = cash + current holdings value
    const totalValue = portfolio.cash + holdingsValue;
    const gain = totalValue - INITIAL_CASH;
    const returnPercent = (gain / INITIAL_CASH) * 100;

    entries.push({
      rank: 0, // Will be set after sorting
      userSub: portfolio.userId,
      displayName: user.displayName || user.email,
      totalValue,
      gain,
      returnPercent,
    });
  }

  // 6. Sort by totalValue descending
  entries.sort((a, b) => b.totalValue - a.totalValue);

  // 7. Assign ranks and limit results
  return entries.slice(0, limit).map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
};
