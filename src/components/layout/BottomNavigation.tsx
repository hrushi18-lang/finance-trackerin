import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  BarChart3, 
  CreditCard, 
  Calendar, 
  Building2,
  Plus,
  Grid3X3,
  Wallet,
  Activity
} from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname);

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/overview', icon: BarChart3, label: 'Overview' },
    { path: '/activities', icon: Activity, label: 'Activities' },
    { path: '/transactions', icon: Calendar, label: 'Transactions' },
    { path: '/accounts', icon: Building2, label: 'Accounts' },
  ];

  const handleTabClick = (path: string) => {
    setActiveTab(path);
    navigate(path);
  };

  const isActive = (path: string) => activeTab === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div
        className="px-6 py-4 mx-auto max-w-4xl rounded-t-3xl"
        style={{
          backgroundColor: 'var(--primary)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.12), 0 -2px 8px rgba(0,0,0,0.08)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderBottom: 'none'
        }}
      >
        <div className="flex items-center justify-between relative">
          {/* Navigation items */}
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isItemActive = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => handleTabClick(item.path)}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-2xl transition-all duration-300 min-w-0 flex-1 ${
                  isItemActive
                    ? 'text-white transform scale-105'
                    : 'text-white/70 hover:text-white hover:scale-105'
                }`}
                style={{
                  backgroundColor: isItemActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent'
                }}
              >
                <Icon 
                  size={22} 
                  className={`transition-all duration-300 ${
                    isItemActive ? 'animate-pulse' : ''
                  }`}
                />
                <span className="text-xs font-medium leading-tight text-center truncate">
                  {item.label}
                </span>
              </button>
            );
          })}
          
          {/* Central Floating Add Button */}
          <div className="absolute left-1/2 transform -translate-x-1/2 -top-6">
            <button
              onClick={() => navigate('/add-transaction')}
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
              style={{ 
                backgroundColor: 'var(--accent-light)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15)',
                border: '3px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <Plus size={28} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
