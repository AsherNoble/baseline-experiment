import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import { AxiosRequestConfig } from 'axios';
import {
  createRequestHandler,
  getRequestHandler,
} from '@baseline/client-api/request-handler';
import { getMyPortfolio } from '@baseline/client-api/portfolio';
import { getMyHoldings } from '@baseline/client-api/holding';
import { getMultipleStockQuotes } from '@baseline/client-api/stock';
import { Portfolio } from '@baseline/types/portfolio';
import { Holding } from '@baseline/types/holding';
import { StockQuote } from '@baseline/types/stock';
import { TrendingUpIcon } from '../icons/Icons';
import { MAIN_NAV_ROUTES, AppRoute } from '../../config/routes';
import styles from './Navbar.module.scss';

interface NavbarProps {
  routes?: AppRoute[];
  title?: string;
  subtitle?: string;
}

const INITIAL_PORTFOLIO_VALUE = 50000;

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(value);
};

const Navbar = ({
  routes = MAIN_NAV_ROUTES,
  title = 'ASX Trading Simulator',
  subtitle = 'Practice trading with virtual money',
}: NavbarProps): JSX.Element => {
  const location = useLocation();
  const navigate = useNavigate();

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [stockQuotes, setStockQuotes] = useState<Map<string, StockQuote>>(new Map());

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        if (!getRequestHandler()) {
          createRequestHandler(
            async (config: AxiosRequestConfig): Promise<AxiosRequestConfig> => {
              const authSession = await fetchAuthSession();
              if (!config.headers) config.headers = {};
              config.headers.Authorization = `Bearer ${authSession?.tokens?.idToken?.toString()}`;
              return config;
            },
          );
        }

        const portfolioData = await getMyPortfolio(getRequestHandler());
        if (!portfolioData.isAdmin && portfolioData.portfolio) {
          setPortfolio(portfolioData.portfolio);

          const holdingsData = await getMyHoldings(getRequestHandler());
          setHoldings(holdingsData);

          if (holdingsData.length > 0) {
            const holdingSymbols = holdingsData.map((h) => h.symbol);
            const holdingQuotes = await getMultipleStockQuotes(
              getRequestHandler(),
              holdingSymbols,
            );
            const quotesMap = new Map(holdingQuotes.map((q) => [q.symbol, q]));
            setStockQuotes(quotesMap);
          }
        }
      } catch (err) {
        console.error('Failed to fetch portfolio data:', err);
      }
    };

    void fetchPortfolioData();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  // Calculate holdings value using current stock prices
  const holdingsValue = holdings.reduce((sum, holding) => {
    const currentPrice = stockQuotes.get(holding.symbol)?.regularMarketPrice || 0;
    return sum + holding.quantity * currentPrice;
  }, 0);

  // Calculate total portfolio value
  const totalPortfolioValue = (portfolio?.cash || 0) + holdingsValue;
  const dollarChange = totalPortfolioValue - INITIAL_PORTFOLIO_VALUE;
  const percentChange = INITIAL_PORTFOLIO_VALUE > 0 ? (dollarChange / INITIAL_PORTFOLIO_VALUE) * 100 : 0;
  const isPositive = dollarChange >= 0;

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
          <div className={styles.portfolioValue}>
            <span className={styles.valueLabel}>Total Portfolio Value</span>
            <span className={styles.valueAmount}>{formatCurrency(totalPortfolioValue)}</span>
            <span className={`${styles.valueChange} ${isPositive ? styles.positive : styles.negative}`}>
              {isPositive ? '+' : ''}
              {percentChange.toFixed(2)}% ({isPositive ? '+' : ''}
              {formatCurrency(dollarChange)})
            </span>
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
