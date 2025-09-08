import React, { useState } from 'react';
import { PieChart, Plus, Trash2 } from 'lucide-react';
import { Button } from '../common/Button';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface BudgetData {
  category: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
}

interface OnboardingBudgetsProps {
  onNext: (data: { budgets: BudgetData[] }) => void;
  onPrev: () => void;
  initialData?: { budgets?: BudgetData[] };
  canGoBack?: boolean;
}

export const OnboardingBudgets: React.FC<OnboardingBudgetsProps> = ({ 
  onNext, 
  onPrev, 
  initialData,
  canGoBack = true
}) => {
  const { currency } = useInternationalization();
  const [budgets, setBudgets] = useState<BudgetData[]>(initialData?.budgets || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBudget, setNewBudget] = useState<BudgetData>({
    category: '',
    amount: 0,
    period: 'monthly'
  });

  const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Other'];

  const addBudget = () => {
    if (newBudget.category && newBudget.amount > 0) {
      setBudgets([...budgets, { ...newBudget }]);
      setNewBudget({ category: '', amount: 0, period: 'monthly' });
      setShowAddForm(false);
    }
  };

  const removeBudget = (index: number) => {
    setBudgets(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    onNext({ budgets });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <PieChart size={32} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Set Up Budgets</h2>
        <p className="text-gray-400">Set monthly caps per category or overall</p>
      </div>

      {/* Budgets List */}
      <div className="space-y-3">
        {budgets.map((budget, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/10">
            <div>
              <p className="font-medium text-white">{budget.category}</p>
              <p className="text-sm text-gray-400 capitalize">{budget.period}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="font-semibold text-white">{currency.symbol}{budget.amount}</span>
              <button
                onClick={() => removeBudget(index)}
                className="p-1 hover:bg-error-500/20 rounded transition-colors"
              >
                <Trash2 size={14} className="text-error-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Budget Form */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-4 border-2 border-dashed border-white/20 rounded-xl text-gray-300 hover:border-white/30 hover:text-white transition-all flex items-center justify-center space-x-2"
        >
          <Plus size={18} />
          <span>Add Budget</span>
        </button>
      ) : (
        <div className="bg-black/20 rounded-xl p-4 border border-white/10 space-y-4">
          <select
            value={newBudget.category}
            onChange={(e) => setNewBudget(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white"
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Amount"
              value={newBudget.amount || ''}
              onChange={(e) => setNewBudget(prev => ({ ...prev, amount: Number(e.target.value) }))}
              className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400"
            />
            
            <select
              value={newBudget.period}
              onChange={(e) => setNewBudget(prev => ({ ...prev, period: e.target.value as any }))}
              className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={() => setShowAddForm(false)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={addBudget}
              size="sm"
              className="flex-1"
              disabled={!newBudget.category || newBudget.amount <= 0}
            >
              Add Budget
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex space-x-3 pt-4">
        {canGoBack && (
          <Button type="button" variant="outline" onClick={onPrev} className="flex-1">
            Back
          </Button>
        )}
        <Button onClick={handleContinue} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
};
