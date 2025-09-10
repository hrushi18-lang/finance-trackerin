import React, { useState } from 'react';
import { CreditCard, GraduationCap, Home, Car, Wallet, ShoppingCart, Building, Zap, Globe, Scale, FileText, Users } from 'lucide-react';
import { Button } from '../common/Button';
import { getLiabilityTypeOptions, LiabilityType } from '../../lib/liability-behaviors';

interface QuickLiabilityFormProps {
  onSubmit: (data: { name: string; type: LiabilityType; status: 'new' | 'existing' }) => void;
  onCancel: () => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  'education_loan': <GraduationCap size={24} />,
  'student_credit_card': <CreditCard size={24} />,
  'family_debt': <Users size={24} />,
  'bnpl': <ShoppingCart size={24} />,
  'personal_loan': <Wallet size={24} />,
  'credit_card': <CreditCard size={24} />,
  'auto_loan': <Car size={24} />,
  'home_loan': <Home size={24} />,
  'gold_loan': <Scale size={24} />,
  'utility_debt': <Zap size={24} />,
  'tax_debt': <FileText size={24} />,
  'international_debt': <Globe size={24} />
};

export const QuickLiabilityForm: React.FC<QuickLiabilityFormProps> = ({
  onSubmit,
  onCancel
}) => {
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<LiabilityType | null>(null);
  const [status, setStatus] = useState<'new' | 'existing'>('new');
  const [error, setError] = useState<string | null>(null);

  const liabilityTypes = getLiabilityTypeOptions();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter a liability name');
      return;
    }
    
    if (!selectedType) {
      setError('Please select a liability type');
      return;
    }

    setError(null);
    onSubmit({
      name: name.trim(),
      type: selectedType,
      status
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-6 border border-blue-500/30 mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Add New Liability</h2>
        <p className="text-gray-300">Choose the type and status to get started</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Liability Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Liability Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Student Loan, Credit Card, Car Loan"
            className="w-full px-4 py-3 rounded-xl border border-white/20 bg-black/20 text-white placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500"
          />
        </div>

        {/* Status Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Is this a new or existing liability?
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setStatus('new')}
              className={`p-4 rounded-xl border-2 text-center transition-colors ${
                status === 'new'
                  ? 'border-green-500 bg-green-500/20 text-green-400'
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">🆕</div>
              <div className="font-medium">New Liability</div>
              <div className="text-sm opacity-80">Starting fresh</div>
            </button>
            
            <button
              type="button"
              onClick={() => setStatus('existing')}
              className={`p-4 rounded-xl border-2 text-center transition-colors ${
                status === 'existing'
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="font-medium">Existing Liability</div>
              <div className="text-sm opacity-80">Already have this debt</div>
            </button>
          </div>
        </div>

        {/* Liability Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Select Liability Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {liabilityTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setSelectedType(type.value)}
                className={`p-4 rounded-xl border-2 text-left transition-colors ${
                  selectedType === type.value
                    ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                    : 'border-white/20 hover:border-white/30 text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{type.icon}</div>
                  <div>
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs opacity-80">{type.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={!name.trim() || !selectedType}
          >
            Continue to Details
          </Button>
        </div>
      </form>
    </div>
  );
};
