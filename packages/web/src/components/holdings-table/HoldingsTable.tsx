import React from 'react';
import { Holding } from '@baseline/types/holding';
import { StockQuote } from '@baseline/types/stock';
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
            <th>Symbol</th>
            <th className={styles.alignRight}>Shares</th>
            <th className={styles.alignRight}>Avg Cost</th>
            <th className={styles.alignRight}>Total Cost</th>
            <th className={styles.alignRight}>Current Price</th>
            <th className={styles.alignRight}>Market Value</th>
            <th className={styles.alignRight}>Gain/Loss</th>
            {onSell && <th className={styles.alignCenter}>Action</th>}
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => {
            const currentQuote = stockQuotes.get(holding.symbol);
            const currentPrice = currentQuote?.regularMarketPrice || 0;
            const marketValue = holding.quantity * currentPrice;
            const gainLoss = marketValue - holding.totalCost;
            const gainLossPercent = (gainLoss / holding.totalCost) * 100;
            const isPositive = gainLoss >= 0;

            return (
              <tr key={holding.holdingId}>
                <td className={styles.symbol}>
                  {holding.symbol.replace('.AX', '')}
                  {currentQuote && (
                    <span className={styles.name}>{currentQuote.shortName}</span>
                  )}
                </td>
                <td className={styles.alignRight}>
                  {holding.quantity.toLocaleString()}
                </td>
                <td className={styles.alignRight}>
                  {formatCurrency(holding.averageCost)}
                </td>
                <td className={styles.alignRight}>
                  {formatCurrency(holding.totalCost)}
                </td>
                <td className={styles.alignRight}>
                  {currentPrice > 0 ? formatCurrency(currentPrice) : '—'}
                </td>
                <td className={styles.alignRight}>
                  {currentPrice > 0 ? formatCurrency(marketValue) : '—'}
                </td>
                <td
                  className={`${styles.alignRight} ${isPositive ? styles.positive : styles.negative}`}
                >
                  {currentPrice > 0 ? (
                    <>
                      {isPositive ? '+' : ''}
                      {formatCurrency(gainLoss)}
                      <span className={styles.percent}>
                        ({isPositive ? '+' : ''}
                        {gainLossPercent.toFixed(2)}%)
                      </span>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                {onSell && (
                  <td className={styles.alignCenter}>
                    <button
                      className={styles.sellButton}
                      onClick={() =>
                        currentQuote && onSell(holding, currentQuote)
                      }
                      disabled={!currentQuote}
                    >
                      Sell
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className={styles.totalRow}>
            <td>Total</td>
            <td className={styles.alignRight}>
              {holdings.reduce((sum, h) => sum + h.quantity, 0).toLocaleString()}
            </td>
            <td></td>
            <td className={styles.alignRight}>
              {formatCurrency(
                holdings.reduce((sum, h) => sum + h.totalCost, 0),
              )}
            </td>
            <td></td>
            <td className={styles.alignRight}>
              {formatCurrency(
                holdings.reduce((sum, h) => {
                  const quote = stockQuotes.get(h.symbol);
                  return (
                    sum + h.quantity * (quote?.regularMarketPrice || 0)
                  );
                }, 0),
              )}
            </td>
            <td className={styles.alignRight}>
              {(() => {
                const totalCost = holdings.reduce(
                  (sum, h) => sum + h.totalCost,
                  0,
                );
                const totalValue = holdings.reduce((sum, h) => {
                  const quote = stockQuotes.get(h.symbol);
                  return (
                    sum + h.quantity * (quote?.regularMarketPrice || 0)
                  );
                }, 0);
                const totalGainLoss = totalValue - totalCost;
                const isPositive = totalGainLoss >= 0;
                const percent =
                  totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

                return (
                  <span
                    className={
                      isPositive ? styles.positive : styles.negative
                    }
                  >
                    {isPositive ? '+' : ''}
                    {formatCurrency(totalGainLoss)}
                    <span className={styles.percent}>
                      ({isPositive ? '+' : ''}
                      {percent.toFixed(2)}%)
                    </span>
                  </span>
                );
              })()}
            </td>
            {onSell && <td></td>}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default HoldingsTable;
