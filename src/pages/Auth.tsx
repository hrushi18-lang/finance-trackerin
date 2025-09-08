import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '../components/auth/AuthForm';
import { authManager } from '../lib/auth';

const Auth: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const unsubscribe = authManager.subscribe((authState) => {
      if (authState.user && !authState.loading) {
        navigate('/');
      }
    });

    return unsubscribe;
  }, [navigate]);

  const handleSuccess = () => {
    if (mode === 'signin') {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
            <span className="text-2xl font-bold text-white">F</span>
          </div>
          <h1 className="text-2xl font-heading" style={{ color: 'var(--text-primary)' }}>
            FinTrack
          </h1>
          <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
            Your Personal Finance Manager
          </p>
        </div>

        {/* Auth Form */}
        <div
          className="p-8 rounded-2xl"
          style={{
            backgroundColor: 'var(--background)',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
          }}
        >
          <AuthForm
            mode={mode}
            onModeChange={setMode}
            onSuccess={handleSuccess}
          />
        </div>

        {/* Features */}
        <div className="mt-8 text-center">
          <p className="text-xs font-body mb-4" style={{ color: 'var(--text-tertiary)' }}>
            Track expenses, manage budgets, and achieve your financial goals
          </p>
          <div className="flex justify-center space-x-6 text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>
            <span>📊 Analytics</span>
            <span>💰 Budgets</span>
            <span>🎯 Goals</span>
            <span>📱 Offline</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
