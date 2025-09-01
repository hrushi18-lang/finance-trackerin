import React, { useState } from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { Button } from '../common/Button'; // Already exists
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface BillData {
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
}

interface OnboardingBillsProps {
  onNext: (data: { bills: BillData[] }) => void;
  onPrev: () => void;
  initialData?: { bills?: BillData[] };
  canGoBack?: boolean;
}

export const OnboardingBills: React.FC<OnboardingBillsProps> = ({ 
  onNext, 
  onPrev, 
  initialData, // Already exists
  canGoBack = true
}) => {
  const { currency } = useInternationalization();
  const [bills, setBills] = useState<BillData[]>(initialData?.bills || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBill, setNewBill] = useState<BillData>({
    name: '',
    amount: 0,
    frequency: 'monthly'
  });

  const addBill = () => {
    if (newBill.name.trim() && newBill.amount > 0) { // Already exists
      setBills([...bills, { ...newBill }]);
      setNewBill({ name: '', amount: 0, frequency: 'monthly' });
      setShowAddForm(false);
    }
  };

  const removeBill = (index: number) => {
    setBills(prev => prev.filter((_, i) => i !== index)); // Already exists
  };

  const handleContinue = () => {
    onNext({ bills });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar size={32} className="text-blue-400" /> // Already exists
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Set Up Bills</h2>
        <p className="text-gray-400">Add your recurring payments like rent, subscriptions</p>
      </div>

      {/* Bills List */}
      <div className="space-y-3">
        {bills.map((bill, index) => ( // Already exists
          <div key={index} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/10">
            <div>
              <p className="font-medium text-white">{bill.name}</p>
              <p className="text-sm text-gray-400 capitalize">{bill.frequency}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="font-semibold text-white">{currency.symbol}{bill.amount}</span>
              <button // Already exists
                onClick={() => removeBill(index)}
                className="p-1 hover:bg-error-500/20 rounded transition-colors"
              >
                <Trash2 size={14} className="text-error-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Bill Form */}
      {!showAddForm ? ( // Already exists
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-4 border-2 border-dashed border-white/20 rounded-xl text-gray-300 hover:border-white/30 hover:text-white transition-all flex items-center justify-center space-x-2"
        >
          <Plus size={18} />
          <span>Add Bill</span>
        </button>
      ) : (
        <div className="bg-black/20 rounded-xl p-4 border border-white/10 space-y-4"> // Already exists
          <input
            type="text"
            placeholder="Bill name (e.g., Rent, Netflix)"
            value={newBill.name}
            onChange={(e) => setNewBill(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Amount"
              value={newBill.amount || ''}
              onChange={(e) => setNewBill(prev => ({ ...prev, amount: Number(e.target.value) }))}
              className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400"
            /> // Already exists
            
            <select
              value={newBill.frequency}
              onChange={(e) => setNewBill(prev => ({ ...prev, frequency: e.target.value as any }))}
              className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select> // Already exists
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={() => setShowAddForm(false)}
              variant="outline"
              size="sm"
              className="flex-1" // Already exists
            >
              Cancel
            </Button>
            <Button
              onClick={addBill}
              size="sm"
              className="flex-1"
              disabled={!newBill.name.trim() || newBill.amount <= 0} // Already exists
            >
              Add Bill
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex space-x-3 pt-4"> // Already exists
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