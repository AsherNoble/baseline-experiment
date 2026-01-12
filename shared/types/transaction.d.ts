export interface Transaction {
  transactionId: string;
  portfolioId: string;
  holdingId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  pricePerShare: number;
  totalAmount: number;
  timestamp: string;
  status: 'COMPLETED' | 'FAILED';
}
