import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNavigation } from '../components/layout/TopNavigation';
import { GoalForm } from '../components/forms/GoalForm';
import { useFinance } from '../contexts/FinanceContext';

const CreateGoal: React.FC = () => {
  const navigate = useNavigate();
  const { addGoal } = useFinance();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Validate form data before submission
      if (!data.title || data.title.trim().length === 0) {
        setError('Goal title is required');
        return;
      }
      if (!data.targetAmount || Number(data.targetAmount) <= 0) {
        setError('Target amount must be greater than 0');
        return;
      }
      if (!data.targetDate || new Date(data.targetDate) <= new Date()) {
        setError('Target date must be in the future');
        return;
      }

      const goalData = {
        ...data,
        targetAmount: Number(data.targetAmount),
        targetDate: new Date(data.targetDate),
        currentAmount: Number(data.currentAmount) || 0,
        status: 'active' as const,
        activityScope: data.activityScope || 'general',
        accountIds: data.accountIds || [],
        targetCategory: data.targetCategory || null,
      };

      await addGoal(goalData);
      navigate('/goals');
    } catch (error: any) {
      console.error('Error creating goal:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create goal. Please try again.';
      
      if (error.message) {
        if (error.message.includes('title already exists')) {
          errorMessage = 'A goal with this title already exists. Please choose a different title.';
        } else if (error.message.includes('Target amount must be greater than 0')) {
          errorMessage = 'Target amount must be greater than 0';
        } else if (error.message.includes('Target date must be in the future')) {
          errorMessage = 'Target date must be in the future';
        } else if (error.message.includes('Invalid account reference')) {
          errorMessage = 'Please select a valid account for this goal';
        } else if (error.message.includes('Invalid data provided')) {
          errorMessage = 'Please check your input values and try again';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--background)' }}>
      <TopNavigation title="Create Goal" />
      
      <div className="px-4 py-6">
        <GoalForm
          onSubmit={onSubmit}
          onCancel={() => navigate('/goals')}
        />
      </div>
    </div>
  );
};

export default CreateGoal;
