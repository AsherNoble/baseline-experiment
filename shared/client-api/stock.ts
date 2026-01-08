import { StockQuote } from '@baseline/types/stock';
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
