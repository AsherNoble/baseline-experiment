import { Transaction } from '@baseline/types/transaction';
import { RequestHandler } from './request-handler';

export const getMyTransactions = async (
  requestHandler: RequestHandler,
): Promise<Transaction[]> => {
  const response = await requestHandler.request<Transaction[]>({
    method: 'GET',
    url: 'transaction/me',
    hasAuthentication: true,
  });
  if ('data' in response) {
    return response.data;
  }
  throw response;
};
