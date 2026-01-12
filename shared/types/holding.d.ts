export interface Holding {
  holdingId: string;
  portfolioId: string;
  symbol: string;
  quantity: number;
  averageCost: number;
  totalCost: number;
  currentValue: number;
  lastUpdated: string;
}
