import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Activity,
  DollarSign,
  Calendar,
  Filter,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface AdvancedChartsProps {
  data: any;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  onExport: () => void;
}

export const AdvancedCharts: React.FC<AdvancedChartsProps> = ({
  data,
  timeRange,
  onTimeRangeChange,
  onExport
}) => {
  const { formatCurrency } = useInternationalization();
  const [selectedChart, setSelectedChart] = useState('overview');
  const [showDataLabels, setShowDataLabels] = useState(true);
  const [chartType, setChartType] = useState('line');

  const chartTypes = [
    { id: 'line', name: 'Line Chart', icon: LineChart, description: 'Trend over time' },
    { id: 'bar', name: 'Bar Chart', icon: BarChart3, description: 'Compare categories' },
    { id: 'pie', name: 'Pie Chart', icon: PieChart, description: 'Proportion breakdown' },
    { id: 'area', name: 'Area Chart', icon: Activity, description: 'Cumulative view' }
  ];

  const timeRanges = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
    { value: 'all', label: 'All Time' }
  ];

  const chartSections = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'income', name: 'Income Analysis', icon: TrendingUp },
    { id: 'expenses', name: 'Expense Breakdown', icon: TrendingDown },
    { id: 'savings', name: 'Savings Rate', icon: DollarSign },
    { id: 'goals', name: 'Goal Progress', icon: Calendar }
  ];

  const processedData = useMemo(() => {
    if (!data) return null;

    return {
      income: {
        total: data.totalIncome || 0,
        trend: data.incomeTrend || 0,
        categories: data.incomeByCategory || [],
        monthly: data.monthlyIncome || []
      },
      expenses: {
        total: data.totalExpenses || 0,
        trend: data.expenseTrend || 0,
        categories: data.expensesByCategory || [],
        monthly: data.monthlyExpenses || []
      },
      savings: {
        rate: data.savingsRate || 0,
        amount: data.savingsAmount || 0,
        trend: data.savingsTrend || 0
      },
      goals: {
        completed: data.goalsCompleted || 0,
        inProgress: data.goalsInProgress || 0,
        total: data.totalGoals || 0,
        progress: data.overallGoalProgress || 0
      }
    };
  }, [data]);

  const renderChart = () => {
    if (!processedData) return null;

    switch (selectedChart) {
      case 'overview':
        return <OverviewChart data={processedData} showLabels={showDataLabels} />;
      case 'income':
        return <IncomeAnalysisChart data={processedData.income} chartType={chartType} showLabels={showDataLabels} />;
      case 'expenses':
        return <ExpenseBreakdownChart data={processedData.expenses} chartType={chartType} showLabels={showDataLabels} />;
      case 'savings':
        return <SavingsRateChart data={processedData.savings} chartType={chartType} showLabels={showDataLabels} />;
      case 'goals':
        return <GoalProgressChart data={processedData.goals} chartType={chartType} showLabels={showDataLabels} />;
      default:
        return <OverviewChart data={processedData} showLabels={showDataLabels} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">Advanced Analytics</h2>
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => onTimeRangeChange(e.target.value)}
              className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2"
            >
              {timeRanges.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowDataLabels(!showDataLabels)}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            title={showDataLabels ? 'Hide Data Labels' : 'Show Data Labels'}
          >
            {showDataLabels ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          <button
            onClick={onExport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Download size={20} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="flex flex-wrap gap-2">
        {chartTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setChartType(type.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              chartType === type.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <type.icon size={18} />
            <span className="text-sm font-medium">{type.name}</span>
          </button>
        ))}
      </div>

      {/* Chart Sections */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {chartSections.map(section => (
          <button
            key={section.id}
            onClick={() => setSelectedChart(section.id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              selectedChart === section.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <section.icon size={18} />
            <span className="text-sm font-medium">{section.name}</span>
          </button>
        ))}
      </div>

      {/* Chart Container */}
      <div className="bg-gray-900 rounded-xl p-6 min-h-[400px]">
        {renderChart()}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value={formatCurrency(processedData?.income?.total || 0)}
          trend={processedData?.income?.trend || 0}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(processedData?.expenses?.total || 0)}
          trend={processedData?.expenses?.trend || 0}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="Savings Rate"
          value={`${processedData?.savings?.rate || 0}%`}
          trend={processedData?.savings?.trend || 0}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Goal Progress"
          value={`${processedData?.goals?.progress || 0}%`}
          trend={0}
          icon={Calendar}
          color="purple"
        />
      </div>
    </div>
  );
};

// Individual Chart Components
const OverviewChart: React.FC<{ data: any; showLabels: boolean }> = ({ data, showLabels }) => (
  <div className="h-80 flex items-center justify-center">
    <div className="text-center">
      <Activity size={48} className="text-blue-500 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">Financial Overview</h3>
      <p className="text-gray-400">Interactive chart coming soon...</p>
    </div>
  </div>
);

const IncomeAnalysisChart: React.FC<{ data: any; chartType: string; showLabels: boolean }> = ({ data, chartType, showLabels }) => (
  <div className="h-80 flex items-center justify-center">
    <div className="text-center">
      <TrendingUp size={48} className="text-green-500 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">Income Analysis</h3>
      <p className="text-gray-400">Chart type: {chartType}</p>
    </div>
  </div>
);

const ExpenseBreakdownChart: React.FC<{ data: any; chartType: string; showLabels: boolean }> = ({ data, chartType, showLabels }) => (
  <div className="h-80 flex items-center justify-center">
    <div className="text-center">
      <TrendingDown size={48} className="text-red-500 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">Expense Breakdown</h3>
      <p className="text-gray-400">Chart type: {chartType}</p>
    </div>
  </div>
);

const SavingsRateChart: React.FC<{ data: any; chartType: string; showLabels: boolean }> = ({ data, chartType, showLabels }) => (
  <div className="h-80 flex items-center justify-center">
    <div className="text-center">
      <DollarSign size={48} className="text-blue-500 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">Savings Rate</h3>
      <p className="text-gray-400">Chart type: {chartType}</p>
    </div>
  </div>
);

const GoalProgressChart: React.FC<{ data: any; chartType: string; showLabels: boolean }> = ({ data, chartType, showLabels }) => (
  <div className="h-80 flex items-center justify-center">
    <div className="text-center">
      <Calendar size={48} className="text-purple-500 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">Goal Progress</h3>
      <p className="text-gray-400">Chart type: {chartType}</p>
    </div>
  </div>
);

// Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: string;
  trend: number;
  icon: React.ComponentType<any>;
  color: string;
}> = ({ title, value, trend, icon: Icon, color }) => {
  const colorClasses = {
    green: 'text-green-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400'
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon size={20} className={colorClasses[color as keyof typeof colorClasses]} />
        <span className={`text-sm ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
      </div>
      <h3 className="text-sm text-gray-400 mb-1">{title}</h3>
      <p className="text-xl font-semibold text-white">{value}</p>
    </div>
  );
};
