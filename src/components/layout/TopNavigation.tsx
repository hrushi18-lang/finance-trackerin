import React from 'react';
import { Plus } from 'lucide-react';
import { ResponsiveContainer } from '../common/ResponsiveContainer';

interface TopNavigationProps {
  title: string;
  showAdd?: boolean;
  onAdd?: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  title,
  showAdd = false,
  onAdd,
}) => {
  return (
    <header className="bg-forest-900/20 backdrop-blur-md border-b border-forest-700/30 sticky top-0 z-30">
      <ResponsiveContainer padding="md" maxWidth="full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-white">{title}</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            {showAdd && (
              <button
                onClick={onAdd}
                className="p-2 rounded-xl bg-forest-600 hover:bg-forest-700 transition-colors shadow-lg"
                aria-label="Add new item"
              >
                <Plus size={20} className="text-white" />
              </button>
            )}
          </div>
        </div>
      </ResponsiveContainer>
    </header>
  );
};