/**
 * LiabilityForm Page
 * Full-page form for creating liabilities (mobile-friendly)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LuxuryLiabilityForm } from '../components/forms/LuxuryLiabilityForm';

const LiabilityForm: React.FC = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate('/liabilities');
  };

  const handleCancel = () => {
    navigate('/liabilities');
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 px-4 py-4" style={{ background: 'var(--background)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/liabilities')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-heading" style={{ color: 'var(--text-primary)' }}>
            Add Liability
          </h1>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-4 pb-6">
        <LuxuryLiabilityForm
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default LiabilityForm;
