import React from 'react';
import { Shield, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';

interface ComplianceHealthCardProps {
  score: number;
  trend?: 'up' | 'down' | 'stable';
  lastUpdated?: string;
  onClick?: () => void;
}

export default function ComplianceHealthCard({
  score,
  trend = 'stable',
  lastUpdated,
  onClick,
}: ComplianceHealthCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success-600 bg-success-50 border-success-200';
    if (score >= 70) return 'text-warning-600 bg-warning-50 border-warning-200';
    return 'text-error-600 bg-error-50 border-error-200';
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'bg-success-600';
    if (score >= 70) return 'bg-warning-600';
    return 'bg-error-600';
  };

  return (
    <div
      className={`bg-surface rounded-lg border-2 ${getScoreColor(score)} p-6 cursor-pointer hover:shadow-md transition-all duration-200`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`p-3 rounded-xl ${score >= 90 ? 'bg-success-100' : score >= 70 ? 'bg-warning-100' : 'bg-error-100'}`}
          >
            <Shield
              className={
                score >= 90
                  ? 'text-success-600'
                  : score >= 70
                    ? 'text-warning-600'
                    : 'text-error-600'
              }
              size={24}
            />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-secondary">
              Overall Compliance
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span
                className={`text-3xl font-bold ${score >= 90 ? 'text-success-600' : score >= 70 ? 'text-warning-600' : 'text-error-600'}`}
              >
                {score}%
              </span>
              {trend !== 'stable' && (
                <div
                  className={`flex items-center ${trend === 'up' ? 'text-success-600' : 'text-error-600'}`}
                >
                  {trend === 'up' ? (
                    <TrendingUp size={16} />
                  ) : (
                    <TrendingDown size={16} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <ChevronRight className="text-text-tertiary" size={20} />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-text-secondary">
          <span>Across all clients and policies</span>
          {lastUpdated && <span>Updated {lastUpdated}</span>}
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
}
