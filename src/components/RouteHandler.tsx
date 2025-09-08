import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContextOffline';
import { LoadingScreen } from './common/LoadingScreen';

interface RouteHandlerProps {
  children: React.ReactNode;
}

const RouteHandler: React.FC<RouteHandlerProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { accounts, goals, bills, liabilities, userCategories, loading: financeLoading } = useFinance();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const handleRouting = async () => {
      // Don't redirect if already on auth page
      if (location.pathname === '/auth') {
        setIsChecking(false);
        return;
      }

      // Wait for auth to load
      if (authLoading) {
        return;
      }

      // If not authenticated, redirect to auth
      if (!isAuthenticated || !user) {
        navigate('/auth');
        setIsChecking(false);
        return;
      }

      // Wait for finance data to load
      if (financeLoading) {
        return;
      }

      // Check if user has existing data
      const hasExistingData = 
        accounts.length > 0 || 
        goals.length > 0 || 
        bills.length > 0 || 
        liabilities.length > 0 || 
        userCategories.length > 0;

      // If user is new (no existing data) and not already on onboarding
      if (!hasExistingData && location.pathname !== '/onboarding') {
        navigate('/onboarding');
        setIsChecking(false);
        return;
      }

      // If user has existing data and is on onboarding, redirect to dashboard
      if (hasExistingData && location.pathname === '/onboarding') {
        navigate('/dashboard');
        setIsChecking(false);
        return;
      }

      // If user is on root path and has data, redirect to dashboard
      if (hasExistingData && location.pathname === '/') {
        navigate('/dashboard');
        setIsChecking(false);
        return;
      }

      setIsChecking(false);
    };

    handleRouting();
  }, [
    isAuthenticated, 
    user, 
    authLoading, 
    financeLoading, 
    accounts, 
    goals, 
    bills, 
    liabilities, 
    userCategories, 
    location.pathname, 
    navigate
  ]);

  // Show loading while checking routing
  if (isChecking || authLoading || financeLoading) {
    return (
      <LoadingScreen 
        message="Setting up your financial app..." 
        submessage="Loading your data and preferences..."
      />
    );
  }

  return <>{children}</>;
};

export default RouteHandler;
