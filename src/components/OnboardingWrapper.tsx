import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import { useProfile } from '../contexts/ProfileContext';
import SimpleOnboardingFlow from './onboarding/SimpleOnboardingFlow';
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

      // ✅ FIXED: Check if user has a profile (definitive indicator of setup completion)
      const hasProfile = !!profile;
      
      // User is new if they don't have a profile
      // Profile existence means onboarding was completed
      const isNew = !hasProfile;
      setIsNewUser(isNew);

      // Track onboarding check
      analytics.trackEngagement('onboarding_check', {
        feature: 'onboarding_flow',
        is_new_user: isNew,
        has_profile: hasProfile,
        has_accounts: accounts.length > 0
      });

      // If user has profile, redirect to home (onboarding completed)
      if (hasProfile) {
        analytics.trackOnboardingStep('existing_user_redirect', true);
        navigate('/');
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
    <SimpleOnboardingFlow 
      onComplete={() => {
        // Track onboarding completion
        analytics.trackOnboardingStep('onboarding_completed', true);
        analytics.trackEngagement('onboarding_completed', {
          feature: 'onboarding_flow',
          completed_at: new Date().toISOString()
        });

        // Mark onboarding as completed
        localStorage.setItem('onboarding_completed', 'true');
        
        // ✅ NEW: Set flag to show welcome message
        localStorage.setItem('show_welcome_message', 'true');
        
        // Navigate to home
        navigate('/');
      }} 
    />
  );
};

export default OnboardingWrapper;
