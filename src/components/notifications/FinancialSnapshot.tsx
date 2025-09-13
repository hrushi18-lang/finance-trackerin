import React, { useState, useEffect } from 'react';
import { useFinance } from '../../contexts/FinanceContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { generateFinancialInsights } from '../../services/notificationService';

const FinancialSnapshot: React.FC = () => {
  const { 
    accounts, 
    transactions, 
    goals, 
    budgets, 
    bills, 
    liabilities
  } = useFinance();
  
  const { showFinancialSnapshot } = useNotifications();
  const [snapshot, setSnapshot] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateSnapshot();
  }, [accounts, transactions, goals, budgets, bills, liabilities]);

  const generateSnapshot = async () => {
    setIsLoading(true);
    
    // Data is already loaded by the FinanceContext
    // No need to reload here

    // Calculate financial metrics
    const totalAssets = accounts.reduce((sum, account) => sum + (account.converted_amount || account.balance || 0), 0);
    const totalLiabilities = liabilities.reduce((sum, liability) => sum + (liability.remainingAmount || 0), 0);
    const netWorth = totalAssets - totalLiabilities;

    // Monthly income (last 30 days)
    const monthlyIncome = transactions
      .filter(t => t.type === 'income' && new Date(t.date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Monthly expenses (last 30 days)
    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Savings rate
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

    // Goal progress
    const totalGoalTarget = goals.reduce((sum, goal) => sum + (goal.targetAmount || 0), 0);
    const totalGoalCurrent = goals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0);
    const goalProgress = totalGoalTarget > 0 ? (totalGoalCurrent / totalGoalTarget) * 100 : 0;

    // Budget health
    const budgetHealth = budgets.map(budget => {
      const spentPercentage = (budget.spent || 0) / (budget.amount || 1) * 100;
      return {
        category: budget.category,
        spent: budget.spent || 0,
        limit: budget.amount || 0,
        percentage: spentPercentage,
        status: spentPercentage >= 90 ? 'critical' : spentPercentage >= 80 ? 'warning' : 'healthy'
      };
    });

    // Upcoming bills (next 7 days)
    const upcomingBills = bills.filter(bill => {
      const dueDate = new Date(bill.nextDueDate || bill.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 7 && daysUntilDue >= 0;
    });

    // Spending by category (last 30 days)
    const spendingByCategory = transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + (t.amount || 0);
        return acc;
      }, {} as Record<string, number>);

    const topSpendingCategory = Object.entries(spendingByCategory)
      .reduce((max, [category, amount]) => amount > max.amount ? { category, amount } : max, { category: '', amount: 0 });

    const financialSnapshot = {
      netWorth,
      totalAssets,
      totalLiabilities,
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      goalProgress,
      totalGoalTarget,
      totalGoalCurrent,
      budgetHealth,
      upcomingBills,
      topSpendingCategory,
      accountCount: accounts.length,
      goalCount: goals.length,
      budgetCount: budgets.length,
      billCount: bills.length,
      liabilityCount: liabilities.length
    };

    setSnapshot(financialSnapshot);
    setIsLoading(false);

    // Generate insights based on the snapshot
    generateFinancialInsights({
      accounts,
      transactions,
      goals,
      budgets,
      bills,
      liabilities,
      ...financialSnapshot
    });
  };

  if (isLoading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#666'
      }}>
        Loading your financial snapshot...
      </div>
    );
  }

  if (!snapshot) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  };

  const getSavingsRateColor = (rate: number) => {
    if (rate >= 20) return '#2ed573';
    if (rate >= 10) return '#ffa502';
    return '#ff4757';
  };

  const getGoalProgressColor = (progress: number) => {
    if (progress >= 75) return '#2ed573';
    if (progress >= 50) return '#ffa502';
    return '#ff4757';
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '24px',
      borderRadius: '16px',
      margin: '16px 0'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
          Financial Snapshot
        </h2>
        <button
          onClick={generateSnapshot}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '16px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
            Net Worth
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {formatCurrency(snapshot.netWorth)}
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '16px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
            Monthly Income
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {formatCurrency(snapshot.monthlyIncome)}
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '16px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
            Savings Rate
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold',
            color: getSavingsRateColor(snapshot.savingsRate)
          }}>
            {snapshot.savingsRate.toFixed(1)}%
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '16px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
            Goal Progress
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold',
            color: getGoalProgressColor(snapshot.goalProgress)
          }}>
            {snapshot.goalProgress.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Insights */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px'
      }}>
        {/* Top Spending Category */}
        {snapshot.topSpendingCategory.amount > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '16px',
            borderRadius: '12px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
              Top Spending Category
            </h4>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              {snapshot.topSpendingCategory.category}: {formatCurrency(snapshot.topSpendingCategory.amount)}
            </div>
          </div>
        )}

        {/* Upcoming Bills */}
        {snapshot.upcomingBills.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '16px',
            borderRadius: '12px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
              Upcoming Bills ({snapshot.upcomingBills.length})
            </h4>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              {snapshot.upcomingBills.slice(0, 3).map((bill: any, index: number) => (
                <div key={index} style={{ marginBottom: '4px' }}>
                  {bill.title}: {formatCurrency(bill.amount)}
                </div>
              ))}
              {snapshot.upcomingBills.length > 3 && (
                <div style={{ fontSize: '12px', opacity: 0.7 }}>
                  +{snapshot.upcomingBills.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Budget Health */}
        {snapshot.budgetHealth.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '16px',
            borderRadius: '12px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
              Budget Health
            </h4>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              {snapshot.budgetHealth.slice(0, 3).map((budget: any, index: number) => (
                <div key={index} style={{ 
                  marginBottom: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{budget.category}</span>
                  <span style={{
                    color: budget.status === 'critical' ? '#ff4757' : 
                           budget.status === 'warning' ? '#ffa502' : '#2ed573'
                  }}>
                    {budget.percentage.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Financial Literacy Tips */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '12px'
      }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
          💡 Financial Tips
        </h4>
        <div style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.5' }}>
          {snapshot.savingsRate < 10 && (
            <div>• Try to save at least 20% of your income for a healthy financial future</div>
          )}
          {snapshot.goalProgress < 50 && (
            <div>• Consider increasing your goal contributions to reach your targets faster</div>
          )}
          {snapshot.upcomingBills.length > 5 && (
            <div>• You have many bills due soon - consider setting up automatic payments</div>
          )}
          {snapshot.budgetHealth.some((b: any) => b.status === 'critical') && (
            <div>• Some budgets are at critical levels - review your spending</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialSnapshot;
