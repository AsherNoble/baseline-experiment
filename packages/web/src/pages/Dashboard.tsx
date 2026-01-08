import React from 'react';
import { useLoaderData, Link } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';
import { useAuthenticator } from '@aws-amplify/ui-react';
import PageWrapper from '../components/page-wrapper/PageWrapper';

interface DashboardLoaderData {
  userId: string;
}

const Dashboard = (): JSX.Element => {
  const loaderData = useLoaderData() as DashboardLoaderData | undefined;
  const userId = loaderData?.userId ?? '';
  const { user } = useAuthenticator((context) => [context.user]);

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

        <div
          style={{
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f9f9f9',
          }}
        >
          <p style={{ color: '#666', marginBottom: '0.5rem' }}>User ID</p>
          <p style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {userId}
          </p>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
