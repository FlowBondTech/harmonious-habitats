import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AnalyticsChartProps {
  title: string;
  data: Array<{
    label: string;
    value: number;
    change?: number;
    color?: string;
  }>;
  type?: 'bar' | 'line' | 'pie';
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ 
  title, 
  data, 
  type = 'bar' 
}) => {
  const maxValue = Math.max(...data.map(d => d.value));

  const getTrendIcon = (change?: number) => {
    if (!change) return <Minus className="h-3 w-3 text-gray-400" />;
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  const getTrendColor = (change?: number) => {
    if (!change) return 'text-gray-500';
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-forest-50">
      <h3 className="text-lg font-semibold text-forest-800 mb-6">{title}</h3>
      
      {type === 'bar' && (
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-forest-700">{item.label}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-forest-800">{item.value}</span>
                  {item.change !== undefined && (
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(item.change)}
                      <span className={`text-xs font-medium ${getTrendColor(item.change)}`}>
                        {item.change > 0 ? '+' : ''}{item.change}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full bg-forest-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    item.color || 'bg-gradient-to-r from-forest-500 to-earth-400'
                  }`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {type === 'pie' && (
        <div className="space-y-4">
          <div className="relative w-32 h-32 mx-auto">
            {/* Simple pie chart representation */}
            <div className="w-full h-full rounded-full bg-gradient-to-r from-forest-500 via-earth-400 to-forest-300 relative">
              <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-forest-800">
                  {data.reduce((sum, item) => sum + item.value, 0)}
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className={`w-3 h-3 rounded-full ${
                      item.color || ['bg-forest-500', 'bg-earth-400', 'bg-forest-300'][index % 3]
                    }`}
                  />
                  <span className="text-sm text-forest-700">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-forest-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {type === 'line' && (
        <div className="space-y-4">
          <div className="h-32 flex items-end space-x-2">
            {data.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full rounded-t transition-all duration-500 ${
                    item.color || 'bg-gradient-to-t from-forest-500 to-earth-400'
                  }`}
                  style={{ height: `${(item.value / maxValue) * 100}%` }}
                />
                <span className="text-xs text-forest-600 mt-2 text-center">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-center space-x-4">
            {data.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-sm font-bold text-forest-800">{item.value}</div>
                {item.change !== undefined && (
                  <div className="flex items-center justify-center space-x-1">
                    {getTrendIcon(item.change)}
                    <span className={`text-xs ${getTrendColor(item.change)}`}>
                      {item.change > 0 ? '+' : ''}{item.change}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsChart;