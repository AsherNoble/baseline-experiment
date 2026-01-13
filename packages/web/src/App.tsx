import React, { useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import {
  Outlet,
  RouterProvider,
  createBrowserRouter,
  redirect,
} from 'react-router-dom';
import About from './pages/About';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Stocks from './pages/Stocks';
import Leaderboard from './pages/Leaderboard';

async function dashboardLoader() {
  // Retry a few times to handle Amplify initialization timing
  for (let i = 0; i < 3; i++) {
    try {
      const authSession = await fetchAuthSession();
      if (authSession?.tokens?.idToken) {
        const userId = authSession.tokens.idToken.payload.sub as string;
        return { userId };
      }
    } catch (error) {
      console.error('Dashboard loader attempt failed:', error);
    }
    // Wait before retry
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return redirect('/');
}

const router = createBrowserRouter([
  {
    id: 'public',
    path: '/',
    Component: Outlet,
    children: [
      { path: '/', element: <Home />, index: true },
      { path: '/about', element: <About /> },
      { path: '/leaderboard', element: <Leaderboard /> },
    ],
  },
  {
    id: 'protected',
    path: '/',
    Component: Outlet,
    children: [
      { path: '/dashboard', element: <Dashboard />, loader: dashboardLoader },
      { path: '/stocks', element: <Stocks />, loader: dashboardLoader },
    ],
  },
]);

const App = () => {
  useEffect(() => {
    return Hub.listen('auth', async (data) => {
      switch (data.payload.event) {
        case 'signedIn':
          // Small delay to ensure auth session is ready
          await new Promise((resolve) => setTimeout(resolve, 100));
          router.navigate('/dashboard').catch((e) => console.error(e));
          break;
        case 'signedOut':
          router.navigate('/').catch((e) => console.error(e));
          break;
        default:
          break;
      }
    });
  }, []);

  return <RouterProvider router={router} />;
};

export default App;
