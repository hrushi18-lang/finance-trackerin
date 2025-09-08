import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingScreen } from './common/LoadingScreen';

interface RouteHandlerProps {
  children: React.ReactNode;
}

const RouteHandler: React.FC<RouteHandlerProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
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

      // For authenticated users, let the AppInitializer handle the routing logic
      // based on finance data availability
      setIsChecking(false);
    };

    handleRouting();
  }, [
    isAuthenticated, 
    user, 
    authLoading, 
    location.pathname, 
    navigate
  ]);

  // Show loading while checking routing
  if (isChecking || authLoading) {
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
