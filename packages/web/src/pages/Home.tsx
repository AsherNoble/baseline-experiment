import React from 'react';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { signOut } from 'aws-amplify/auth';
import { Link } from 'react-router-dom';
import Hero from '../components/hero/Hero';
import PageWrapper from '../components/page-wrapper/PageWrapper';

const Home = (): JSX.Element => {
  const { authStatus, user } = useAuthenticator((context) => [
    context.authStatus,
    context.user,
  ]);

  const handleSignOut = async () => {
    await signOut();
  };

  const isAuthenticated = authStatus === 'authenticated';

  return (
    <PageWrapper title="Home">
      <>
        <Hero />
        <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
          {isAuthenticated ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9',
              }}
            >
              <p style={{ marginBottom: '0.5rem', color: '#666' }}>
                Signed in as
              </p>
              <p style={{ fontWeight: 'bold', marginBottom: '1.5rem' }}>
                {user?.signInDetails?.loginId || 'User'}
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <Link
                  to="/dashboard"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#007bff',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                  }}
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={() => void handleSignOut()}
                  style={{
                    padding: '0.75rem 1.5rem',
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
          ) : (
            <>
              <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>
                Sign In or Create Account
              </h2>
              <Authenticator />
            </>
          )}
        </div>
      </>
    </PageWrapper>
  );
};

export default Home;
