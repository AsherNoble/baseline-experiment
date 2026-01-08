import React, { useEffect, useState } from 'react';
import { useLoaderData, Link } from 'react-router-dom';
import { signOut, fetchAuthSession } from 'aws-amplify/auth';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { AxiosRequestConfig } from 'axios';
import {
  createRequestHandler,
  getRequestHandler,
} from '@baseline/client-api/request-handler';
import { getMyPortfolio, MyPortfolioResponse } from '@baseline/client-api/portfolio';
import { Portfolio } from '@baseline/types/portfolio';
import PageWrapper from '../components/page-wrapper/PageWrapper';

interface DashboardLoaderData {
  userId: string;
}

const Dashboard = (): JSX.Element => {
  const loaderData = useLoaderData() as DashboardLoaderData | undefined;
  const userId = loaderData?.userId ?? '';
  const { user } = useAuthenticator((context) => [context.user]);

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
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
      } catch (err) {
        console.error('Failed to fetch portfolio:', err);
        setError('Failed to load portfolio data');
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <PageWrapper title="Dashboard">
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
          }}
        >
          <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>
            &larr; Home
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#666' }}>
              {user?.signInDetails?.loginId || 'User'}
            </span>
            <button
              onClick={handleSignOut}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </div>
        </div>

        <h1 style={{ marginBottom: '1.5rem' }}>Dashboard</h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Loading...</p>
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
          </div>
        ) : isAdmin ? (
          <div
            style={{
              padding: '2rem',
              border: '1px solid #b8daff',
              borderRadius: '8px',
              backgroundColor: '#cce5ff',
              color: '#004085',
              textAlign: 'center',
            }}
          >
            <h2 style={{ marginBottom: '0.5rem' }}>Administrator</h2>
            <p>You are logged in as an administrator.</p>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
              Use the admin portal to manage users and portfolios.
            </p>
          </div>
        ) : portfolio ? (
          <div
            style={{
              padding: '1.5rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9',
            }}
          >
            <h2 style={{ marginBottom: '1rem' }}>Your Portfolio</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <p style={{ color: '#666', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                  Portfolio ID
                </p>
                <p style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {portfolio.portfolioId}
                </p>
              </div>
              <div>
                <p style={{ color: '#666', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                  Cash Balance
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  ${portfolio.cash.toFixed(2)}
                </p>
              </div>
              <div>
                <p style={{ color: '#666', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                  Total Value
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  ${portfolio.totalValue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '1.5rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9',
              textAlign: 'center',
            }}
          >
            <p>No portfolio data available.</p>
          </div>
        )}

        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            border: '1px solid #eee',
            borderRadius: '8px',
            backgroundColor: '#fafafa',
          }}
        >
          <p style={{ color: '#666', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
            User ID
          </p>
          <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all' }}>
            {userId}
          </p>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
