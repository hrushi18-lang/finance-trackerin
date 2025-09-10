import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import { useProfile } from '../contexts/ProfileContext';
import EnhancedOnboardingFlow from './onboarding/EnhancedOnboardingFlow';
import { analytics } from '../utils/analytics';
import { LoadingScreen } from './common/LoadingScreen';

const OnboardingWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { accounts, goals, bills, liabilities, userCategories, loading: financeLoading } = useFinance();
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      // Wait for profile and finance data to load
      if (profileLoading || financeLoading) {
        return;
      }

      // Check if user has a profile (primary indicator of setup completion)
      const hasProfile = !!profile;
      
      // Also check if user has existing financial data
      const hasExistingData = 
        accounts.length > 0 || 
        goals.length > 0 || 
        bills.length > 0 || 
        liabilities.length > 0 || 
        userCategories.length > 0;

      // User is new if they don't have a profile OR no financial data
      const isNew = !hasProfile || !hasExistingData;
      setIsNewUser(isNew);

      // Track onboarding check
      analytics.trackEngagement('onboarding_check', {
        feature: 'onboarding_flow',
        is_new_user: isNew,
        has_profile: hasProfile,
        has_accounts: accounts.length > 0,
        has_goals: goals.length > 0,
        has_bills: bills.length > 0,
        has_liabilities: liabilities.length > 0,
        has_custom_categories: userCategories.length > 0
      });

      // If user has profile and data, redirect to dashboard
      if (hasProfile && hasExistingData) {
        analytics.trackOnboardingStep('existing_user_redirect', true);
        navigate('/dashboard');
        return;
      }

      setIsChecking(false);
    };

    checkUserStatus();
  }, [user, profile, profileLoading, accounts, goals, bills, liabilities, userCategories, financeLoading, navigate]);

  // Show loading while checking user status
  if (isChecking || profileLoading || financeLoading) {
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
