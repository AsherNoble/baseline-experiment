import { LeaderboardEntry } from './leaderboard';

export interface CachedLeaderboard {
  cacheKey: string; // e.g., "leaderboard:100" for limit of 100
  entries: LeaderboardEntry[];
  cachedAt: number; // Timestamp when cached
  expiresAt: number; // TTL for DynamoDB auto-deletion
}
