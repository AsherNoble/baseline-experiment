import React from 'react';
import { TrendingUpIcon } from '../icons/Icons';
import styles from './PortfolioValue.module.scss';

interface PortfolioValueProps {
  totalValue: number;
  initialValue?: number;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(value);
};

const PortfolioValue = ({
  totalValue,
  initialValue = 100000,
}: PortfolioValueProps): JSX.Element => {
  const dollarChange = totalValue - initialValue;
  const percentChange = initialValue > 0 ? (dollarChange / initialValue) * 100 : 0;
  const isPositive = dollarChange >= 0;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logoSection}>
          <div className={styles.logoCircle}>
            <TrendingUpIcon size={24} color="white" />
          </div>
          <div className={styles.titleSection}>
            <h2 className={styles.title}>Your Portfolio</h2>
            <p className={styles.subtitle}>Track your investments and performance</p>
          </div>
        </div>
        <div className={styles.portfolioValue}>
          <span className={styles.valueLabel}>Total Portfolio Value</span>
          <span className={styles.valueAmount}>{formatCurrency(totalValue)}</span>
          <span className={`${styles.valueChange} ${isPositive ? styles.positive : styles.negative}`}>
            {isPositive ? '+' : ''}
            {percentChange.toFixed(2)}% ({isPositive ? '+' : ''}
            {formatCurrency(dollarChange)})
          </span>
        </div>
      </div>
    </div>
  );
};

export default PortfolioValue;
