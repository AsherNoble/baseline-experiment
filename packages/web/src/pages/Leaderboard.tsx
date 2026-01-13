import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AxiosRequestConfig } from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import {
  createRequestHandler,
  getRequestHandler,
} from '@baseline/client-api/request-handler';
import { getLeaderboard } from '@baseline/client-api/leaderboard';
import { LeaderboardEntry } from '@baseline/types/leaderboard';
import PageWrapper from '../components/page-wrapper/PageWrapper';
import LeaderboardTable from '../components/leaderboard-table/LeaderboardTable';

const Leaderboard = (): JSX.Element => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setError('Failed to load leaderboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <PageWrapper title="Leaderboard">
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
          }}
        >
          <h1>Leaderboard</h1>
          <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>
            &larr; Home
          </Link>
        </div>

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
    </PageWrapper>
  );
};

export default Leaderboard;
