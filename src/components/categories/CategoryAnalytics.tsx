import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface CategoryAnalyticsProps {
  categories: any[];
  transactions: any[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export const CategoryAnalytics: React.FC<CategoryAnalyticsProps> = ({
  categories,
  transactions
}) => {
  const { formatCurrency } = useInternationalization();

  const analytics = useMemo(() => {
    const categoryData = categories.map(category => {
      const categoryTransactions = transactions.filter(t => t.category === category.name);
      const totalAmount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      const transactionCount = categoryTransactions.length;
      const avgAmount = transactionCount > 0 ? totalAmount / transactionCount : 0;

      return {
        name: category.name,
        type: category.type,
        totalAmount,
        transactionCount,
        avgAmount,
        color: category.color || COLORS[categories.indexOf(category) % COLORS.length]
      };
    });

    // Separate income and expense analytics
    const incomeData = categoryData.filter(c => c.type === 'income');
    const expenseData = categoryData.filter(c => c.type === 'expense');

    // Calculate totals
    const totalIncome = incomeData.reduce((sum, c) => sum + c.totalAmount, 0);
    const totalExpenses = expenseData.reduce((sum, c) => sum + c.totalAmount, 0);

    // Add percentages
    incomeData.forEach(c => {
      c.percentage = totalIncome > 0 ? (c.totalAmount / totalIncome) * 100 : 0;
    });
    
    expenseData.forEach(c => {
      c.percentage = totalExpenses > 0 ? (c.totalAmount / totalExpenses) * 100 : 0;
    });

    return {
      incomeData: incomeData.sort((a, b) => b.totalAmount - a.totalAmount),
      expenseData: expenseData.sort((a, b) => b.totalAmount - a.totalAmount),
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses
    };
  }, [categories, transactions]);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black/30 rounded-xl p-4 text-center">
          <TrendingUp size={20} className="mx-auto text-success-400 mb-2" />
          <p className="text-xs text-gray-400 mb-1">Total Income</p>
          <p className="text-xl font-bold text-success-400">
            {formatCurrency(analytics.totalIncome)}
          </p>
          <p className="text-xs text-gray-400">{analytics.incomeData.length} categories</p>
        </div>

        <div className="bg-black/30 rounded-xl p-4 text-center">
          <TrendingDown size={20} className="mx-auto text-error-400 mb-2" />
          <p className="text-xs text-gray-400 mb-1">Total Expenses</p>
          <p className="text-xl font-bold text-error-400">
            {formatCurrency(analytics.totalExpenses)}
          </p>
          <p className="text-xs text-gray-400">{analytics.expenseData.length} categories</p>
        </div>

        <div className="bg-black/30 rounded-xl p-4 text-center">
          <Target size={20} className={`mx-auto mb-2 ${analytics.netAmount >= 0 ? 'text-primary-400' : 'text-warning-400'}`} />
          <p className="text-xs text-gray-400 mb-1">Net Amount</p>
          <p className={`text-xl font-bold ${analytics.netAmount >= 0 ? 'text-primary-400' : 'text-warning-400'}`}>
            {analytics.netAmount >= 0 ? '+' : ''}{formatCurrency(analytics.netAmount)}
          </p>
        </div>
      </div>

      {/* Expense Categories Chart */}
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h4 className="font-medium text-white mb-4">Expense Categories Breakdown</h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.expenseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalAmount"
                  fontSize={10}
                >
                  {analytics.expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatCurrency(value as number)}
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category List */}
          <div className="space-y-3">
            {analytics.expenseData.slice(0, 6).map((category, index) => (
              <div key={category.name} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <div>
                    <span className="font-medium text-white text-sm">{category.name}</span>
                    <p className="text-xs text-gray-400">
                      {category.transactionCount} transactions • Avg: {formatCurrency(category.avgAmount)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-white text-sm">
                    {formatCurrency(category.totalAmount)}
                  </span>
                  <p className="text-xs text-gray-400">
                    {category.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Income Categories */}
      {analytics.incomeData.length > 0 && (
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <h4 className="font-medium text-white mb-4">Income Categories Performance</h4>
          
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.incomeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={12}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Bar dataKey="totalAmount" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Insights */}
      <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
        <div className="flex items-start space-x-3">
          <Target size={18} className="text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-400 mb-2">Category Insights</h4>
            <div className="text-sm text-blue-300 space-y-1">
              {analytics.expenseData.length > 0 && (
                <p>• Top expense category: {analytics.expenseData[0]?.name} ({analytics.expenseData[0]?.percentage.toFixed(1)}%)</p>
              )}
              {analytics.incomeData.length > 0 && (
                <p>• Primary income source: {analytics.incomeData[0]?.name} ({analytics.incomeData[0]?.percentage.toFixed(1)}%)</p>
              )}
              <p>• Total categories: {categories.length} ({analytics.incomeData.length} income, {analytics.expenseData.length} expense)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};