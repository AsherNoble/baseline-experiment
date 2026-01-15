import { StockQuote } from './stock';

export interface CachedQuote extends StockQuote {
  cachedAt: number; // Timestamp when cached
  expiresAt: number; // TTL for DynamoDB auto-deletion
}
