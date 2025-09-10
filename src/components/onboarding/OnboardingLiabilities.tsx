import React, { useState } from 'react';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { Button } from '../common/Button';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface LiabilityData {
  name: string;
  amount: number;
  type: 'loan' | 'credit_card' | 'other';
}

interface OnboardingLiabilitiesProps {
  onNext: (data: { liabilities: LiabilityData[] }) => void;
  onPrev: () => void;
  initialData?: { liabilities?: LiabilityData[] };
  canGoBack?: boolean;
}

export const OnboardingLiabilities: React.FC<OnboardingLiabilitiesProps> = ({ 
  onNext, 
  onPrev, 
  initialData,
  canGoBack = true
}) => {
  const { currency } = useInternationalization();
  const [liabilities, setLiabilities] = useState<LiabilityData[]>(initialData?.liabilities || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLiability, setNewLiability] = useState<LiabilityData>({
    name: '',
    amount: 0,
    type: 'loan'
  });

  const addLiability = () => {
    if (newLiability.name.trim() && newLiability.amount > 0) {
      setLiabilities([...liabilities, { ...newLiability }]);
      setNewLiability({ name: '', amount: 0, type: 'loan' });
      setShowAddForm(false);
    }
  };

  const removeLiability = (index: number) => {
    setLiabilities(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    onNext({ liabilities });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard size={32} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Add Liabilities</h2>
        <p className="text-gray-400">Track your loans, debts, and dues</p>
      </div>

      {/* Liabilities List */}
      <div className="space-y-3">
        {liabilities.map((liability, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/10">
            <div>
              <p className="font-medium text-white">{liability.name}</p>
              <p className="text-sm text-gray-400 capitalize">{liability.type.replace('_', ' ')}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="font-semibold text-white">{currency.symbol}{liability.amount}</span>
              <button
                onClick={() => removeLiability(index)}
                className="p-1 hover:bg-error-500/20 rounded transition-colors"
              >
                <Trash2 size={14} className="text-error-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Liability Form */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-4 border-2 border-dashed border-white/20 rounded-xl text-gray-300 hover:border-white/30 hover:text-white transition-all flex items-center justify-center space-x-2"
        >
          <Plus size={18} />
          <span>Add Liability</span>
        </button>
      ) : (
        <div className="bg-black/20 rounded-xl p-4 border border-white/10 space-y-4">
          <input
            type="text"
            placeholder="Liability name (e.g., Student Loan, Credit Card)"
            value={newLiability.name}
            onChange={(e) => setNewLiability(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Amount"
              value={newLiability.amount || ''}
              onChange={(e) => setNewLiability(prev => ({ ...prev, amount: Number(e.target.value) }))}
              className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400"
            />
            
            <select
              value={newLiability.type}
              onChange={(e) => setNewLiability(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white"
            >
              <option value="loan">Loan</option>
              <option value="credit_card">Credit Card</option>
              <option value="other">Other</option>
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
              onClick={addLiability}
              size="sm"
              className="flex-1"
              disabled={!newLiability.name.trim() || newLiability.amount <= 0}
            >
              Add Liability
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