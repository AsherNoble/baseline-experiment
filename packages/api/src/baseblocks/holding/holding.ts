import { Holding } from '@baseline/types/holding';

export const holdingMapper = (data: Holding): Holding => {
  const holding: Holding = {
    holdingId: data?.holdingId,
    portfolioId: data?.portfolioId,
    symbol: data?.symbol,
    quantity: data?.quantity,
    averageCost: data?.averageCost,
    totalCost: data?.totalCost,
    currentValue: data?.currentValue,
    lastUpdated: data?.lastUpdated,
  };
  return holding;
};
