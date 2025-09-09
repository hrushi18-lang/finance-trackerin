import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  CreditCard, 
  Receipt,
  PieChart,
  BarChart3,
  Wallet,
  AlertCircle
} from 'lucide-react';
import { useEnhancedCurrency } from '../../contexts/EnhancedCurrencyContext';
import { useProfile } from '../../contexts/ProfileContext';
import { dashboardAggregationService, DashboardSummary } from '../../lib/dashboard-aggregation-service';
import AccountSummary from '../accounts/AccountSummary';
import AccountCard from '../accounts/AccountCard';

interface MultiCurrencyDashboardProps {
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
    institution?: string;
    isVisible: boolean;
  }>;
  transactions: Array<{
    id: string;
    type: 'income' | 'expense';
    amount: number;
    currency_code: string;
    date: string;
    exchange_rate_used?: number;
  }>;
  goals: Array<{
    id: string;
    title: string;
    target_amount: number;
    current_amount: number;
    currency_code: string;
    status: string;
  }>;
  liabilities: Array<{
    id: string;
    name: string;
    remaining_amount: number;
    currency_code: string;
    status: string;
  }>;
  bills: Array<{
    id: string;
    title: string;
    amount: number;
    currency_code: string;
    due_date: string;
    status: string;
  }>;
  className?: string;
}

const MultiCurrencyDashboard: React.FC<MultiCurrencyDashboardProps> = ({
  accounts,
  transactions,
  goals,
  liabilities,
  bills,
  className = ""
}) => {
  const { formatCurrency, getCurrencyInfo } = useEnhancedCurrency();
  const { userProfile } = useProfile();
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const primaryCurrency = userProfile?.primaryCurrency || 'USD';

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await dashboardAggregationService.aggregateDashboard(
          accounts,
          transactions,
          goals,
          liabilities,
          bills,
          primaryCurrency
        );
        
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [accounts, transactions, goals, liabilities, bills, primaryCurrency]);

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-500">{error || 'Unable to load dashboard data'}</p>
      </div>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    trendValue 
  }: {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ComponentType<any>;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
  }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        {trend && trendValue && (
          <div className={`flex items-center space-x-1 text-sm ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : 
             trend === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm text-gray-500">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Net Worth Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Net Worth</h2>
            <p className="text-blue-100 text-sm">All accounts in {primaryCurrency}</p>
          </div>
          <Wallet className="w-8 h-8 text-blue-200" />
        </div>
        <div className="text-3xl font-bold mb-2">
          {formatCurrency(dashboardData.netWorth.total, primaryCurrency, true)}
        </div>
        <div className="text-blue-100 text-sm">
          {dashboardData.netWorth.breakdown.length} currency{dashboardData.netWorth.breakdown.length !== 1 ? 'ies' : 'y'}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="This Month Income"
          value={formatCurrency(dashboardData.transactions.thisMonth.income, primaryCurrency, true)}
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          title="This Month Expenses"
          value={formatCurrency(dashboardData.transactions.thisMonth.expenses, primaryCurrency, true)}
          icon={TrendingDown}
          trend="down"
        />
        <StatCard
          title="Active Goals"
          value={dashboardData.goals.active.toString()}
          subtitle={`${formatCurrency(dashboardData.goals.totalCurrent, primaryCurrency, true)} of ${formatCurrency(dashboardData.goals.totalTarget, primaryCurrency, true)}`}
          icon={Target}
        />
        <StatCard
          title="Total Debt"
          value={formatCurrency(dashboardData.liabilities.totalDebt, primaryCurrency, true)}
          subtitle={`${dashboardData.liabilities.active} active`}
          icon={CreditCard}
        />
      </div>

      {/* Accounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Accounts</h3>
          <span className="text-sm text-gray-500">
            {dashboardData.accounts.visible} of {dashboardData.accounts.total} visible
          </span>
        </div>
        
        <AccountSummary accounts={accounts} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.filter(account => account.isVisible).slice(0, 6).map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      </div>

      {/* Currency Breakdown */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Currency Breakdown</h3>
        <div className="space-y-4">
          {dashboardData.netWorth.breakdown.map((item) => {
            const currencyInfo = getCurrencyInfo(item.currency);
            return (
              <div key={item.currency} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {currencyInfo && (
                    <span className="text-2xl">{currencyInfo.flag_emoji}</span>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{item.currency}</div>
                    <div className="text-sm text-gray-500">{currencyInfo?.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(item.convertedAmount, primaryCurrency, true)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.percentage.toFixed(1)}% of total
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bills Overview */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Bills</h3>
        <div className="space-y-3">
          {dashboardData.bills.byCurrency.map((bill) => {
            const currencyInfo = getCurrencyInfo(bill.currency);
            return (
              <div key={bill.currency} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {currencyInfo && (
                    <span className="text-lg">{currencyInfo.flag_emoji}</span>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{bill.currency} Bills</div>
                    <div className="text-sm text-gray-500">{bill.count} bill{bill.count !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(bill.convertedAmount, primaryCurrency, true)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(bill.amount, bill.currency, true)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {dashboardData.bills.overdue > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {dashboardData.bills.overdue} overdue bill{dashboardData.bills.overdue !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { MultiCurrencyDashboard };
export default MultiCurrencyDashboard;
