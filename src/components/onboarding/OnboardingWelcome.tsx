import React from 'react';
import { TrendingUp, DollarSign, Target, PieChart, Calendar, Shield, Globe, Sparkles, Users, Heart } from 'lucide-react';
import { Button } from '../common/Button';
import { useTranslation } from 'react-i18next';

interface OnboardingWelcomeProps {
  onNext: () => void;
}

export const OnboardingWelcome: React.FC<OnboardingWelcomeProps> = ({ onNext }) => {
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ];

  return (
    <div className="text-center space-y-6 relative">
      {/* Language Selector */}
      <div className="flex justify-center space-x-2 mb-6">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
              i18n.language === lang.code
                ? 'bg-primary-500 text-white shadow-lg'
                : 'bg-black/20 text-gray-300 hover:bg-white/10'
            }`}
          >
            <span className="mr-1">{lang.flag}</span>
            {lang.name}
          </button>
        ))}
      </div>

      {/* Hero Section */}
      <div className="space-y-6">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
            <TrendingUp size={48} className="text-white" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles size={20} className="text-yellow-400 animate-bounce" />
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
            Welcome to <span className="text-primary-400 bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">FinTrack</span>
          </h1>
          <p className="text-xl sm:text-2xl font-medium text-primary-300 mb-2">
            Your Personal Finance Coach
          </p>
          <p className="text-base sm:text-lg text-gray-300 max-w-md mx-auto">
            Built for students and young adults who want to take control of their money through active participation and smart tracking.
          </p>
        </div>
        
        {/* Global Visual Cues */}
        <div className="flex justify-center items-center space-x-4 text-2xl opacity-60">
          <span>💰</span>
          <span>€</span>
          <span>£</span>
          <span>¥</span>
          <span>₹</span>
          <span>$</span>
        </div>
        
        {/* Diverse User Representation */}
        <div className="flex justify-center items-center space-x-2 text-3xl">
          <span>👨‍💼</span>
          <span>👩‍🎓</span>
          <span>👨‍💻</span>
          <span>👩‍🏫</span>
          <span>👨‍🔬</span>
        </div>
      </div>

      {/* Key Features Preview */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl border border-green-500/30 hover:scale-105 transition-transform">
          <span className="text-2xl mb-3 block">🧠</span>
          <h3 className="font-semibold text-white mb-1">Build Money Habits</h3>
          <p className="text-xs text-gray-300">Manual tracking = better awareness</p>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl border border-blue-500/30 hover:scale-105 transition-transform">
          <span className="text-2xl mb-3 block">🎓</span>
          <h3 className="font-semibold text-white mb-1">Student-Focused</h3>
          <p className="text-xs text-gray-300">Goals that matter to you</p>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl border border-purple-500/30 hover:scale-105 transition-transform">
          <span className="text-2xl mb-3 block">🔔</span>
          <h3 className="font-semibold text-white mb-1">Smart Coaching</h3>
          <p className="text-xs text-gray-300">Personalized money tips</p>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl border border-orange-500/30 hover:scale-105 transition-transform">
          <span className="text-2xl mb-3 block">💪</span>
          <h3 className="font-semibold text-white mb-1">Real Discipline</h3>
          <p className="text-xs text-gray-300">No autopilot spending</p>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-500/20">
        <div className="flex items-center justify-center space-x-4 sm:space-x-6 text-xs sm:text-sm text-gray-300">
          <div className="flex items-center space-x-2">
            <span className="text-green-400">🎯</span>
            <span>Manual = Mindful</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-blue-400">🧠</span>
            <span>Builds Awareness</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-red-400">🔒</span>
            <span>Secure & Private</span>
          </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
          Meet Your <span className="text-primary-400 bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">Financial Coach</span>
        </h1>
        <p className="text-xl sm:text-2xl font-medium text-primary-300 mb-4">
          FinTrack - Build Money Discipline Through Manual Tracking
        <h3 className="font-semibold text-white mb-2">🚀 Your Financial Coach Awaits</h3>
        <p className="text-base sm:text-lg text-gray-300 max-w-lg mx-auto leading-relaxed">
          Unlike apps that just show you numbers, FinTrack makes you <strong className="text-white">actively engage</strong> with every transaction. 
          In just 2 minutes, we'll set up your personal financial coaching system. Every transaction you manually track makes you more aware of your spending patterns and builds lasting money discipline.
        </p>
      </div>

      <Button onClick={onNext} className="w-full py-4 text-lg bg-gradient-to-r from-primary-500 to-blue-500 hover:from-primary-600 hover:to-blue-600 shadow-xl">
        <span className="text-xl mr-2">🎓</span>
        Start My Financial Journey
      </Button>
      
      <p className="text-xs text-gray-500">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
};