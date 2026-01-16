import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TrendingUpIcon } from '../icons/Icons';
import { MAIN_NAV_ROUTES, AppRoute } from '../../config/routes';
import styles from './Navbar.module.scss';

interface NavbarProps {
  routes?: AppRoute[];
  title?: string;
  subtitle?: string;
}

const Navbar = ({
  routes = MAIN_NAV_ROUTES,
  title = 'ASX Trading Simulator',
  subtitle = 'Practice trading with virtual money',
}: NavbarProps): JSX.Element => {
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
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.subtitle}>{subtitle}</p>
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
