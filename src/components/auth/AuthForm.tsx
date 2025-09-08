import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { authManager } from '../../lib/auth';
import { Chrome } from 'lucide-react';

interface AuthFormProps {
  mode: 'signin' | 'signup' | 'reset';
  onModeChange: (mode: 'signin' | 'signup' | 'reset') => void;
  onSuccess?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode, onModeChange, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let result;

      switch (mode) {
        case 'signup':
          if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
          }
          result = await authManager.signUp(formData.email, formData.password, formData.name);
          break;
        
        case 'signin':
          result = await authManager.signIn(formData.email, formData.password);
          break;
        
        case 'reset':
          result = await authManager.resetPassword(formData.email);
          break;
        
        default:
          throw new Error('Invalid mode');
      }

      if (result.success) {
        if (mode === 'reset') {
          setSuccess(result.message || 'Password reset email sent');
        } else {
          setSuccess('Success!');
          onSuccess?.();
        }
      } else {
        setError(result.error || 'An error occurred');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let result;
      if (mode === 'signup') {
        result = await authManager.signUpWithGoogle();
      } else {
        result = await authManager.signInWithGoogle();
      }

      if (result.success) {
        setSuccess('Redirecting to Google...');
        // The OAuth flow will handle the redirect
      } else {
        setError(result.error || 'Google authentication failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google authentication failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const isFormValid = () => {
    switch (mode) {
      case 'signup':
        return formData.email && formData.password && formData.confirmPassword && formData.name;
      case 'signin':
        return formData.email && formData.password;
      case 'reset':
        return formData.email;
      default:
        return false;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
          {mode === 'signin' && 'Welcome Back'}
          {mode === 'signup' && 'Create Account'}
          {mode === 'reset' && 'Reset Password'}
        </h1>
        <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
          {mode === 'signin' && 'Sign in to manage your finances'}
          {mode === 'signup' && 'Start tracking your financial journey'}
          {mode === 'reset' && 'Enter your email to reset your password'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <Input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
          />
        )}

        <Input
          type="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          required
        />

        {mode !== 'reset' && (
          <Input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            required
          />
        )}

        {mode === 'signup' && (
          <Input
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            required
          />
        )}

        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--error)', color: 'white' }}>
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--success)', color: 'white' }}>
            {success}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={!isFormValid() || loading}
        >
          {mode === 'signin' && 'Sign In'}
          {mode === 'signup' && 'Create Account'}
          {mode === 'reset' && 'Send Reset Email'}
        </Button>
      </form>

      {/* Google OAuth Section */}
      {mode !== 'reset' && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--border)' }} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2" style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)' }}>
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            loading={googleLoading}
            disabled={googleLoading}
            onClick={handleGoogleAuth}
            className="flex items-center justify-center space-x-2"
          >
            <Chrome size={20} />
            <span>
              {mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
            </span>
          </Button>
        </>
      )}

      <div className="mt-6 text-center space-y-2">
        {mode === 'signin' && (
          <>
            <button
              onClick={() => onModeChange('reset')}
              className="text-sm font-body hover:underline"
              style={{ color: 'var(--text-secondary)' }}
            >
              Forgot your password?
            </button>
            <div className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>
              Don't have an account?{' '}
              <button
                onClick={() => onModeChange('signup')}
                className="hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                Sign up
              </button>
            </div>
          </>
        )}

        {mode === 'signup' && (
          <div className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>
            Already have an account?{' '}
            <button
              onClick={() => onModeChange('signin')}
              className="hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              Sign in
            </button>
          </div>
        )}

        {mode === 'reset' && (
          <div className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>
            Remember your password?{' '}
            <button
              onClick={() => onModeChange('signin')}
              className="hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              Sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
