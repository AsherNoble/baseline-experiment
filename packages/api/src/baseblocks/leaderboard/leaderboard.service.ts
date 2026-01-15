import { LeaderboardEntry } from '@baseline/types/leaderboard';
import { Holding } from '@baseline/types/holding';
import { portfolioService } from '../portfolio/portfolio.service';
import { userService } from '../user/user.service';
import { isAdminSub } from '../admin/admin.service';
import { getHoldingsByPortfolioId } from '../holding/holding.service';
import { getCachedMultipleStockQuotes } from '../quote/quote.service';
import { CachedLeaderboard } from '@baseline/types/leaderboard-cache';
import { getDynamodbConnection } from '@baselinejs/dynamodb';
import { ServiceObject } from '../../util/service-object';

const INITIAL_CASH = 50000;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const dynamoDb = getDynamodbConnection({
  region: `${process.env.API_REGION}`,
});

const leaderboardCacheService = new ServiceObject<CachedLeaderboard>({
  dynamoDb: dynamoDb,
  objectName: 'LeaderboardCache',
  table: `${process.env.APP_NAME}-${process.env.NODE_ENV}-leaderboard-cache`,
  primaryKey: 'cacheKey',
});

/**
 * Compute leaderboard from scratch (expensive operation)
 */
const computeLeaderboard = async (
  limit: number = 100,
): Promise<LeaderboardEntry[]> => {
  // 1. Fetch all portfolios
  const allPortfolios = await portfolioService.getAll();

  // 2. Fetch all users
  const allUsers = await userService.getAll();
  const userMap = new Map(allUsers.map((u) => [u.userSub, u]));

  // 3. Fetch holdings for all portfolios
  const holdingsMap = new Map<string, Holding[]>();
  const allSymbols = new Set<string>();

  for (const portfolio of allPortfolios) {
    const holdings = await getHoldingsByPortfolioId(portfolio.portfolioId);
    holdingsMap.set(portfolio.portfolioId, holdings);
    holdings.forEach((h) => allSymbols.add(h.symbol));
  }

  // 4. Fetch current stock prices for all symbols (one batch call with cache)
  const quotes =
    allSymbols.size > 0
      ? await getCachedMultipleStockQuotes(Array.from(allSymbols))
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

/**
 * Get leaderboard with caching.
 * Checks cache first, falls back to computation if not cached or expired.
 */
export const getLeaderboard = async (
  limit: number = 100,
): Promise<LeaderboardEntry[]> => {
  const cacheKey = `leaderboard:${limit}`;

  try {
    // Try to get from cache
    const cached = await leaderboardCacheService.get(cacheKey);

    // Check if cache is still valid
    if (cached && cached.cachedAt && Date.now() < cached.expiresAt * 1000) {
      console.log(`Leaderboard cache hit for limit ${limit}`);
      return cached.entries;
    }

    console.log(`Leaderboard cache miss for limit ${limit}, computing fresh data`);
  } catch (error) {
    // Cache miss is fine, we'll compute fresh data
    console.log(`Leaderboard cache miss: ${(error as Error).message}`);
  }

  // Compute fresh leaderboard
  const freshEntries = await computeLeaderboard(limit);

  // Cache the result
  const now = Date.now();
  const cachedLeaderboard: CachedLeaderboard = {
    cacheKey,
    entries: freshEntries,
    cachedAt: now,
    expiresAt: Math.floor((now + CACHE_TTL_MS) / 1000), // DynamoDB TTL uses seconds
  };

  try {
    await leaderboardCacheService.create(cachedLeaderboard);
    console.log(`Cached leaderboard until ${new Date(now + CACHE_TTL_MS).toISOString()}`);
  } catch (error) {
    // If cache write fails, log but don't fail the request
    console.error(`Failed to cache leaderboard:`, error);
  }

  return freshEntries;
};

/**
 * Clear leaderboard cache (useful when portfolios/holdings change)
 */
export const clearLeaderboardCache = async (): Promise<void> => {
  const allCached = await leaderboardCacheService.getAll();
  for (const cached of allCached) {
    await leaderboardCacheService.delete(cached.cacheKey);
  }
  console.log(`Cleared ${allCached.length} leaderboard cache entries`);
};
