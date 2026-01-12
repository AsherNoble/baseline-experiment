import { Transaction } from '@baseline/types/transaction';

export const transactionMapper = (data: Transaction): Transaction => {
  const transaction: Transaction = {
    transactionId: data?.transactionId,
    portfolioId: data?.portfolioId,
    holdingId: data?.holdingId,
    symbol: data?.symbol,
    type: data?.type,
    quantity: data?.quantity,
    pricePerShare: data?.pricePerShare,
    totalAmount: data?.totalAmount,
    timestamp: data?.timestamp,
    status: data?.status,
  };
  return transaction;
};
