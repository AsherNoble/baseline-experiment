import React from 'react';
import { StockQuote } from '@baseline/types/stock';
import styles from './StockList.module.scss';

interface StockListProps {
  stocks: StockQuote[];
  onBuy?: (stock: StockQuote) => void;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(value);
};

const formatVolume = (value: number): string => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toString();
};

const calculateChange = (current: number, previous: number): { value: number; percent: number } => {
  const value = current - previous;
  const percent = ((current - previous) / previous) * 100;
  return { value, percent };
};

const StockList = ({ stocks, onBuy }: StockListProps): JSX.Element => {
  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>SYMBOL</th>
            <th>NAME</th>
            <th className={styles.alignRight}>PRICE</th>
            <th>CHANGE</th>
            <th className={styles.alignRight}>VOLUME</th>
            {onBuy && <th className={styles.alignCenter}>ACTION</th>}
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => {
            const change = calculateChange(stock.regularMarketPrice, stock.previousClose);
            const isPositive = change.value >= 0;

            return (
              <tr key={stock.symbol}>
                <td className={styles.symbol}>{stock.symbol.replace('.AX', '')}</td>
                <td className={styles.name}>{stock.shortName}</td>
                <td className={styles.alignRight}>{formatCurrency(stock.regularMarketPrice)}</td>
                <td className={isPositive ? styles.positive : styles.negative}>
                  <div className={styles.changeContainer}>
                    <span className={styles.arrow}>{isPositive ? '↗' : '↘'}</span>
                    <div className={styles.changeText}>
                      <div className={styles.changePercent}>
                        {isPositive ? '+' : ''}{change.percent.toFixed(2)}%
                      </div>
                      <div className={styles.changeDollar}>
                        {isPositive ? '+' : ''}${Math.abs(change.value).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className={styles.alignRight}>{formatVolume(stock.regularMarketVolume)}</td>
                {onBuy && (
                  <td className={styles.alignCenter}>
                    <button
                      className={styles.buyButton}
                      onClick={() => onBuy(stock)}
                    >
                      Buy
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StockList;
