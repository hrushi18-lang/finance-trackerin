import React from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer } from '../common/ResponsiveContainer';

interface TopNavigationProps {
  title: string;
  showAdd?: boolean;
  onAdd?: () => void;
  showBack?: boolean;
  onBack?: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  title,
  showAdd = false,
  onAdd,
  showBack = false,
  onBack,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="bg-forest-900/20 backdrop-blur-md border-b border-forest-700/30 sticky top-0 z-30">
      <ResponsiveContainer padding="md" maxWidth="full">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {showBack && (
              <button
                onClick={handleBack}
                className="p-2 rounded-xl bg-forest-800/50 hover:bg-forest-700/50 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft size={20} className="text-forest-300" />
              </button>
            )}
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