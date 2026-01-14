import React from 'react';
import { DocumentIcon, TrendingUpIcon, ChartIcon } from '../icons/Icons';
import styles from './StatsCards.module.scss';

interface StatsCardsProps {
  availableCash: number;
  holdingsValue: number;
  totalPositions: number;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(value);
};

const StatsCards = ({
  availableCash,
  holdingsValue,
  totalPositions,
}: StatsCardsProps): JSX.Element => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={`${styles.iconWrapper} ${styles.green}`}>
          <DocumentIcon size={24} />
        </div>
        <div className={styles.content}>
          <span className={styles.label}>Available Cash</span>
          <span className={styles.value}>{formatCurrency(availableCash)}</span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={`${styles.iconWrapper} ${styles.blue}`}>
          <TrendingUpIcon size={24} />
        </div>
        <div className={styles.content}>
          <span className={styles.label}>Holdings Value</span>
          <span className={styles.value}>{formatCurrency(holdingsValue)}</span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={`${styles.iconWrapper} ${styles.purple}`}>
          <ChartIcon size={24} />
        </div>
        <div className={styles.content}>
          <span className={styles.label}>Total Positions</span>
          <span className={styles.value}>{totalPositions}</span>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
