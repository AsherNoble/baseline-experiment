import React, { useEffect, useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import { AxiosRequestConfig } from 'axios';
import {
  createRequestHandler,
  getRequestHandler,
} from '@baseline/client-api/request-handler';
import { getMyPortfolio, MyPortfolioResponse } from '@baseline/client-api/portfolio';
import { Portfolio } from '@baseline/types/portfolio';
import { Holding } from '@baseline/types/holding';
import { StockQuote } from '@baseline/types/stock';
import { Transaction } from '@baseline/types/transaction';
import { getMyHoldings } from '@baseline/client-api/holding';
import { getMultipleStockQuotes, sellStock } from '@baseline/client-api/stock';
import { getMyTransactions } from '@baseline/client-api/transaction';
import PageWrapper from '../components/page-wrapper/PageWrapper';
import DashboardHeader from '../components/dashboard-header/DashboardHeader';
import StatsCards from '../components/stats-cards/StatsCards';
import HoldingsTable from '../components/holdings-table/HoldingsTable';
import RecentTransactions from '../components/recent-transactions/RecentTransactions';
import SellModal from '../components/sell-modal/SellModal';
import styles from './Dashboard.module.scss';

interface DashboardLoaderData {
  userId: string;
}

const INITIAL_PORTFOLIO_VALUE = 100000;

const Dashboard = (): JSX.Element => {
  useLoaderData() as DashboardLoaderData | undefined;
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [stockQuotes, setStockQuotes] = useState<Map<string, StockQuote>>(
    new Map(),
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<StockQuote | null>(null);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'market'>('portfolio');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Set up request handler if not already done
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

        const response: MyPortfolioResponse = await getMyPortfolio(getRequestHandler());
        setIsAdmin(response.isAdmin);
        setPortfolio(response.portfolio);

        // Fetch holdings and transactions if not admin
        if (!response.isAdmin && response.portfolio) {
          const [holdingsData, transactionsData] = await Promise.all([
            getMyHoldings(getRequestHandler()),
            getMyTransactions(getRequestHandler()),
          ]);

          setHoldings(holdingsData);
          setTransactions(transactionsData);

          // Fetch current prices for holdings
          if (holdingsData.length > 0) {
            const symbols = holdingsData.map((h) => h.symbol);
            const quotes = await getMultipleStockQuotes(
              getRequestHandler(),
              symbols,
            );
            const quotesMap = new Map(quotes.map((q) => [q.symbol, q]));
            setStockQuotes(quotesMap);
          }
        }
      } catch (err) {
        console.error('Failed to fetch portfolio:', err);
        setError('Failed to load portfolio data');
      } finally {
        setLoading(false);
      }
    };

    void fetchPortfolio();
  }, []);

  const handleTabChange = (tab: 'portfolio' | 'market') => {
    if (tab === 'market') {
      navigate('/stocks');
    } else {
      setActiveTab(tab);
    }
  };

  const handleSell = (holding: Holding, stockQuote: StockQuote) => {
    setSelectedHolding(holding);
    setSelectedQuote(stockQuote);
    setIsSellModalOpen(true);
  };

  const handleSellConfirm = async (symbol: string, quantity: number) => {
    try {
      const result = await sellStock(getRequestHandler(), { symbol, quantity });

      // Update local portfolio state
      setPortfolio(result.portfolio);

      // Refresh holdings and transactions
      const [holdingsData, transactionsData] = await Promise.all([
        getMyHoldings(getRequestHandler()),
        getMyTransactions(getRequestHandler()),
      ]);

      setHoldings(holdingsData);
      setTransactions(transactionsData);

      // Refresh stock quotes
      if (holdingsData.length > 0) {
        const symbols = holdingsData.map((h) => h.symbol);
        const quotes = await getMultipleStockQuotes(
          getRequestHandler(),
          symbols,
        );
        const quotesMap = new Map(quotes.map((q) => [q.symbol, q]));
        setStockQuotes(quotesMap);
      } else {
        setStockQuotes(new Map());
      }

      // Close modal
      setIsSellModalOpen(false);
      setSelectedHolding(null);
      setSelectedQuote(null);
    } catch (error) {
      console.error('Sale failed:', error);
      throw error;
    }
  };

  // Calculate holdings value using current stock prices
  const holdingsValue = holdings.reduce((sum, holding) => {
    const currentPrice = stockQuotes.get(holding.symbol)?.regularMarketPrice || 0;
    return sum + holding.quantity * currentPrice;
  }, 0);

  // Calculate total portfolio value
  const totalPortfolioValue = (portfolio?.cash || 0) + holdingsValue;

  if (loading) {
    return (
      <PageWrapper title="Dashboard">
        <div className={styles.dashboard}>
          <div className={styles.loading}>Loading...</div>
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper title="Dashboard">
        <div className={styles.dashboard}>
          <div className={styles.content}>
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (isAdmin) {
    return (
      <PageWrapper title="Dashboard">
        <div className={styles.dashboard}>
          <div className={styles.content}>
            <div className={styles.adminView}>
              <h2>Administrator</h2>
              <p>You are logged in as an administrator.</p>
              <p>Use the admin portal to manage users and portfolios.</p>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!portfolio) {
    return (
      <PageWrapper title="Dashboard">
        <div className={styles.dashboard}>
          <div className={styles.content}>
            <div className={styles.noPortfolio}>
              <p>No portfolio data available.</p>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Dashboard">
      <div className={styles.dashboard}>
        <DashboardHeader
          totalValue={totalPortfolioValue}
          initialValue={INITIAL_PORTFOLIO_VALUE}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        <div className={styles.content}>
          <StatsCards
            availableCash={portfolio.cash}
            holdingsValue={holdingsValue}
            totalPositions={holdings.length}
          />

          <div className={styles.mainContent}>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>Your Holdings</div>
              <HoldingsTable
                holdings={holdings}
                stockQuotes={stockQuotes}
                onSell={handleSell}
              />
            </div>

            <RecentTransactions transactions={transactions} />
          </div>
        </div>

        {/* Sell Modal */}
        {selectedHolding && selectedQuote && (
          <SellModal
            holding={selectedHolding}
            stockQuote={selectedQuote}
            isOpen={isSellModalOpen}
            onClose={() => {
              setIsSellModalOpen(false);
              setSelectedHolding(null);
              setSelectedQuote(null);
            }}
            onConfirm={handleSellConfirm}
          />
        )}
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
