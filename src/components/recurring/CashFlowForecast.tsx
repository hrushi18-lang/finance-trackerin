import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Calendar, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, BarChart } from 'recharts';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface CashFlowForecastProps {
  recurringTransactions: any[];
}

export const CashFlowForecast: React.FC<CashFlowForecastProps> = ({
  recurringTransactions
}) => {
  const { formatCurrency, currency } = useInternationalization();
  
  // Generate 90-day cash flow forecast
  const forecastData = useMemo(() => {
    const today = new Date();
    const days = eachDayOfInterval({
      start: today,
      end: addDays(today, 90)
    });

    return days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      let dailyIncome = 0;
      let dailyExpenses = 0;

      // Calculate transactions for this date
      recurringTransactions.forEach(rt => {
        const nextOccurrence = new Date(rt.nextOccurrenceDate);
        
        // Check if transaction occurs on this date
        let occursOnDate = false;
        
        switch (rt.frequency) {
          case 'daily':
            occursOnDate = date >= nextOccurrence;
            break;
          case 'weekly':
            const weeksSince = Math.floor((date.getTime() - nextOccurrence.getTime()) / (7 * 24 * 60 * 60 * 1000));
            occursOnDate = weeksSince >= 0 && weeksSince % 1 === 0;
            break;
          case 'monthly':
            occursOnDate = date.getDate() === nextOccurrence.getDate() && 
                          date >= nextOccurrence;
            break;
          // Add other frequency calculations as needed
        }

        if (occursOnDate) {
          if (rt.type === 'income') {
            dailyIncome += rt.amount;
          } else {
            dailyExpenses += rt.amount;
          }
        }
      });

      return {
        date: dateStr,
        income: dailyIncome,
        expenses: dailyExpenses,
        net: dailyIncome - dailyExpenses,
        dateFormatted: format(date, 'MMM dd')
      };
    });
  }, [recurringTransactions]);

  // Calculate insights
  const insights = useMemo(() => {
    const totalIncome = forecastData.reduce((sum, day) => sum + day.income, 0);
    const totalExpenses = forecastData.reduce((sum, day) => sum + day.expenses, 0);
    const netForecast = totalIncome - totalExpenses;
    
    const negativeDays = forecastData.filter(day => day.net < 0);
    const positiveDays = forecastData.filter(day => day.net > 0);
    
    return {
      totalIncome,
      totalExpenses,
      netForecast,
      negativeDays: negativeDays.length,
      positiveDays: positiveDays.length,
      avgDailyNet: netForecast / 90
    };
  }, [forecastData]);

  const upcomingHighExpenses = forecastData
    .filter(day => day.expenses > 500)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Cash Flow Overview */}
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <TrendingUp size={20} className="mr-2 text-primary-400" />
          90-Day Cash Flow Forecast
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-black/30 rounded-xl p-4 text-center">
            <TrendingUp size={20} className="mx-auto text-success-400 mb-2" />
            <p className="text-xs text-gray-400 mb-1">Expected Income</p>
            <p className="text-xl font-bold text-success-400">
              +{formatCurrency(insights.totalIncome)}
            </p>
          </div>

          <div className="bg-black/30 rounded-xl p-4 text-center">
            <TrendingDown size={20} className="mx-auto text-error-400 mb-2" />
            <p className="text-xs text-gray-400 mb-1">Expected Expenses</p>
            <p className="text-xl font-bold text-error-400">
              -{formatCurrency(insights.totalExpenses)}
            </p>
          </div>

          <div className="bg-black/30 rounded-xl p-4 text-center">
            <Zap size={20} className={`mx-auto mb-2 ${insights.netForecast >= 0 ? 'text-primary-400' : 'text-warning-400'}`} />
            <p className="text-xs text-gray-400 mb-1">Net Forecast</p>
            <p className={`text-xl font-bold ${insights.netForecast >= 0 ? 'text-primary-400' : 'text-warning-400'}`}>
              {insights.netForecast >= 0 ? '+' : ''}{formatCurrency(insights.netForecast)}
            </p>
          </div>
        </div>

        {/* Cash Flow Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={forecastData.filter((_, index) => index % 3 === 0)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="dateFormatted" 
              stroke="#9CA3AF" 
              fontSize={12}
            />
            <YAxis 
              stroke="#9CA3AF" 
              fontSize={12}
              tickFormatter={(value) => `${currency.symbol}${value}`}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                formatCurrency(Math.abs(value)), 
                name === 'net' ? 'Net Flow' : name === 'income' ? 'Income' : 'Expenses'
              ]}
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
            />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#3B82F6"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Upcoming High Expenses */}
      {upcomingHighExpenses.length > 0 && (
        <div className="bg-warning-500/20 rounded-lg p-4 border border-warning-500/30">
          <div className="flex items-start space-x-3">
            <AlertTriangle size={18} className="text-warning-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-warning-400 mb-2">Upcoming High Expense Days</h4>
              <div className="space-y-2">
                {upcomingHighExpenses.map((day, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-warning-300">{day.dateFormatted}</span>
                    <span className="font-medium text-warning-400">
                      -{formatCurrency(day.expenses)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash Flow Insights */}
      <div className="bg-primary-500/20 rounded-lg p-4 border border-primary-500/30">
        <div className="flex items-start space-x-3">
          <CheckCircle size={18} className="text-primary-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-primary-400 mb-2">Cash Flow Insights</h4>
            <div className="text-sm text-primary-300 space-y-1">
              <p>• Average daily net flow: {formatCurrency(insights.avgDailyNet)}</p>
              <p>• Positive flow days: {insights.positiveDays}/90 ({((insights.positiveDays/90) * 100).toFixed(0)}%)</p>
              <p>• Negative flow days: {insights.negativeDays}/90 ({((insights.negativeDays/90) * 100).toFixed(0)}%)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};