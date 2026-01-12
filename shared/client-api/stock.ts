import { StockQuote } from '@baseline/types/stock';
import { Portfolio } from '@baseline/types/portfolio';
import { Holding } from '@baseline/types/holding';
import { Transaction } from '@baseline/types/transaction';
import { RequestHandler } from './request-handler';

export const getStockQuote = async (
  requestHandler: RequestHandler,
  symbol: string,
): Promise<StockQuote> => {
  const response = await requestHandler.request<StockQuote>({
    method: 'GET',
    url: `stock/${symbol}`,
    hasAuthentication: false,
  });
  if ('data' in response) {
    return response.data;
  }
  throw response;
};

export const getMultipleStockQuotes = async (
  requestHandler: RequestHandler,
  symbols: string[],
): Promise<StockQuote[]> => {
  const response = await requestHandler.request<StockQuote[]>({
    method: 'POST',
    url: `stock/quotes`,
    hasAuthentication: false,
    data: { symbols },
  });
  if ('data' in response) {
    return response.data;
  }
  throw response;
};

export interface BuyStockRequest {
  symbol: string;
  quantity: number;
}

export interface BuyStockResponse {
  success: boolean;
  transaction: Transaction;
  holding: Holding;
  portfolio: Portfolio;
}

export const buyStock = async (
  requestHandler: RequestHandler,
  request: BuyStockRequest,
): Promise<BuyStockResponse> => {
  const response = await requestHandler.request<BuyStockResponse>({
    method: 'POST',
    url: 'stock/buy',
    hasAuthentication: true,
    data: request,
  });
  if ('data' in response) {
    return response.data;
  }
  throw response;
};

export interface SellStockRequest {
  symbol: string;
  quantity: number;
}

export interface SellStockResponse {
  success: boolean;
  transaction: Transaction;
  holding: Holding | null;
  portfolio: Portfolio;
}

export const sellStock = async (
  requestHandler: RequestHandler,
  request: SellStockRequest,
): Promise<SellStockResponse> => {
  const response = await requestHandler.request<SellStockResponse>({
    method: 'POST',
    url: 'stock/sell',
    hasAuthentication: true,
    data: request,
  });
  if ('data' in response) {
    return response.data;
  }
  throw response;
};
