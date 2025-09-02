import React, { useState, useEffect } from 'react';
import { Wallet, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { useAuth } from '../contexts/AuthContext';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { user, authStatus } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      // Add a small delay to ensure complete authentication
      const redirectTimer = setTimeout(() => {
        const completed = localStorage.getItem('onboardingCompleted') === 'true';
        navigate(completed ? '/' : '/onboarding');
      }, 1000);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [user, navigate]);

  // Redirect to onboarding after successful registration
  useEffect(() => {
    if (authStatus === 'success' && !isLogin) {
      // Extend timeout to ensure backend operations complete
      const timer = setTimeout(() => {
        navigate('/onboarding');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [authStatus, isLogin, navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-forest-800">
      {/* Static Forest Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-forest-900 via-forest-800 to-forest-700"></div>
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-forest-600 to-forest-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-forest-600/20">
            <Wallet size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-white mb-2">FinTrack</h1>
          <p className="text-forest-200 text-lg font-body">
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-forest-900/30 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-forest-600/20 shadow-xl">
          {isLogin ? (
            <LoginForm onToggleMode={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onToggleMode={() => setIsLogin(true)} />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-forest-300 font-body">
            &copy; {new Date().getFullYear()} FinTrack. All rights reserved.
          </p>
          <div className="flex justify-center space-x-4 mt-2">
            <a href="#" className="text-xs text-forest-400 hover:text-forest-300 font-body">Privacy Policy</a>
            <a href="#" className="text-xs text-forest-400 hover:text-forest-300 font-body">Terms of Service</a>
            <a href="#" className="text-xs text-forest-400 hover:text-forest-300 font-body">Contact</a>
          </div>
        </div>
      </div>
    </div>
  );
};