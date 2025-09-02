import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Target, Settings, Plus } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/overview', icon: BarChart3, label: 'Reports' },
    { path: '/goals', icon: Target, label: 'Goals' },
    { path: '/profile', icon: Settings, label: 'Settings' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-green-800/95 backdrop-blur-md safe-area-pb z-40" role="navigation" aria-label="Main navigation">
      <div className="flex justify-around items-center py-2 relative">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 transition-all duration-200 min-w-0 ${
                isActive
                  ? 'text-green-400'
                  : 'text-white/70 hover:text-white'
              }`
            }
            aria-label={`Navigate to ${label}`}
          >
            <Icon size={20} aria-hidden="true" />
            <span className="text-xs mt-1 font-medium truncate">{label}</span>
          </NavLink>
        ))}
        
        {/* Floating Add Button */}
        <button
          onClick={() => navigate('/add-transaction')}
          className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-400 transition-colors"
          aria-label="Add transaction"
        >
          <Plus size={24} className="text-white" />
        </button>
      </div>
    </nav>
  );
};