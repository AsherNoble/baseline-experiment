import { Portfolio } from '@baseline/types/portfolio';
import { RequestHandler } from './request-handler';

export const getPortfolio = async (requestHandler: RequestHandler, portfolioId: string): Promise<Portfolio> => {
  const response = await requestHandler.request<Portfolio>({
    method: 'GET',
    url: `portfolio/${portfolioId}`,
    hasAuthentication: true,
  });
  if ('data' in response) {
    return response.data;
  }
  throw response;
};

export const getAllPortfolios = async (requestHandler: RequestHandler): Promise<Portfolio[]> => {
  const response = await requestHandler.request<Portfolio[]>({
    method: 'GET',
    url: `portfolio/list`,
    hasAuthentication: true,
  });
  if ('data' in response) {
    return response.data;
  }
  throw response;
};

export const deletePortfolio = async (requestHandler: RequestHandler, portfolioId: string): Promise<boolean> => {
  const response = await requestHandler.request<boolean>({
    method: 'DELETE',
    url: `portfolio/${portfolioId}`,
    hasAuthentication: true,
  });
  if ('data' in response) {
    return response.data;
  }
  throw response;
};

export const createPortfolio = async (
  requestHandler: RequestHandler,
  portfolio: Partial<Portfolio>,
): Promise<Portfolio> => {
  const response = await requestHandler.request<Portfolio>({
    method: 'POST',
    url: `portfolio`,
    hasAuthentication: true,
    data: portfolio,
  });
  if ('data' in response) {
    return response.data;
  }
  throw response;
};

export const updatePortfolio = async (
  requestHandler: RequestHandler,
  portfolio: Partial<Portfolio>,
): Promise<Portfolio> => {
  const response = await requestHandler.request<Portfolio>({
    method: 'PATCH',
    url: `portfolio`,
    hasAuthentication: true,
    data: portfolio,
  });
  if ('data' in response) {
    return response.data;
  }
  throw response;
};
