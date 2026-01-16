// Central route configuration - single source of truth

export interface AppRoute {
  id: string;
  label: string;
  path: string;
  requiresAuth?: boolean;
  requiresNoAuth?: boolean;
}

export const APP_ROUTES = {
  PORTFOLIO: {
    id: 'portfolio',
    label: 'Portfolio',
    path: '/portfolio',
    requiresAuth: true,
  },
  MARKET: {
    id: 'market',
    label: 'Market',
    path: '/market',
    requiresAuth: true,
  },
  LEADERBOARD: {
    id: 'leaderboard',
    label: 'Leaderboard',
    path: '/leaderboard',
  },
} as const;

// Array of main navigation routes
export const MAIN_NAV_ROUTES: AppRoute[] = [
  APP_ROUTES.PORTFOLIO,
  APP_ROUTES.MARKET,
  APP_ROUTES.LEADERBOARD,
];

// Type helpers
export type RouteId = typeof APP_ROUTES[keyof typeof APP_ROUTES]['id'];
