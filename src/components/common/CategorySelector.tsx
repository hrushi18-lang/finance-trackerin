import React, { useState } from 'react';
import { ChevronDown, Plus, X, Search } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { getCategoryColor, getCategoryIcon, getAllCategories, addCustomCategory } from '../../utils/categories';

interface CategorySelectorProps {
  value: string;
  onChange: (category: string) => void;
  type: 'transaction' | 'bill' | 'goal' | 'liability' | 'budget' | 'account';
  placeholder?: string;
  className?: string;
  error?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  type,
  placeholder = 'Select category',
  className = '',
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const categories = getAllCategories(type);
  const filteredCategories = categories.filter(category =>
    category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategorySelect = (category: string) => {
    onChange(category);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      addCustomCategory(newCategory.trim(), type);
      onChange(newCategory.trim());
      setNewCategory('');
      setShowAddForm(false);
      setIsOpen(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    // This would need to be dynamically imported from lucide-react
    // For now, we'll use a simple approach
    return <div className="w-4 h-4 rounded-full bg-current opacity-60" />;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-black/40 border border-white/20 text-white rounded-lg px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
          error ? 'border-red-500' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {value ? (
              <>
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getCategoryColor(value) }}
                />
                <span className="text-white">{value}</span>
              </>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </div>
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      </button>

      {error && (
        <p className="text-red-400 text-sm mt-1">{error}</p>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-black/90 backdrop-blur-md border border-white/20 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black/40 border-white/20 text-white"
              />
            </div>
          </div>

          {/* Categories List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategorySelect(category)}
                className="w-full px-3 py-2 text-left hover:bg-white/10 flex items-center space-x-3 transition-colors"
              >
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getCategoryColor(category) }}
                />
                <span className="text-white text-sm">{category}</span>
              </button>
            ))}
          </div>

          {/* Add Custom Category */}
          <div className="border-t border-white/10 p-3">
            {!showAddForm ? (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center space-x-2 text-primary-400 hover:text-primary-300 transition-colors"
              >
                <Plus size={16} />
                <span className="text-sm">Add Custom Category</span>
              </button>
            ) : (
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter category name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="bg-black/40 border-white/20 text-white text-sm"
                />
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCategory}
                    disabled={!newCategory.trim() || categories.includes(newCategory.trim())}
                    className="flex-1"
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewCategory('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
