import React, { lazy } from 'react';
import { LazyWrapper } from './LazyWrapper';

// Lazy load all pages for better performance
export const LazyOverview = lazy(() => import('../pages/Overview'));
export const LazyAnalytics = lazy(() => import('../pages/Analytics'));
export const LazyTransactions = lazy(() => import('../pages/Transactions'));
export const LazyAccounts = lazy(() => import('../pages/Accounts'));
export const LazyGoals = lazy(() => import('../pages/Goals'));
export const LazyBills = lazy(() => import('../pages/EnhancedBills'));
export const LazyLiabilities = lazy(() => import('../pages/EnhancedLiabilities'));
export const LazyBudgets = lazy(() => import('../pages/Budgets'));
export const LazySettings = lazy(() => import('../pages/Settings'));

// Lazy load heavy components
export const LazyAdvancedCharts = lazy(() => import('../components/analytics/AdvancedCharts'));
export const LazyFinancialInsights = lazy(() => import('../components/analytics/FinancialInsights'));
export const LazyMobileGestures = lazy(() => import('../components/mobile/MobileGestures'));
export const LazySwipeGestures = lazy(() => import('../components/mobile/SwipeGestures'));

// Wrapped components with loading states
export const OverviewPage = (props: any) => (
  <LazyWrapper>
    <LazyOverview {...props} />
  </LazyWrapper>
);

export const AnalyticsPage = (props: any) => (
  <LazyWrapper>
    <LazyAnalytics {...props} />
  </LazyWrapper>
);

export const TransactionsPage = (props: any) => (
  <LazyWrapper>
    <LazyTransactions {...props} />
  </LazyWrapper>
);

export const AccountsPage = (props: any) => (
  <LazyWrapper>
    <LazyAccounts {...props} />
  </LazyWrapper>
);

export const GoalsPage = (props: any) => (
  <LazyWrapper>
    <LazyGoals {...props} />
  </LazyWrapper>
);

export const BillsPage = (props: any) => (
  <LazyWrapper>
    <LazyBills {...props} />
  </LazyWrapper>
);

export const LiabilitiesPage = (props: any) => (
  <LazyWrapper>
    <LazyLiabilities {...props} />
  </LazyWrapper>
);

export const BudgetsPage = (props: any) => (
  <LazyWrapper>
    <LazyBudgets {...props} />
  </LazyWrapper>
);

export const SettingsPage = (props: any) => (
  <LazyWrapper>
    <LazySettings {...props} />
  </LazyWrapper>
);
