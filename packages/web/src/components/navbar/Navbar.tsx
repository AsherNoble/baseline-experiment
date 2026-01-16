import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TrendingUpIcon } from '../icons/Icons';
import styles from './Navbar.module.scss';

interface NavRoute {
  label: string;
  path: string;
}

const routes: NavRoute[] = [
  {
    label: 'Portfolio',
    path: '/portfolio',
  },
  {
    label: 'Market',
    path: '/market',
  },
  {
    label: 'Leaderboard',
    path: '/leaderboard',
  },
];

const Navbar = (): JSX.Element => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <div className={styles.spacer} />
      <div className={styles.navbar}>
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
        </div>
        <div className={styles.tabs}>
          {routes.map((route) => (
            <button
              key={route.path}
              className={`${styles.tab} ${isActive(route.path) ? styles.active : ''}`}
              onClick={() => navigate(route.path)}
            >
              {route.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Navbar;
