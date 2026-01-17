import React, { useEffect, useState } from 'react';
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
import PageWrapper from '../components/page-wrapper/PageWrapper';
import StockList from '../components/stock-list/StockList';
import BuyModal from '../components/buy-modal/BuyModal';
import { invalidateNavbarCache } from '../components/navbar/Navbar';

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

const Market = (): JSX.Element => {
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);

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
        if (portfolioData.portfolio) {
          setPortfolio(portfolioData.portfolio);
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

      // Invalidate navbar cache to force refresh on next page navigation
      invalidateNavbarCache();

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

  // Calculate top gainers and losers
  const getTopGainersAndLosers = () => {
    const stocksWithChange = stocks.map(stock => {
      const change = stock.regularMarketPrice - stock.previousClose;
      const changePercent = (change / stock.previousClose) * 100;
      return { ...stock, change, changePercent };
    });

    const gainers = stocksWithChange
      .filter(s => s.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5);

    const losers = stocksWithChange
      .filter(s => s.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5);

    return { gainers, losers };
  };

  const { gainers, losers } = stocks.length > 0 ? getTopGainersAndLosers() : { gainers: [], losers: [] };

  return (
    <PageWrapper title="Market">
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
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
          <>
            {/* Top Gainers and Losers Section */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {/* Top Gainers */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}>
                <h2 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ color: '#22c55e' }}>📈</span>
                  Top Gainers
                </h2>
                <div>
                  {gainers.map(stock => (
                    <div
                      key={stock.symbol}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.75rem 0',
                        borderBottom: '1px solid #f0f0f0'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          {stock.symbol.replace('.AX', '')}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>
                          ${stock.regularMarketPrice.toFixed(2)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#22c55e', fontWeight: '600' }}>
                          +{stock.changePercent.toFixed(2)}%
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#22c55e' }}>
                          +${stock.change.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Losers */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}>
                <h2 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ color: '#ef4444' }}>📉</span>
                  Top Losers
                </h2>
                <div>
                  {losers.map(stock => (
                    <div
                      key={stock.symbol}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.75rem 0',
                        borderBottom: '1px solid #f0f0f0'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          {stock.symbol.replace('.AX', '')}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>
                          ${stock.regularMarketPrice.toFixed(2)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#ef4444', fontWeight: '600' }}>
                          {stock.changePercent.toFixed(2)}%
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#ef4444' }}>
                          ${stock.change.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stock Table */}
            <StockList stocks={stocks} onBuy={handleBuy} />
          </>
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
    </PageWrapper>
  );
};

export default Market;
