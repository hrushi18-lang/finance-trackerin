import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './contexts/AuthContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { InternationalizationProvider } from './contexts/InternationalizationContext';
import { CurrencyConversionProvider } from './contexts/CurrencyConversionContext';
import { PersonalizationProvider } from './contexts/PersonalizationContext';
import { ToastProvider } from './components/common/Toast';
import { LoadingScreen } from './components/common/LoadingScreen';
import { ErrorFallback } from './components/common/ErrorFallback';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { AccessibilityEnhancements, useKeyboardNavigation } from './components/common/AccessibilityEnhancements';
import './styles/accessibility.css';

// Lazy load pages for better performance
const Auth = React.lazy(() => import('./pages/Auth').then(module => ({ default: module.Auth })));
const Home = React.lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const AddTransaction = React.lazy(() => import('./pages/AddTransaction').then(module => ({ default: module.AddTransaction })));
const TransactionHistory = React.lazy(() => import('./pages/TransactionHistory').then(module => ({ default: module.TransactionHistory })));
const Analytics = React.lazy(() => import('./pages/Analytics').then(module => ({ default: module.Analytics })));
const Calendar = React.lazy(() => import('./pages/Calendar').then(module => ({ default: module.Calendar })));
const Goals = React.lazy(() => import('./pages/Goals').then(module => ({ default: module.Goals })));
const Liabilities = React.lazy(() => import('./pages/Liabilities').then(module => ({ default: module.Liabilities })));
const Budgets = React.lazy(() => import('./pages/Budgets').then(module => ({ default: module.Budgets })));
const Overview = React.lazy(() => import('./pages/Overview').then(module => ({ default: module.Overview })));
const RecurringTransactions = React.lazy(() => import('./pages/RecurringTransactions').then(module => ({ default: module.RecurringTransactions })));
const AccountsHub = React.lazy(() => import('./pages/FinancialAccountsHub').then(module => ({ default: module.FinancialAccountsHub })));
const Profile = React.lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const Settings = React.lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const Privacy = React.lazy(() => import('./pages/Privacy').then(module => ({ default: module.Privacy })));
const About = React.lazy(() => import('./pages/About').then(module => ({ default: module.About })));
const Bills = React.lazy(() => import('./pages/Bills').then(module => ({ default: module.Bills })));

// Create a client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    }
  }
});

function App() {
  // Enable keyboard navigation
  useKeyboardNavigation();

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <InternationalizationProvider>
              <CurrencyConversionProvider>
                <PersonalizationProvider>
                  <FinanceProvider>
                    <Router>
                      <div className="min-h-screen bg-forest-800 relative">
                        {/* Static Forest Green Background */}
                        <div className="fixed inset-0 bg-gradient-to-br from-forest-900 via-forest-800 to-forest-700"></div>

                        {/* Accessibility Enhancements */}
                        <div className="fixed top-4 right-4 z-50">
                          <AccessibilityEnhancements />
                        </div>

                        {/* Main Content */}
                        <div className="relative z-10">
                          <Suspense fallback={<LoadingScreen message="Loading your financial dashboard..." />}>
                            <Routes>
                              {/* Public Routes */}
                              <Route path="/auth" element={<Auth />} />
                              
                              {/* Onboarding Route */}
                              <Route 
                                path="/onboarding" 
                                element={
                                  <ProtectedRoute requiresAuth={true}>
                                    <OnboardingFlow 
                                      onComplete={() => {
                                        // Always redirect to dashboard after onboarding
                                        // Use SPA navigation instead of hard reload
                                        const navigateEvent = new CustomEvent('app:navigate', { detail: { to: '/' } });
                                        window.dispatchEvent(navigateEvent);
                                      }} 
                                    />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              {/* Protected Routes */}
                              <Route 
                                path="/" 
                                element={
                                  <ProtectedRoute requiresAuth={true}>
                                    <Home />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/add-transaction" 
                                element={
                                  <ProtectedRoute>
                                    <AddTransaction />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/transaction-history" 
                                element={
                                  <ProtectedRoute>
                                    <TransactionHistory />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/analytics" 
                                element={
                                  <ProtectedRoute>
                                    <Analytics />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/overview" 
                                element={
                                  <ProtectedRoute>
                                    <Overview />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/calendar" 
                                element={
                                  <ProtectedRoute>
                                    <Calendar />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/goals" 
                                element={
                                  <ProtectedRoute>
                                    <Goals />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/liabilities" 
                                element={
                                  <ProtectedRoute>
                                    <Liabilities />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/budgets" 
                                element={
                                  <ProtectedRoute>
                                    <Budgets />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/recurring-transactions" 
                                element={
                                  <ProtectedRoute>
                                    <RecurringTransactions />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/accounts" 
                                element={
                                  <ProtectedRoute>
                                    <AccountsHub />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/home" 
                                element={
                                  <ProtectedRoute>
                                    <Home />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/bills" 
                                element={
                                  <ProtectedRoute>
                                    <Bills />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/profile" 
                                element={
                                  <ProtectedRoute>
                                    <Profile />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/settings" 
                                element={
                                  <ProtectedRoute>
                                    <Settings />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/privacy" 
                                element={
                                  <ProtectedRoute>
                                    <Privacy />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/about" 
                                element={
                                  <ProtectedRoute>
                                    <About />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              {/* Catch all route */}
                              <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                          </Suspense>
                        </div>
                      </div>
                    </Router>
                    <ReactQueryDevtools initialIsOpen={false} />
                  </FinanceProvider>
                </PersonalizationProvider>
              </CurrencyConversionProvider>
            </InternationalizationProvider>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;