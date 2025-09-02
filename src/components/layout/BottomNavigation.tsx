import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Target, 
  PieChart, 
  CreditCard, 
  Receipt, 
  BarChart3, 
  User,
  Plus
} from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname);

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/goals', icon: Target, label: 'Goals' },
    { path: '/budgets', icon: PieChart, label: 'Budgets' },
    { path: '/liabilities', icon: CreditCard, label: 'Liabilities' },
    { path: '/bills', icon: Receipt, label: 'Bills' },
    { path: '/overview', icon: BarChart3, label: 'Overview' },
    { path: '/accounts', icon: User, label: 'Accounts' },
  ];

  const handleTabClick = (path: string) => {
    setActiveTab(path);
    navigate(path);
  };

  const isActive = (path: string) => activeTab === path;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div 
        className="px-4 py-3 mx-auto max-w-4xl rounded-2xl"
        style={{ 
          backgroundColor: 'var(--primary)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-light)'
        }}
      >
        <div className="flex items-center justify-between">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isItemActive = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => handleTabClick(item.path)}
                className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-xl transition-all duration-300 ${
                  isItemActive
                    ? 'text-white transform scale-110'
                    : 'text-white/70 hover:text-white hover:scale-105'
                }`}
                style={{
                  backgroundColor: isItemActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
                }}
              >
                <Icon 
                  size={18} 
                  className={`transition-all duration-300 ${
                    isItemActive ? 'animate-pulse' : ''
                  }`}
                />
                <span className="text-xs font-medium leading-tight text-center">
                  {item.label}
                </span>
              </button>
            );
          })}
          
          {/* Central Add Transaction Button */}
          <div className="relative">
            <button
              onClick={() => navigate('/add-transaction')}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
              style={{ 
                backgroundColor: 'var(--accent-light)',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <Plus size={20} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};