import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './contexts/AuthContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { InternationalizationProvider } from './contexts/InternationalizationContext';
import { EnhancedCurrencyProvider } from './contexts/EnhancedCurrencyContext';
import { PersonalizationProvider } from './contexts/PersonalizationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PaymentProvider } from './contexts/PaymentContext';
import { ToastProvider } from './components/common/Toast';
import NotificationProvider from './contexts/NotificationContext';
import { ErrorFallback } from './components/common/ErrorFallback';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ReceiptModal } from './components/receipts/ReceiptModal';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import OnboardingWrapper from './components/OnboardingWrapper';
import RouteHandler from './components/RouteHandler';
import { AppInitializer } from './components/AppInitializer';
import { AccessibilityEnhancements, useKeyboardNavigation } from './components/common/AccessibilityEnhancements';
import { FontLoader, FontLoadingIndicator } from './components/common/FontLoader';
import { MobileLoadingGuard } from './components/common/MobileLoadingGuard';
import { MobileErrorRecovery } from './components/common/MobileErrorRecovery';
import { fontLoader } from './utils/fontLoader';
import { registerSW } from './utils/registerSW';
import './styles/accessibility.css';
import './styles/mobile.css';

// Import core pages directly for better performance
import Auth from './pages/Auth';
import Home from './pages/Home';
import AddTransaction from './pages/AddTransaction';
import TransactionsCalendar from './pages/TransactionsCalendar';
// import Cards from './pages/Cards'; // Unused import
import Activities from './pages/Activities';
import Calendar from './pages/Calendar';
import Goals from './pages/Goals';
import Liabilities from './pages/Liabilities';
import Budgets from './pages/Budgets';
import Overview from './pages/Overview';
import Accounts from './pages/Accounts';
import AccountDetail from './pages/AccountDetail';
import CreateGoal from './pages/CreateGoal';
import CreateBill from './pages/CreateBill';
import GoalDetail from './pages/GoalDetail';
import BillDetail from './pages/BillDetail';
import Settings from './pages/Settings';
import ThemeSettings from './pages/ThemeSettings';
import CurrencySettings from './pages/CurrencySettings';
import Bills from './pages/Bills';
import ProfileNew from './pages/ProfileNew';
import CurrencyDemo from './pages/CurrencyDemo';
import MultiCurrencyDemo from './pages/MultiCurrencyDemo';
import FontTest from './pages/FontTest';
import ContextTest from './pages/ContextTest';

// Dynamic imports for heavy components
const Analytics = React.lazy(() => import('./pages/Analytics'));
const EnhancedLiabilities = React.lazy(() => import('./pages/EnhancedLiabilities'));

// Create a client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: Error) => {
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
    // Mobile-optimized font loading
    const loadFonts = async () => {
      try {
        // Immediate fallback for mobile
        document.body.classList.add('fonts-loaded');
        document.body.classList.remove('fonts-loading');
        
        // Try to load fonts in background (non-blocking)
        if (window.navigator.userAgent.includes('Mobile')) {
          // Mobile: Use system fonts immediately, load custom fonts in background
          setTimeout(async () => {
            try {
              await fontLoader.preloadCriticalFonts();
            } catch (error) {
              console.warn('Background font loading failed:', error);
            }
          }, 100);
        } else {
          // Desktop: Try to load fonts normally
          await fontLoader.preloadCriticalFonts();
        }
      } catch (error) {
        console.warn('Font loading failed, using system fonts:', error);
        // Ensure fonts-loaded class is added even if loading fails
        document.body.classList.add('fonts-loaded');
        document.body.classList.remove('fonts-loading');
      }
    };
    
    loadFonts();
    registerSW();
  }, []);

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <ThemeProvider>
            <FontLoader>
              <MobileErrorRecovery>
                <MobileLoadingGuard>
                <AuthProvider>
                  <ProfileProvider>
                    <InternationalizationProvider>
                      <EnhancedCurrencyProvider>
                        <PersonalizationProvider>
                          <FinanceProvider>
                            <PaymentProvider>
                              <NotificationProvider>
                                <ReceiptModal />
                              <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                                <AppInitializer>
                                  <RouteHandler>
                              <div className="min-h-screen" data-app-content style={{ backgroundColor: 'var(--background)' }}>
                                {/* Font Loading Indicator */}
                                <FontLoadingIndicator />
                                
                                {/* Accessibility Enhancements */}
                                <div className="fixed top-4 right-4 z-50">
                                  <AccessibilityEnhancements />
                                </div>


                            {/* Main Content */}
                            <div className="relative z-10">
                              <Routes>
                              {/* Public Routes */}
                              <Route path="/auth" element={<Auth />} />
                              
                              {/* Onboarding Route - Only for new users */}
                              <Route 
                                path="/onboarding" 
                                element={
                                  <ProtectedRoute>
                                    <OnboardingWrapper />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              {/* Protected Routes */}
                              <Route 
                                path="/" 
                                element={
                                  <ProtectedRoute>
                                    <Home />
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
                                path="/activities" 
                                element={
                                  <ProtectedRoute>
                                    <Activities />
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
                                path="/analytics" 
                                element={
                                  <ProtectedRoute>
                                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>}>
                                      <Analytics />
                                    </Suspense>
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
                                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>}>
                                      <EnhancedLiabilities />
                                    </Suspense>
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
                                path="/multi-currency-demo" 
                                element={
                                  <ProtectedRoute>
                                    <MultiCurrencyDemo />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/font-test" 
                                element={
                                  <ProtectedRoute>
                                    <FontTest />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/context-test" 
                                element={
                                  <ProtectedRoute>
                                    <ContextTest />
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
                              
                              <Route 
                                path="/currency-settings" 
                                element={
                                  <ProtectedRoute>
                                    <CurrencySettings />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              {/* Catch all route */}
                              <Route path="*" element={<Navigate to="/" replace />} />
                              </Routes>
                            </div>
                          </div>
                                  </RouteHandler>
                                </AppInitializer>
                              </Router>
                              <ReactQueryDevtools initialIsOpen={false} />
                              </NotificationProvider>
                            </PaymentProvider>
                          </FinanceProvider>
                        </PersonalizationProvider>
                      </EnhancedCurrencyProvider>
                    </InternationalizationProvider>
                  </ProfileProvider>
                  </AuthProvider>
                </MobileLoadingGuard>
              </MobileErrorRecovery>
            </FontLoader>
          </ThemeProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
