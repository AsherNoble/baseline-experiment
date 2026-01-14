import React from 'react';
import { TrendingUpIcon, ClockIcon, ChartIcon } from '../icons/Icons';
import styles from './EmptyState.module.scss';

type IconType = 'trending' | 'clock' | 'chart';

interface EmptyStateProps {
  icon: IconType;
  title: string;
  subtitle?: string;
}

const iconMap = {
  trending: TrendingUpIcon,
  clock: ClockIcon,
  chart: ChartIcon,
};

const EmptyState = ({ icon, title, subtitle }: EmptyStateProps): JSX.Element => {
  const IconComponent = iconMap[icon];

  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <IconComponent size={32} color="#999" />
      </div>
      <p className={styles.title}>{title}</p>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
};

export default EmptyState;
