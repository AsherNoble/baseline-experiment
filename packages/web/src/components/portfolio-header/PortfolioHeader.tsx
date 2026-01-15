import React from 'react';
import { TrendingUpIcon } from '../icons/Icons';
import styles from './PortfolioHeader.module.scss';

interface PortfolioHeaderProps {
  totalValue: number;
  initialValue?: number;
  activeTab: 'portfolio' | 'market' | 'leaderboard';
  onTabChange: (tab: 'portfolio' | 'market' | 'leaderboard') => void;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(value);
};

const PortfolioHeader = ({
  totalValue,
  initialValue = 100000,
  activeTab,
  onTabChange,
}: PortfolioHeaderProps): JSX.Element => {
  const dollarChange = totalValue - initialValue;
  const percentChange = initialValue > 0 ? (dollarChange / initialValue) * 100 : 0;
  const isPositive = dollarChange >= 0;

  return (
    <div className={styles.header}>
      <div className={styles.topRow}>
        <div className={styles.logoSection}>
          <div className={styles.logoCircle}>
            <TrendingUpIcon size={24} color="white" />
          </div>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>ASX Trading Simulator</h1>
            <p className={styles.subtitle}>Practice trading with virtual money</p>
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
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'portfolio' ? styles.active : ''}`}
          onClick={() => onTabChange('portfolio')}
        >
          Portfolio
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'market' ? styles.active : ''}`}
          onClick={() => onTabChange('market')}
        >
          Market
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'leaderboard' ? styles.active : ''}`}
          onClick={() => onTabChange('leaderboard')}
        >
          Leaderboard
        </button>
      </div>
    </div>
  );
};

export default PortfolioHeader;
