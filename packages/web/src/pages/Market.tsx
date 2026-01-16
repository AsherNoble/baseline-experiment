import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import { AxiosRequestConfig } from 'axios';
import {
  createRequestHandler,
  getRequestHandler,
} from '@baseline/client-api/request-handler';
import { getMultipleStockQuotes, buyStock } from '@baseline/client-api/stock';
import { getMyPortfolio } from '@baseline/client-api/portfolio';
import { StockQuote } from '@baseline/types/stock';
import { Portfolio } from '@baseline/types/portfolio';
import { getMyHoldings } from '@baseline/client-api/holding';
import { Holding } from '@baseline/types/holding';
import PageWrapper from '../components/page-wrapper/PageWrapper';
import PortfolioHeader from '../components/portfolio-header/PortfolioHeader';
import StockList from '../components/stock-list/StockList';
import BuyModal from '../components/buy-modal/BuyModal';

// ASX 20 stocks - the largest companies on the Australian Stock Exchange
const ASX_20_SYMBOLS = [
  'BHP',  // BHP Group
  'CBA',  // Commonwealth Bank
  'CSL',  // CSL Limited
  'NAB',  // National Australia Bank
  'WBC',  // Westpac
  'ANZ',  // ANZ Bank
  'WES',  // Wesfarmers
  'MQG',  // Macquarie Group
  'WOW',  // Woolworths
  'TLS',  // Telstra
  'RIO',  // Rio Tinto
  'FMG',  // Fortescue Metals
  'WDS',  // Woodside Energy
  'TCL',  // Transurban
  'GMG',  // Goodman Group
  'ALL',  // Aristocrat Leisure
  'REA',  // REA Group
  'COL',  // Coles Group
  'STO',  // Santos
  'QBE',  // QBE Insurance
];

const INITIAL_PORTFOLIO_VALUE = 50000;

const Market = (): JSX.Element => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [stockQuotes, setStockQuotes] = useState<Map<string, StockQuote>>(new Map());

  useEffect(() => {
    const fetchStocks = async () => {
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

        const quotes = await getMultipleStockQuotes(getRequestHandler(), ASX_20_SYMBOLS);
        console.log(quotes);
        // Sort by market cap (approximated by price * volume for now)
        quotes.sort((a, b) => b.regularMarketPrice - a.regularMarketPrice);
        setStocks(quotes);

        // Fetch portfolio for buy functionality
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
      } catch (err) {
        console.error('Failed to fetch stocks:', err);
        setError('Failed to load stock data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    void fetchStocks();
  }, []);

  const handleTabChange = (tab: 'portfolio' | 'market' | 'leaderboard') => {
    if (tab === 'portfolio') {
      navigate('/portfolio');
    } else if (tab === 'leaderboard') {
      navigate('/leaderboard');
    }
    // Stay on market page if market is selected
  };

  const handleBuy = (stock: StockQuote) => {
    if (!portfolio) {
      alert('Portfolio not found. Please try again.');
      return;
    }
    setSelectedStock(stock);
    setModalOpen(true);
  };

  const handleConfirmPurchase = async (symbol: string, quantity: number) => {
    try {
      const result = await buyStock(getRequestHandler(), { symbol, quantity });

      // Update local portfolio state
      setPortfolio(result.portfolio);

      // Show success message
      alert(`Successfully purchased ${quantity} shares of ${symbol}!`);

      // Close modal
      setModalOpen(false);
      setSelectedStock(null);
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error; // Let modal handle error display
    }
  };

  // Calculate holdings value using current stock prices
  const holdingsValue = holdings.reduce((sum, holding) => {
    const currentPrice = stockQuotes.get(holding.symbol)?.regularMarketPrice || 0;
    return sum + holding.quantity * currentPrice;
  }, 0);

  // Calculate total portfolio value
  const totalPortfolioValue = (portfolio?.cash || 0) + holdingsValue;

  return (
    <PageWrapper title="Market">
      <div style={{ padding: '0', maxWidth: '100%', margin: '0' }}>
        <PortfolioHeader
          totalValue={totalPortfolioValue}
          initialValue={INITIAL_PORTFOLIO_VALUE}
          activeTab="market"
          onTabChange={handleTabChange}
        />

        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>ASX Stocks</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          Browse and trade the top 20 ASX-listed companies. Prices update on page reload.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: '#666' }}>Loading stock prices...</p>
          </div>
        ) : error ? (
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
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#721c24',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        ) : stocks.length > 0 ? (
          <StockList stocks={stocks} onBuy={handleBuy} />
        ) : (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#666',
              border: '1px solid #ddd',
              borderRadius: '8px',
            }}
          >
            <p>No stock data available.</p>
          </div>
        )}

          <div
            style={{
              marginTop: '2rem',
              padding: '1rem',
              backgroundColor: '#f0f0f0',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: '#666',
            }}
          >
            <strong>Note:</strong> Stock prices are provided by Yahoo Finance and may be delayed.
            This is a simulation game and does not involve real money.
          </div>

          {/* Buy Modal */}
          {selectedStock && portfolio && (
            <BuyModal
              stock={selectedStock}
              portfolio={portfolio}
              isOpen={modalOpen}
              onClose={() => {
                setModalOpen(false);
                setSelectedStock(null);
              }}
              onConfirm={handleConfirmPurchase}
            />
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default Market;
