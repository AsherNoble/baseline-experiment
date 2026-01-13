import React from 'react';
import { LeaderboardEntry } from '@baseline/types/leaderboard';
import styles from './LeaderboardTable.module.scss';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  loading?: boolean;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(value);
};

const LeaderboardTable = ({
  entries,
  loading = false,
}: LeaderboardTableProps): JSX.Element => {
  if (loading) {
    return <div className={styles.loading}>Loading leaderboard...</div>;
  }

  if (entries.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No leaderboard data available yet.</p>
        <p>Be the first to start trading!</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.rank}>Rank</th>
            <th>User</th>
            <th className={styles.alignRight}>Portfolio Value</th>
            <th className={styles.alignRight}>Gain</th>
            <th className={styles.alignRight}>Return</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isPositive = entry.gain >= 0;
            const isTopThree = entry.rank <= 3;

            return (
              <tr
                key={entry.userSub}
                className={isTopThree ? styles.topThree : ''}
              >
                <td className={styles.rank}>
                  {entry.rank === 1 && '🥇'}
                  {entry.rank === 2 && '🥈'}
                  {entry.rank === 3 && '🥉'}
                  {entry.rank > 3 && entry.rank}
                </td>
                <td className={styles.displayName}>{entry.displayName}</td>
                <td className={styles.alignRight}>
                  {formatCurrency(entry.totalValue)}
                </td>
                <td
                  className={`${styles.alignRight} ${isPositive ? styles.positive : styles.negative}`}
                >
                  {isPositive ? '+' : ''}
                  {formatCurrency(entry.gain)}
                </td>
                <td
                  className={`${styles.alignRight} ${isPositive ? styles.positive : styles.negative}`}
                >
                  {isPositive ? '+' : ''}
                  {entry.returnPercent.toFixed(2)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardTable;
