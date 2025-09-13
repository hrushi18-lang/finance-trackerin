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

      // The GoalForm already handles validation and data transformation
      // Just pass the data directly to addGoal
      await addGoal(data);
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
