import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './contexts/AuthContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { InternationalizationProvider } from './contexts/InternationalizationContext';
import { CurrencyConversionProvider } from './contexts/CurrencyConversionContext';
import { EnhancedCurrencyProvider } from './contexts/EnhancedCurrencyContext';
import { PersonalizationProvider } from './contexts/PersonalizationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/common/Toast';
import { LoadingScreen } from './components/common/LoadingScreen';
import { ErrorFallback } from './components/common/ErrorFallback';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import EnhancedOnboardingFlow from './components/onboarding/EnhancedOnboardingFlow';
import { SyncStatus } from './components/sync/SyncStatus';
import { AppInitializer } from './components/AppInitializer';
import { AccessibilityEnhancements, useKeyboardNavigation } from './components/common/AccessibilityEnhancements';
import { fontLoader } from './utils/fontLoader';
import { registerSW } from './utils/registerSW';
import './styles/accessibility.css';

// Import pages directly to avoid lazy loading issues
import Auth from './pages/Auth';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import Transactions from './pages/Transactions';
import TransactionsCalendar from './pages/TransactionsCalendar';
import Analytics from './pages/Analytics';
import Calendar from './pages/Calendar';
import Goals from './pages/Goals';
import Liabilities from './pages/Liabilities';
import { EnhancedLiabilities } from './pages/EnhancedLiabilities';
import Budgets from './pages/Budgets';
import Overview from './pages/Overview';
import Cards from './pages/Cards';
import Accounts from './pages/Accounts';
import AccountDetail from './pages/AccountDetail';
import CreateGoal from './pages/CreateGoal';
import CreateBill from './pages/CreateBill';
import GoalDetail from './pages/GoalDetail';
import BillDetail from './pages/BillDetail';
import Settings from './pages/Settings';
import ThemeSettings from './pages/ThemeSettings';
import Bills from './pages/Bills';
import ProfileNew from './pages/ProfileNew';
import CurrencyDemo from './pages/CurrencyDemo';

// Create a client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
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

  // Initialize font loading and service worker
  useEffect(() => {
    fontLoader.preloadCriticalFonts();
    registerSW();
  }, []);

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <ThemeProvider>
            <AuthProvider>
              <InternationalizationProvider>
                <CurrencyConversionProvider>
                  <EnhancedCurrencyProvider>
                    <PersonalizationProvider>
                      <FinanceProvider>
                    <AppInitializer>
                      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                        <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
                          {/* Accessibility Enhancements */}
                          <div className="fixed top-4 right-4 z-50">
                            <AccessibilityEnhancements />
                          </div>

                          {/* Sync Status Indicator */}
                          <div className="fixed top-4 left-4 z-50">
                            <SyncStatus />
                          </div>

                          {/* Main Content */}
                          <div className="relative z-10">
                            <Routes>
                              {/* Public Routes */}
                              <Route path="/auth" element={<Auth />} />
                              
                              {/* Onboarding Route */}
                              <Route 
                                path="/onboarding" 
                                element={
                                  <ProtectedRoute>
                                    <EnhancedOnboardingFlow 
                                      onComplete={() => {
                                        // Always redirect to dashboard after onboarding
                                        // Use SPA navigation instead of hard reload
                                        const navigateEvent = new CustomEvent('app:navigate', { detail: { to: '/dashboard' } });
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
                                  <ProtectedRoute>
                                    <Dashboard />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/dashboard" 
                                element={
                                  <ProtectedRoute>
                                    <Dashboard />
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
                                path="/add-transaction" 
                                element={
                                  <ProtectedRoute>
                                    <AddTransaction />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/transactions" 
                                element={
                                  <ProtectedRoute>
                                    <TransactionsCalendar />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/cards" 
                                element={
                                  <ProtectedRoute>
                                    <Cards />
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
                                path="/goals/create" 
                                element={
                                  <ProtectedRoute>
                                    <CreateGoal />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/goals/:goalId" 
                                element={
                                  <ProtectedRoute>
                                    <GoalDetail />
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
                                path="/liabilities/enhanced" 
                                element={
                                  <ProtectedRoute>
                                    <EnhancedLiabilities />
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
                                path="/accounts" 
                                element={
                                  <ProtectedRoute>
                                    <Accounts />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/accounts/:accountId" 
                                element={
                                  <ProtectedRoute>
                                    <AccountDetail />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />

                              <Route 
                                path="/profile" 
                                element={
                                  <ProtectedRoute>
                                    <ProfileNew />
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
                                path="/bills/create" 
                                element={
                                  <ProtectedRoute>
                                    <CreateBill />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/bills/:billId" 
                                element={
                                  <ProtectedRoute>
                                    <BillDetail />
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
                                path="/currency-demo" 
                                element={
                                  <ProtectedRoute>
                                    <CurrencyDemo />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/theme-settings" 
                                element={
                                  <ProtectedRoute>
                                    <ThemeSettings />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              {/* Catch all route */}
                              <Route path="*" element={<Navigate to="/" replace />} />
                              </Routes>
                          </div>
                        </div>
                      </Router>
                      <ReactQueryDevtools initialIsOpen={false} />
                    </AppInitializer>
                      </FinanceProvider>
                    </PersonalizationProvider>
                  </EnhancedCurrencyProvider>
                </CurrencyConversionProvider>
              </InternationalizationProvider>
            </AuthProvider>
          </ThemeProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;