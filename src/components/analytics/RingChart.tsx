import React, { useState } from 'react';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface RingChartData {
  label: string;
  value: number;
  color: string;
}

interface RingChartProps {
  data: RingChartData[];
  size?: number;
  strokeWidth?: number;
  showLegend?: boolean;
  total?: number;
  className?: string;
  interactive?: boolean;
  onSegmentClick?: (segment: RingChartData) => void;
}

export const RingChart: React.FC<RingChartProps> = ({
  data,
  size = 200,
  strokeWidth = 20,
  showLegend = true,
  total,
  className = '',
  interactive = false,
  onSegmentClick
}) => {
  const { formatCurrency } = useInternationalization();
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Calculate total if not provided
  const calculatedTotal = total || data.reduce((sum, item) => sum + item.value, 0);

  // Calculate cumulative percentage for positioning
  let cumulativePercentage = 0;

  const segments = data.map((item, index) => {
    const percentage = (item.value / calculatedTotal) * 100;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
    
    cumulativePercentage += percentage;

    return {
      ...item,
      percentage,
      strokeDasharray,
      strokeDashoffset,
      key: `segment-${index}`
    };
  });

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Chart */}
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--background-secondary)"
            strokeWidth={strokeWidth}
            className="opacity-30"
          />
          
          {/* Data segments */}
          {segments.map((segment, index) => (
            <circle
              key={segment.key}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={segment.strokeDasharray}
              strokeDashoffset={segment.strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-out ${
                interactive ? 'cursor-pointer' : ''
              } ${
                hoveredSegment === index ? 'opacity-80' : ''
              }`}
              style={{
                strokeDasharray: segment.strokeDasharray,
                strokeDashoffset: segment.strokeDashoffset,
                filter: hoveredSegment === index ? 'brightness(1.1)' : 'none'
              }}
              onMouseEnter={() => interactive && setHoveredSegment(index)}
              onMouseLeave={() => interactive && setHoveredSegment(null)}
              onClick={() => {
                if (interactive && onSegmentClick) {
                  onSegmentClick(segment);
                }
              }}
            />
          ))}
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(calculatedTotal)}
            </div>
            <div className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>
              Total
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="space-y-2 w-full">
          {segments.map((segment) => (
            <div key={segment.key} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
                  {segment.label}
                </span>
              </div>
              <div className="text-sm font-numbers" style={{ color: 'var(--text-secondary)' }}>
                {formatCurrency(segment.value)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
