import React, { useMemo } from 'react';
import { TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import { PolicyData } from '../../types';

interface RenewalForecastWidgetProps {
  policies: PolicyData[];
}

interface ForecastData {
  month: string;
  count: number;
  value: number;
}

export default function RenewalForecastWidget({
  policies,
}: RenewalForecastWidgetProps) {
  const forecastData = useMemo(() => {
    const today = new Date();
    const next6Months: ForecastData[] = [];

    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', {
        month: 'short',
      });

      const monthPolicies = policies.filter((policy) => {
        const endDate = new Date(policy.end_date);
        return (
          endDate.getMonth() === monthDate.getMonth() &&
          endDate.getFullYear() === monthDate.getFullYear()
        );
      });

      next6Months.push({
        month: monthName,
        count: monthPolicies.length,
        value: monthPolicies.reduce(
          (sum, p) => sum + (p.premium_amount || 0),
          0
        ),
      });
    }

    return next6Months;
  }, [policies]);

  const maxCount = Math.max(...forecastData.map((d) => d.count), 1);
  const expiringThisMonth = forecastData[0]?.count || 0;
  const expiringNextMonth = forecastData[1]?.count || 0;

  const policyTypeBreakdown = useMemo(() => {
    const next30Days = new Date();
    next30Days.setDate(next30Days.getDate() + 30);

    const upcoming = policies.filter((policy) => {
      const endDate = new Date(policy.end_date);
      return endDate <= next30Days && endDate >= new Date();
    });

    const breakdown: { [key: string]: number } = {};
    upcoming.forEach((policy) => {
      const type = policy.policy_type.replace('_', ' ');
      breakdown[type] = (breakdown[type] || 0) + 1;
    });

    return Object.entries(breakdown).map(([type, count]) => ({
      type,
      count,
      percentage: (count / upcoming.length) * 100,
    }));
  }, [policies]);

  const getPolicyTypeColor = (index: number) => {
    const colors = [
      'bg-primary-500',
      'bg-secondary-500',
      'bg-success-500',
      'bg-warning-500',
      'bg-error-500',
      'bg-tertiary-500',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            Renewal Forecast
          </h2>
          <p className="text-sm text-text-secondary">
            Policy expirations over next 6 months
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <AlertTriangle className="text-warning-600" size={18} />
          <span className="text-text-secondary">
            {expiringThisMonth} expiring this month
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-4">
            Monthly Expirations
          </h3>
          <div className="space-y-3">
            {forecastData.map((data, index) => (
              <div key={data.month} className="flex items-center space-x-3">
                <div className="w-16 text-sm font-medium text-text-secondary">
                  {data.month}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-neutral-200 rounded-full h-6 relative overflow-hidden">
                      <div
                        className={`h-6 rounded-full transition-all ${
                          index === 0
                            ? 'bg-error-500'
                            : index === 1
                              ? 'bg-warning-500'
                              : 'bg-primary-500'
                        }`}
                        style={{ width: `${(data.count / maxCount) * 100}%` }}
                      >
                        <div className="flex items-center justify-center h-full">
                          {data.count > 0 && (
                            <span className="text-xs font-medium text-white px-2">
                              {data.count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-text-secondary w-20 text-right">
                      ${(data.value / 1000).toFixed(0)}K
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-text-primary mb-4">
            Next 30 Days by Type
          </h3>
          {policyTypeBreakdown.length > 0 ? (
            <div className="space-y-4">
              {policyTypeBreakdown.map((item, index) => (
                <div key={item.type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm capitalize text-text-primary">
                      {item.type}
                    </span>
                    <span className="text-sm font-medium text-text-secondary">
                      {item.count} ({item.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getPolicyTypeColor(index)}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="text-text-tertiary mb-3" size={48} />
              <p className="text-text-secondary text-sm">
                No policies expiring in next 30 days
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-text-primary">
              {expiringThisMonth}
            </p>
            <p className="text-sm text-text-secondary">This Month</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-text-primary">
              {expiringNextMonth}
            </p>
            <p className="text-sm text-text-secondary">Next Month</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-text-primary">
              {forecastData.reduce((sum, d) => sum + d.count, 0)}
            </p>
            <p className="text-sm text-text-secondary">6 Months Total</p>
          </div>
        </div>
      </div>
    </div>
  );
}
