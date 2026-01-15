import React from 'react';
import { Holding } from '@baseline/types/holding';
import { StockQuote } from '@baseline/types/stock';
import EmptyState from '../empty-state/EmptyState';
import styles from './HoldingsTable.module.scss';

interface HoldingsTableProps {
  holdings: Holding[];
  stockQuotes: Map<string, StockQuote>;
  loading?: boolean;
  onSell?: (holding: Holding, stockQuote: StockQuote) => void;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(value);
};

const HoldingsTable = ({
  holdings,
  stockQuotes,
  loading = false,
  onSell,
}: HoldingsTableProps): JSX.Element => {
  if (loading) {
    return <div className={styles.loading}>Loading holdings...</div>;
  }

  if (holdings.length === 0) {
    return (
      <div className={styles.empty}>
        <p>You don&apos;t own any stocks yet.</p>
        <p>Visit the Stocks page to start trading!</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>SYMBOL</th>
            <th>NAME</th>
            <th className={styles.alignRight}>QUANTITY</th>
            <th className={styles.alignRight}>AVG PRICE</th>
            <th className={styles.alignRight}>CURRENT PRICE</th>
            <th className={styles.alignRight}>MARKET VALUE</th>
            <th className={styles.alignRight}>GAIN/LOSS</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => {
            const currentQuote = stockQuotes.get(holding.symbol);
            const currentPrice = currentQuote?.regularMarketPrice || 0;
            const previousClose = currentQuote?.previousClose || currentPrice;
            const priceChange = currentPrice - previousClose;
            const priceChangePercent = previousClose > 0 ? (priceChange / previousClose) * 100 : 0;
            const priceChangePositive = priceChange >= 0;

            const marketValue = holding.quantity * currentPrice;
            const gainLoss = marketValue - holding.totalCost;
            const gainLossPercent = holding.totalCost > 0 ? (gainLoss / holding.totalCost) * 100 : 0;
            const isPositive = gainLoss >= 0;

            return (
              <tr
                key={holding.holdingId}
                className={onSell ? styles.clickable : ''}
                onClick={() => currentQuote && onSell && onSell(holding, currentQuote)}
              >
                <td className={styles.symbol}>
                  {holding.symbol.replace('.AX', '')}
                </td>
                <td className={styles.name}>
                  {currentQuote?.shortName || '—'}
                </td>
                <td className={styles.alignRight}>
                  {holding.quantity.toLocaleString()}
                </td>
                <td className={styles.alignRight}>
                  {formatCurrency(holding.averageCost)}
                </td>
                <td className={styles.alignRight}>
                  {currentPrice > 0 ? (
                    <div className={styles.priceCell}>
                      <span>{formatCurrency(currentPrice)}</span>
                      <span className={`${styles.priceChange} ${priceChangePositive ? styles.positive : styles.negative}`}>
                        {priceChangePositive ? '+' : ''}
                        {priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                      </span>
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
                <td className={styles.alignRight}>
                  {currentPrice > 0 ? formatCurrency(marketValue) : '—'}
                </td>
                <td className={styles.alignRight}>
                  {currentPrice > 0 ? (
                    <div className={`${styles.gainLossCell} ${isPositive ? styles.positive : styles.negative}`}>
                      <span>
                        {isPositive ? '+' : ''}
                        {formatCurrency(Math.abs(gainLoss))}
                      </span>
                      <span className={styles.percent}>
                        {isPositive ? '+' : '-'}
                        {Math.abs(gainLossPercent).toFixed(2)}%
                      </span>
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default HoldingsTable;
