import React from 'react';
import { Settings, Bell, Calendar, TrendingUp, Fingerprint } from 'lucide-react';
import { Button } from '../common/Button';
import { useForm } from 'react-hook-form';
import { Capacitor } from '@capacitor/core';

interface PreferencesData {
  budgetPeriod: 'weekly' | 'monthly' | 'yearly';
  notifications: {
    budgetAlerts: boolean;
    goalReminders: boolean;
    billReminders: boolean;
    weeklyReports: boolean;
  };
  startOfWeek: 'sunday' | 'monday';
  theme: 'light' | 'dark' | 'auto';
  biometricEnabled?: boolean;
}

interface OnboardingPreferencesProps {
  onNext: (data: PreferencesData) => void;
  onPrev: () => void;
  initialData?: Partial<PreferencesData>;
  canGoBack?: boolean;
}

export const OnboardingPreferences: React.FC<OnboardingPreferencesProps> = ({ 
  onNext, 
  onPrev, 
  initialData,
  canGoBack = true
}) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<PreferencesData>({
    defaultValues: {
      budgetPeriod: 'monthly',
      notifications: {
        budgetAlerts: true,
        goalReminders: true,
        billReminders: true,
        weeklyReports: false,
      },
      startOfWeek: 'monday',
      theme: 'auto',
      biometricEnabled: false,
      ...initialData
    }
  });

  const budgetPeriod = watch('budgetPeriod');
  const theme = watch('theme');
  const startOfWeek = watch('startOfWeek');
  const biometricEnabled = watch('biometricEnabled');
  const isNative = Capacitor.isNativePlatform();

  const budgetPeriods = [
    { value: 'weekly', label: 'Weekly', description: 'Track weekly spending' },
    { value: 'monthly', label: 'Monthly', description: 'Most common choice' },
    { value: 'yearly', label: 'Yearly', description: 'Annual planning' },
  ];

  const themeOptions = [
    { value: 'light', label: 'Light', description: 'Clean and bright', icon: '☀️' },
    { value: 'dark', label: 'Dark', description: 'Easy on the eyes', icon: '🌙' },
    { value: 'auto', label: 'Auto', description: 'Follow system setting', icon: '🔄' },
  ];

  const onSubmit = (data: PreferencesData) => {
    onNext(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings size={32} className="text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">🤖 Activate Your Financial Coach</h2>
        <p className="text-gray-400">Set up smart reminders to keep you on track</p>
      </div>

      {/* Coach Benefits */}
      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-4 border border-purple-500/30">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h3 className="font-semibold text-white mb-2">🎯 Your Personal Financial Coach</h3>
            <div className="text-sm text-gray-300 space-y-1">
              <p>• <strong className="text-purple-400">Bill Reminders:</strong> Never miss rent, phone bills, or EMI payments</p>
              <p>• <strong className="text-blue-400">Budget Alerts:</strong> Get warned before you overspend in any category</p>
              <p>• <strong className="text-green-400">Goal Nudges:</strong> Gentle reminders to save for your dreams</p>
              <p>• <strong className="text-yellow-400">Smart Tips:</strong> Personalized advice based on your spending patterns</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Budget Period */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            <Calendar size={18} className="inline mr-2" />
            Default Budget Period
          </label>
          <div className="space-y-2">
            {budgetPeriods.map((period) => (
              <label key={period.value} className="cursor-pointer">
                <input
                  type="radio"
                  value={period.value}
                  {...register('budgetPeriod')}
                  className="sr-only"
                />
                <div className={`p-3 rounded-lg border-2 transition-colors ${
                  budgetPeriod === period.value 
                    ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                    : 'border-white/20 hover:border-white/30 text-gray-300'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{period.label}</p>
                      <p className="text-sm opacity-80">{period.description}</p>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            <Bell size={18} className="inline mr-2 text-yellow-400" />
            Smart Coaching Alerts (Highly Recommended!)
          </label>
          <div className="space-y-3 bg-black/20 rounded-lg p-4 border border-white/10">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-white">💰 Budget Alerts</p>
                <p className="text-sm text-gray-400">Your coach warns you before overspending</p>
              </div>
              <input
                type="checkbox"
                {...register('notifications.budgetAlerts')}
                className="rounded border-gray-600 text-primary-500 focus:ring-primary-500 bg-black/20"
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-white">🎯 Goal Reminders</p>
                <p className="text-sm text-gray-400">Stay motivated with progress updates</p>
              </div>
              <input
                type="checkbox"
                {...register('notifications.goalReminders')}
                className="rounded border-gray-600 text-primary-500 focus:ring-primary-500 bg-black/20"
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-white">📅 Bill Reminders</p>
                <p className="text-sm text-gray-400">Never miss rent, phone bills, or EMI payments</p>
              </div>
              <input
                type="checkbox"
                {...register('notifications.billReminders')}
                className="rounded border-gray-600 text-primary-500 focus:ring-primary-500 bg-black/20"
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-white">📊 Weekly Money Reports</p>
                <p className="text-sm text-gray-400">See how you're doing and get coaching tips</p>
              </div>
              <input
                type="checkbox"
                {...register('notifications.weeklyReports')}
                className="rounded border-gray-600 text-primary-500 focus:ring-primary-500 bg-black/20"
              />
            </label>
          </div>
        </div>
        
        {/* Notification Benefits */}
        <div className="bg-yellow-500/20 rounded-lg p-4 border border-yellow-500/30">
          <div className="flex items-start space-x-2">
            <span className="text-yellow-400 mt-0.5">💡</span>
            <p className="text-yellow-300 text-sm">
              <strong>🎓 Student Success Tip:</strong> Students who use reminders are 3x more likely to stick to their budgets and reach their goals. 
              Your coach will send gentle nudges, not annoying spam!
            </p>
          </div>
        </div>

        {/* Week Start */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Week Starts On
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="cursor-pointer">
              <input
                type="radio"
                value="sunday"
                {...register('startOfWeek')}
                className="sr-only"
              />
              <div className={`p-3 rounded-lg border-2 text-center transition-colors ${
                startOfWeek === 'sunday' 
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <p className="font-medium">Sunday</p>
              </div>
            </label>
            
            <label className="cursor-pointer">
              <input
                type="radio"
                value="monday"
                {...register('startOfWeek')}
                className="sr-only"
              />
              <div className={`p-3 rounded-lg border-2 text-center transition-colors ${
                startOfWeek === 'monday' 
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <p className="font-medium">Monday</p>
              </div>
            </label>
          </div>
        </div>

        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            App Theme
          </label>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => (
              <label key={option.value} className="cursor-pointer">
                <input
                  type="radio"
                  value={option.value}
                  {...register('theme')}
                  className="sr-only"
                />
                <div className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  theme === option.value 
                    ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                    : 'border-white/20 hover:border-white/30 text-gray-300'
                }`}>
                  <div className="text-2xl mb-1">{option.icon}</div>
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs opacity-80">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Biometric Authentication - Only for mobile */}
        {isNative && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              <Fingerprint size={18} className="inline mr-2" />
              Biometric Authentication
            </label>
            <label className="cursor-pointer">
              <input
                type="checkbox"
                {...register('biometricEnabled')}
                className="sr-only"
              />
              <div className={`p-3 rounded-lg border-2 transition-colors ${
                biometricEnabled
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Biometrics</p>
                    <p className="text-sm opacity-80">Sign in with fingerprint or face ID</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    biometricEnabled ? 'bg-primary-500' : 'bg-gray-600'
                  }`}>
                    {biometricEnabled ? '✓' : ''}
                  </div>
                </div>
              </div>
            </label>
          </div>
        )}

        {/* Navigation */}
        <div className="flex space-x-3 pt-4">
          {canGoBack && (
            <Button type="button" variant="outline" onClick={onPrev} className="flex-1">
              Back
            </Button>
          )}
          <Button type="submit" className="flex-1">
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
};