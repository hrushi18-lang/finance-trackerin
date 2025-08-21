import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, BarChart3, Target, PieChart, CreditCard, Calendar, Settings } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const { t } = useTranslation();

  const navItems = [
    { path: '/', icon: Home, label: t('navigation.home') },
    { path: '/overview', icon: BarChart3, label: 'Overview' },
    { path: '/goals', icon: Target, label: 'Goals' },
    { path: '/budgets', icon: PieChart, label: 'Budgets' },
    { path: '/liabilities', icon: CreditCard, label: 'Debts' },
    { path: '/bills', icon: Calendar, label: 'Bills' },
    { path: '/profile', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-forest-900/95 backdrop-blur-md border-t border-forest-700 safe-area-pb z-40">
      <div className="flex justify-around items-center py-1 sm:py-2">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 ${
                isActive
                  ? 'text-forest-400 bg-forest-500/10'
                  : 'text-gray-500 hover:text-forest-400 hover:bg-forest-700'
              }`
            }
          >
            <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="text-xs mt-1 font-body font-medium truncate">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};