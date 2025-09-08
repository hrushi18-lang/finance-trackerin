import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContextOffline';
import EnhancedOnboardingFlow from './onboarding/EnhancedOnboardingFlow';
import { analytics } from '../utils/analytics';
import { LoadingScreen } from './common/LoadingScreen';

const OnboardingWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { accounts, goals, bills, liabilities, userCategories, loading } = useFinance();
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      // Wait for data to load
      if (loading) {
        return;
      }

      // Check if user has existing data
      const hasExistingData = 
        accounts.length > 0 || 
        goals.length > 0 || 
        bills.length > 0 || 
        liabilities.length > 0 || 
        userCategories.length > 0;

      const isNew = !hasExistingData;
      setIsNewUser(isNew);

      // Track onboarding check
      analytics.trackEngagement('onboarding_check', {
        feature: 'onboarding_flow',
        is_new_user: isNew,
        has_accounts: accounts.length > 0,
        has_goals: goals.length > 0,
        has_bills: bills.length > 0,
        has_liabilities: liabilities.length > 0,
        has_custom_categories: userCategories.length > 0
      });

      // If user has existing data, redirect to dashboard
      if (!isNew) {
        analytics.trackOnboardingStep('existing_user_redirect', true);
        navigate('/dashboard');
        return;
      }

      setIsChecking(false);
    };

    checkUserStatus();
  }, [user, accounts, goals, bills, liabilities, userCategories, loading, navigate]);

  // Show loading while checking user status
  if (isChecking || loading) {
    return (
      <LoadingScreen 
        message="Checking your account..." 
        submessage="Determining if you need onboarding..."
      />
    );
  }

  // If not a new user, this shouldn't render (redirected above)
  if (isNewUser === false) {
    return null;
  }

  // Show onboarding for new users
  return (
    <EnhancedOnboardingFlow 
      onComplete={() => {
        // Track onboarding completion
        analytics.trackOnboardingStep('onboarding_completed', true);
        analytics.trackEngagement('onboarding_completed', {
          feature: 'onboarding_flow',
          completed_at: new Date().toISOString()
        });

        // Redirect to dashboard
        navigate('/dashboard');
      }} 
    />
  );
};

export default OnboardingWrapper;
