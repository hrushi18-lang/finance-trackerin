import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNavigation } from '../components/layout/TopNavigation';
import { GoalForm } from '../components/forms/GoalForm';
import { useFinance } from '../contexts/FinanceContextOffline';

const CreateGoal: React.FC = () => {
  const navigate = useNavigate();
  const { addGoal } = useFinance();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);

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
      setError(error.message || 'Failed to create goal. Please try again.');
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
