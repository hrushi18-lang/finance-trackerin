import React from 'react';

interface BarChartData {
  month: string;
  income: number;
  spending: number;
}

interface BarChartProps {
  data: BarChartData[];
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({ data, className = '' }) => {
  const maxValue = Math.max(
    ...data.flatMap(d => [d.income, d.spending])
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Chart */}
      <div className="flex items-end justify-between space-x-2 h-48">
        {data.map((item, index) => {
          const incomeHeight = (item.income / maxValue) * 100;
          const spendingHeight = (item.spending / maxValue) * 100;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center space-y-1">
              {/* Bars */}
              <div className="flex flex-col justify-end h-32 w-full space-y-1">
                {/* Income Bar */}
                <div
                  className="w-full rounded-t-sm transition-all duration-500 ease-out"
                  style={{
                    height: `${incomeHeight}%`,
                    backgroundColor: 'var(--primary)',
                    minHeight: '4px'
                  }}
                />
                {/* Spending Bar */}
                <div
                  className="w-full rounded-t-sm transition-all duration-500 ease-out"
                  style={{
                    height: `${spendingHeight}%`,
                    backgroundColor: 'var(--accent)',
                    minHeight: '4px'
                  }}
                />
              </div>
              
              {/* Month Label */}
              <div className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>
                {item.month}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6">
        <div className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: 'var(--primary)' }}
          />
          <span className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
            Income
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: 'var(--accent)' }}
          />
          <span className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
            Spending
          </span>
        </div>
      </div>
    </div>
  );
};
