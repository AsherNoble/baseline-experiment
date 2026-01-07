import { Portfolio } from '@baseline/types/portfolio';

export const portfolioMapper = (data: Portfolio): Portfolio => {
  const portfolio: Portfolio = {
    portfolioId: data?.portfolioId,
    userId: data?.userId,
    cash: data?.cash,
    totalValue: data?.totalValue,
  };
  return portfolio;
};
