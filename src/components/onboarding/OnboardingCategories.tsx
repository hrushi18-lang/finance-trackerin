import React, { useState } from 'react';
import { Tag, Plus, Check } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input'; // Added Input
interface CategoryData {
  id: string;
  name: string;
  icon: string;
  selected: boolean;
}

interface OnboardingCategoriesProps {
  onNext: (data: { selectedCategories: string[], customCategories: string[] }) => void;
  onPrev: () => void;
  initialData?: { selectedCategories?: string[], customCategories?: string[] };
  canGoBack?: boolean;
}

export const OnboardingCategories: React.FC<OnboardingCategoriesProps> = ({ 
  onNext, 
  onPrev, 
  initialData,
  canGoBack = true
}) => {
  const [defaultCategories, setDefaultCategories] = useState<CategoryData[]>([
    { id: 'food', name: 'Food', icon: '🍽️', selected: true },
    { id: 'transport', name: 'Transport', icon: '🚗', selected: true },
    { id: 'bills', name: 'Bills', icon: '📄', selected: true },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬', selected: false },
    { id: 'health', name: 'Health', icon: '🏥', selected: false },
    { id: 'education', name: 'Education', icon: '📚', selected: false },
    { id: 'savings', name: 'Savings', icon: '💰', selected: true },
    { id: 'investments', name: 'Investments', icon: '📈', selected: false },
    { id: 'misc', name: 'Misc', icon: '📦', selected: false }
  ]);

  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const toggleCategory = (categoryId: string) => {
    setDefaultCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId ? { ...cat, selected: !cat.selected } : cat
      )
    );
  };

  const addCustomCategory = () => {
    if (newCategoryName.trim()) {
      setCustomCategories([...customCategories, newCategoryName.trim()]);
      setNewCategoryName('');
      setShowAddForm(false);
    }
  };

  const removeCustomCategory = (index: number) => {
    setCustomCategories(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    const selectedCategories = defaultCategories
      .filter(cat => cat.selected)
      .map(cat => cat.name);
    
    onNext({ selectedCategories, customCategories });
  };

  return (
    <div className="min-h-screen bg-forest-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-forest-700/80 backdrop-blur-md rounded-3xl p-8 border border-forest-600/30 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-heading font-bold text-white mb-2">
              Select Categories
            </h2>
            <p className="text-forest-200 font-body">
              Choose your spending categories. You can add your own.
            </p>
          </div>

          {/* Default Categories */}
          <div className="mb-6">
            <h3 className="text-lg font-heading font-semibold text-white mb-4">Default Categories</h3>
            <div className="grid grid-cols-3 gap-3">
              {defaultCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`relative p-4 rounded-2xl border-2 transition-all ${
                    category.selected
                      ? 'border-white bg-white/10 text-white'
                      : 'border-forest-500/30 text-forest-300 hover:border-forest-400/50'
                  }`}
                >
                  {category.selected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <Check size={14} className="text-forest-800" />
                    </div>
                  )}
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <div className="text-xs font-body font-medium">{category.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Categories */}
          <div className="mb-8">
            <h3 className="text-lg font-heading font-semibold text-white mb-4">Custom Categories</h3>
            
            {customCategories.length > 0 && (
              <div className="space-y-2 mb-4">
                {customCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-forest-600/30 rounded-xl border border-forest-500/30">
                    <span className="text-white font-body">{category}</span>
                    <button
                      onClick={() => removeCustomCategory(index)}
                      className="text-forest-300 hover:text-white transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-3 border border-forest-500/30 rounded-xl text-forest-300 hover:border-forest-400/50 hover:text-forest-200 transition-all flex items-center justify-center space-x-2 font-body"
              >
                <Plus size={16} />
                <span>Add custom category</span>
              </button>
            ) : (
              <div className="space-y-3">
                <Input // Changed to Input
                  type="text"
                  placeholder="Add subcategory (e.g., Coffee)"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full bg-forest-600/30 border border-forest-500/30 rounded-xl text-white placeholder-forest-300 focus:border-forest-400 transition-all font-body"
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={addCustomCategory}
                    size="sm"
                    className="flex-1 bg-forest-600 hover:bg-forest-700"
                  >
                    Add
                  </Button>
                  <Button
                    onClick={() => setShowAddForm(false)}
                    size="sm"
                    variant="outline"
                    className="flex-1 border-forest-500/30 text-forest-300"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            className="w-full py-4 text-lg font-heading font-semibold bg-white text-forest-800 hover:bg-forest-50 rounded-2xl shadow-lg transition-all"
            disabled={defaultCategories.filter(cat => cat.selected).length === 0 && customCategories.length === 0}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};