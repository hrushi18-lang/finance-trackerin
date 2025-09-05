import React from 'react';
import LuxuryCategoryIcon from './LuxuryCategoryIcon';

const LuxuryIconShowcase: React.FC = () => {
  const categories = [
    // Income Categories
    { name: 'Salary', type: 'income' },
    { name: 'Freelance', type: 'income' },
    { name: 'Business Income', type: 'income' },
    { name: 'Investment Returns', type: 'income' },
    { name: 'Rental Income', type: 'income' },
    
    // Expense Categories
    { name: 'Food & Dining', type: 'expense' },
    { name: 'Transportation', type: 'expense' },
    { name: 'Housing', type: 'expense' },
    { name: 'Utilities', type: 'expense' },
    { name: 'Healthcare', type: 'expense' },
    { name: 'Entertainment', type: 'expense' },
    { name: 'Shopping', type: 'expense' },
    { name: 'Education', type: 'expense' },
    { name: 'Travel', type: 'expense' },
    { name: 'Insurance', type: 'expense' },
    
    // Bill Categories
    { name: 'Electricity', type: 'bill' },
    { name: 'Water', type: 'bill' },
    { name: 'Gas', type: 'bill' },
    { name: 'Internet', type: 'bill' },
    { name: 'Phone', type: 'bill' },
    
    // Goal Categories
    { name: 'Vacation', type: 'goal' },
    { name: 'Home Purchase', type: 'goal' },
    { name: 'Car Purchase', type: 'goal' },
    { name: 'Wedding', type: 'goal' },
    { name: 'Retirement', type: 'goal' },
    
    // Liability Categories
    { name: 'Personal Loan', type: 'liability' },
    { name: 'Student Loan', type: 'liability' },
    { name: 'Auto Loan', type: 'liability' },
    { name: 'Mortgage', type: 'liability' },
    { name: 'Credit Card', type: 'liability' }
  ];

  const variants = ['default', 'minimal', 'luxury'] as const;

  return (
    <div className="p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-heading font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Luxury Category Icons
        </h1>
        <p className="text-lg font-body" style={{ color: 'var(--text-secondary)' }}>
          Beautiful, minimal, and luxury icons for your financial categories
        </p>
      </div>

      {variants.map((variant) => (
        <div key={variant} className="space-y-4">
          <h2 className="text-xl font-heading font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
            {variant} Variant
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categories.map((category) => (
              <div
                key={`${variant}-${category.name}`}
                className="flex flex-col items-center space-y-2 p-4 rounded-2xl"
                style={{
                  backgroundColor: 'var(--background-secondary)',
                  boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                }}
              >
                <LuxuryCategoryIcon
                  category={category.name}
                  size={24}
                  variant={variant}
                />
                <span className="text-xs font-body text-center" style={{ color: 'var(--text-secondary)' }}>
                  {category.name}
                </span>
                <span className="text-xs font-body capitalize" style={{ color: 'var(--text-tertiary)' }}>
                  {category.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="space-y-4">
        <h2 className="text-xl font-heading font-semibold" style={{ color: 'var(--text-primary)' }}>
          Interactive Examples
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Transaction Card Example */}
          <div
            className="p-6 rounded-2xl"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <h3 className="font-heading text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
              Transaction Card
            </h3>
            <div className="flex items-center space-x-4">
              <LuxuryCategoryIcon category="Food & Dining" size={20} variant="luxury" />
              <div className="flex-1">
                <p className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                  Restaurant Dinner
                </p>
                <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                  Today • Food & Dining
                </p>
              </div>
              <p className="font-numbers text-sm font-bold text-red-600">
                -$45.00
              </p>
            </div>
          </div>

          {/* Goal Card Example */}
          <div
            className="p-6 rounded-2xl"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <h3 className="font-heading text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
              Goal Card
            </h3>
            <div className="flex items-center space-x-4">
              <LuxuryCategoryIcon category="Vacation" size={20} variant="luxury" />
              <div className="flex-1">
                <p className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                  Europe Trip
                </p>
                <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                  65% Complete
                </p>
              </div>
              <p className="font-numbers text-sm font-bold text-green-600">
                $3,250
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LuxuryIconShowcase;
