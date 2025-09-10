import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Plus, Search } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { getCategoryColor, getCategoryIcon, getAllCategories, DEFAULT_CATEGORIES } from '../../utils/categories';
import { useFinance } from '../../contexts/FinanceContext';

interface CategorySelectorProps {
  value: string;
  onChange: (category: string) => void;
  type: 'transaction' | 'bill' | 'goal' | 'liability' | 'budget' | 'account';
  placeholder?: string;
  className?: string;
  error?: string;
  transactionType?: 'income' | 'expense' | 'transfer';
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  type,
  placeholder = 'Select category',
  className = '',
  error,
  transactionType
}) => {
  const { addUserCategory, userCategories } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Reset search term when transaction type changes
  useEffect(() => {
    setSearchTerm('');
    setIsLoading(true);
    // Simulate a brief loading state to show the interface is updating
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [transactionType]);

  // Get categories based on type and transaction type
  const getFilteredCategories = () => {
    if (type === 'transaction' && transactionType) {
      const baseCategories = transactionType === 'income' 
        ? DEFAULT_CATEGORIES.TRANSACTION.INCOME
        : transactionType === 'expense'
        ? DEFAULT_CATEGORIES.TRANSACTION.EXPENSE
        : [...DEFAULT_CATEGORIES.TRANSACTION.INCOME, ...DEFAULT_CATEGORIES.TRANSACTION.EXPENSE];
      
      // Get user categories from database
      const userCategoriesForType = userCategories.filter(cat => cat.type === (transactionType as any));
      const userCategoryNames = userCategoriesForType.map(cat => cat.name);
      
      return [...baseCategories, ...userCategoryNames];
    }
    
    // For non-transaction types, get default + user categories
    const defaultCategories = getAllCategories(type);
    const userCategoriesForType = userCategories.filter(cat => cat.type === (type as any));
    const userCategoryNames = userCategoriesForType.map(cat => cat.name);
    
    return [...defaultCategories, ...userCategoryNames];
  };

  const categories = getFilteredCategories();

  const handleCategorySelect = (category: string) => {
    onChange(category);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleAddCategory = async () => {
    if (newCategory.trim() && !categories.some(cat => cat.toLowerCase() === newCategory.trim().toLowerCase())) {
      try {
        setIsAdding(true);
        const categoryType = type === 'transaction' && transactionType ? transactionType : type as any;
        await addUserCategory({
          name: newCategory.trim(),
          type: categoryType,
          color: getCategoryColor(newCategory.trim()),
          icon: getCategoryIcon(newCategory.trim())
        });
        onChange(newCategory.trim());
        setNewCategory('');
        setShowAddForm(false);
        // Keep dropdown open so user can see their new category
      } catch (error) {
        console.error('Error adding category:', error);
        alert(`Failed to add category: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsAdding(false);
      }
    }
  };

  // Dynamic icon component
  const getIconComponent = (iconName: string) => {
    const Icon = (Icons as any)[iconName];
    return Icon ? <Icon size={16} className="text-gray-600 dark:text-gray-400" /> : 
      <div className="w-4 h-4 rounded-full bg-current opacity-60" />;
  };

  // Memoize filtered categories for performance
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    return categories.filter(category =>
      category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < filteredCategories.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCategories.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredCategories.length) {
          handleCategorySelect(filteredCategories[focusedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  // Reset focused index when dropdown opens/closes or categories change
  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen, filteredCategories]);

  return (
    <div className={`relative ${className}`} onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
          error ? 'border-red-500' : ''
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <span className="text-gray-500 dark:text-gray-400">Loading categories...</span>
            ) : value ? (
              <>
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getCategoryColor(value) }}
                />
                <span className="text-gray-900 dark:text-white">{value}</span>
              </>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
            )}
          </div>
          <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" />
        </div>
      </button>

      {error && (
        <p className="text-red-500 dark:text-red-400 text-sm mt-1">{error}</p>
      )}

      {isOpen && (
        <div 
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-hidden"
          role="listbox"
          aria-label="Category selection"
        >
          {/* Search */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-600">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Categories List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredCategories.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                  No categories found
                </div>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    Add "{searchTerm}" as new category
                  </button>
                )}
              </div>
            ) : (
              filteredCategories.map((category, index) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategorySelect(category)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors ${
                    index === focusedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  aria-selected={index === focusedIndex}
                >
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getCategoryColor(category) }}
                  />
                  {getIconComponent(getCategoryIcon(category))}
                  <span className="text-gray-900 dark:text-white text-sm">{category}</span>
                </button>
              ))
            )}
          </div>

          {/* Add Custom Category */}
          <div className="border-t border-gray-200 dark:border-gray-600 p-3">
            {!showAddForm ? (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
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
                  className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm"
                />
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCategory}
                    disabled={!newCategory.trim() || categories.includes(newCategory.trim()) || isAdding}
                    className="flex-1"
                  >
                    {isAdding ? 'Adding...' : 'Add'}
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
