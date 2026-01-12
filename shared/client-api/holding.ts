import { Holding } from '@baseline/types/holding';
import { RequestHandler } from './request-handler';

export const getMyHoldings = async (
  requestHandler: RequestHandler,
): Promise<Holding[]> => {
  const response = await requestHandler.request<Holding[]>({
    method: 'GET',
    url: 'holding/me',
    hasAuthentication: true,
  });
  if ('data' in response) {
    return response.data;
  }
  throw response;
};
