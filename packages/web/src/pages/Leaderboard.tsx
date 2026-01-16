import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosRequestConfig } from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import {
  createRequestHandler,
  getRequestHandler,
} from '@baseline/client-api/request-handler';
import { getLeaderboard } from '@baseline/client-api/leaderboard';
import { getMyPortfolio } from '@baseline/client-api/portfolio';
import { getMyHoldings } from '@baseline/client-api/holding';
import { getMultipleStockQuotes } from '@baseline/client-api/stock';
import { LeaderboardEntry } from '@baseline/types/leaderboard';
import { Portfolio } from '@baseline/types/portfolio';
import { Holding } from '@baseline/types/holding';
import { StockQuote } from '@baseline/types/stock';
import PageWrapper from '../components/page-wrapper/PageWrapper';
import PortfolioHeader from '../components/portfolio-header/PortfolioHeader';
import LeaderboardTable from '../components/leaderboard-table/LeaderboardTable';

const INITIAL_PORTFOLIO_VALUE = 50000;

const Leaderboard = (): JSX.Element => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [stockQuotes, setStockQuotes] = useState<Map<string, StockQuote>>(new Map());

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Set up request handler if not already done
        if (!getRequestHandler()) {
          createRequestHandler(
            async (config: AxiosRequestConfig): Promise<AxiosRequestConfig> => {
              // Public endpoint - auth not required, but include if available
              try {
                const authSession = await fetchAuthSession();
                if (authSession?.tokens?.idToken) {
                  if (!config.headers) config.headers = {};
                  config.headers.Authorization = `Bearer ${authSession.tokens.idToken.toString()}`;
                }
              } catch {
                // Not authenticated - that's fine for public endpoint
              }
              return config;
            },
          );
        }

        const data = await getLeaderboard(getRequestHandler());
        setEntries(data);

        // Fetch portfolio and holdings for header
        try {
          const portfolioData = await getMyPortfolio(getRequestHandler());
          if (!portfolioData.isAdmin && portfolioData.portfolio) {
            setPortfolio(portfolioData.portfolio);

            // Fetch holdings for portfolio value calculation
            const holdingsData = await getMyHoldings(getRequestHandler());
            setHoldings(holdingsData);

            // Create quotes map for holdings
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
        } catch (portfolioErr) {
          // Portfolio fetch is optional for leaderboard
          console.error('Failed to fetch portfolio:', portfolioErr);
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setError('Failed to load leaderboard data');
      } finally {
        setLoading(false);
      }
    };

    void fetchLeaderboard();
  }, []);

  const handleTabChange = (tab: 'portfolio' | 'market' | 'leaderboard') => {
    if (tab === 'portfolio') {
      navigate('/portfolio');
    } else if (tab === 'market') {
      navigate('/market');
    }
    // Stay on leaderboard page if leaderboard is selected
  };

  // Calculate holdings value using current stock prices
  const holdingsValue = holdings.reduce((sum, holding) => {
    const currentPrice = stockQuotes.get(holding.symbol)?.regularMarketPrice || 0;
    return sum + holding.quantity * currentPrice;
  }, 0);

  // Calculate total portfolio value
  const totalPortfolioValue = (portfolio?.cash || 0) + holdingsValue;

  return (
    <PageWrapper title="Leaderboard">
      <div style={{ padding: '0', maxWidth: '100%', margin: '0' }}>
        <PortfolioHeader
          totalValue={totalPortfolioValue}
          initialValue={INITIAL_PORTFOLIO_VALUE}
          activeTab="leaderboard"
          onTabChange={handleTabChange}
        />

        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
          <h1 style={{ marginBottom: '1rem' }}>Leaderboard</h1>

          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Top traders ranked by total portfolio value. All users start with
            $50,000.
          </p>

        {error ? (
          <div
            style={{
              padding: '1.5rem',
              border: '1px solid #f5c6cb',
              borderRadius: '8px',
              backgroundColor: '#f8d7da',
              color: '#721c24',
            }}
          >
            <p>{error}</p>
          </div>
        ) : (
          <LeaderboardTable entries={entries} loading={loading} />
        )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default Leaderboard;
