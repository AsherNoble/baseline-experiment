import React from 'react';
import { Transaction } from '@baseline/types/transaction';
import { TrendingUpIcon, TrendingDownIcon } from '../icons/Icons';
import EmptyState from '../empty-state/EmptyState';
import styles from './RecentTransactions.module.scss';

interface RecentTransactionsProps {
  transactions: Transaction[];
  loading?: boolean;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(value);
};

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

const RecentTransactions = ({
  transactions,
  loading = false,
}: RecentTransactionsProps): JSX.Element => {
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>Recent Transactions</div>
        <div className={styles.loading}>Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>Recent Transactions</div>
      {transactions.length === 0 ? (
        <EmptyState icon="clock" title="No transactions yet" />
      ) : (
        <div className={styles.list}>
          {transactions.map((transaction) => {
            const isBuy = transaction.type === 'BUY';
            const displaySymbol = transaction.symbol.replace('.AX', '');

            return (
              <div key={transaction.transactionId} className={styles.transaction}>
                <div
                  className={`${styles.icon} ${isBuy ? styles.buy : styles.sell}`}
                >
                  {isBuy ? (
                    <TrendingUpIcon size={20} />
                  ) : (
                    <TrendingDownIcon size={20} />
                  )}
                </div>
                <div className={styles.details}>
                  <span className={styles.action}>
                    {isBuy ? 'Bought' : 'Sold'} {displaySymbol}
                  </span>
                  <span className={styles.info}>
                    {transaction.quantity} shares @ {formatCurrency(transaction.pricePerShare)}
                  </span>
                </div>
                <div className={styles.right}>
                  <span
                    className={`${styles.amount} ${isBuy ? styles.negative : styles.positive}`}
                  >
                    {isBuy ? '-' : '+'}
                    {formatCurrency(transaction.totalAmount)}
                  </span>
                  <span className={styles.timestamp}>
                    {formatTime(transaction.timestamp)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;
