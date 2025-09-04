import React, { useState } from 'react';

interface BarChartData {
  month: string;
  income?: number;
  spending?: number;
  value?: number;
}

interface BarChartProps {
  data: BarChartData[];
  className?: string;
  interactive?: boolean;
  onBarClick?: (data: BarChartData) => void;
}

export const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  className = '', 
  interactive = false, 
  onBarClick 
}) => {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const maxValue = Math.max(
    ...data.flatMap(d => [d.income || 0, d.spending || 0, d.value || 0])
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Chart */}
      <div className="flex items-end justify-between space-x-2 h-48">
        {data.map((item, index) => {
          const incomeHeight = ((item.income || 0) / maxValue) * 100;
          const spendingHeight = ((item.spending || 0) / maxValue) * 100;
          const valueHeight = ((item.value || 0) / maxValue) * 100;
          
          return (
            <div 
              key={index} 
              className={`flex-1 flex flex-col items-center space-y-1 ${
                interactive ? 'cursor-pointer' : ''
              }`}
              onMouseEnter={() => interactive && setHoveredBar(index)}
              onMouseLeave={() => interactive && setHoveredBar(null)}
              onClick={() => {
                if (interactive && onBarClick) {
                  onBarClick(item);
                }
              }}
            >
              {/* Bars */}
              <div className="flex flex-col justify-end h-32 w-full space-y-1">
                {item.value !== undefined ? (
                  /* Single Value Bar */
                  <div
                    className={`w-full rounded-t-sm transition-all duration-500 ease-out ${
                      hoveredBar === index ? 'opacity-80' : ''
                    }`}
                    style={{
                      height: `${valueHeight}%`,
                      backgroundColor: 'var(--primary)',
                      minHeight: '4px',
                      filter: hoveredBar === index ? 'brightness(1.1)' : 'none'
                    }}
                  />
                ) : (
                  <>
                    {/* Income Bar */}
                    <div
                      className={`w-full rounded-t-sm transition-all duration-500 ease-out ${
                        hoveredBar === index ? 'opacity-80' : ''
                      }`}
                      style={{
                        height: `${incomeHeight}%`,
                        backgroundColor: 'var(--primary)',
                        minHeight: '4px',
                        filter: hoveredBar === index ? 'brightness(1.1)' : 'none'
                      }}
                    />
                    {/* Spending Bar */}
                    <div
                      className={`w-full rounded-t-sm transition-all duration-500 ease-out ${
                        hoveredBar === index ? 'opacity-80' : ''
                      }`}
                      style={{
                        height: `${spendingHeight}%`,
                        backgroundColor: 'var(--accent)',
                        minHeight: '4px',
                        filter: hoveredBar === index ? 'brightness(1.1)' : 'none'
                      }}
                    />
                  </>
                )}
              </div>
              
              {/* Month Label */}
              <div className={`text-xs font-body transition-all duration-200 ${
                hoveredBar === index ? 'font-medium' : ''
              }`} style={{ color: 'var(--text-tertiary)' }}>
                {item.month}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {data.length > 0 && data[0].value !== undefined ? (
        <div className="flex items-center justify-center space-x-6">
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: 'var(--primary)' }}
            />
            <span className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
              Value
            </span>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
};

