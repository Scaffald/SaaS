import { useMemo } from 'react';
import { Calendar, AlertTriangle } from 'lucide-react';
import { YStack, XStack, Text, H2, H3, Card } from '@unicornlove/ui';
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
      '$blue9',
      '$purple9',
      '$green9',
      '$yellow9',
      '$red9',
      '$gray9',
    ];
    return colors[index % colors.length];
  };

  return (
    <Card
      backgroundColor="$background"
      borderRadius="$4"
      elevation={1}
      borderWidth={1}
      borderColor="$borderColor"
      padding="$6"
    >
      <XStack alignItems="center" justifyContent="space-between" mb="$6">
        <YStack>
          <H2 fontSize="$6" fontWeight="600" color="$color12">
            Renewal Forecast
          </H2>
          <Text fontSize="$3" color="$color11">
            Policy expirations over next 6 months
          </Text>
        </YStack>
        <XStack alignItems="center" gap="$2">
          <AlertTriangle color="$yellow10" size={18} />
          <Text fontSize="$3" color="$color11">
            {expiringThisMonth} expiring this month
          </Text>
        </XStack>
      </XStack>

      <XStack
        flexDirection="column"
        $gtLg={{ flexDirection: 'row' }}
        gap="$6"
      >
        <YStack flex={1}>
          <H3 fontSize="$3" fontWeight="500" color="$color12" mb="$4">
            Monthly Expirations
          </H3>
          <YStack gap="$3">
            {forecastData.map((data, index) => (
              <XStack key={data.month} alignItems="center" gap="$3">
                <Text width={64} fontSize="$3" fontWeight="500" color="$color11">
                  {data.month}
                </Text>
                <YStack flex={1}>
                  <XStack alignItems="center" gap="$2">
                    <YStack
                      flex={1}
                      backgroundColor="$gray6"
                      borderRadius={9999}
                      height={24}
                      position="relative"
                      overflow="hidden"
                    >
                      <YStack
                        height={24}
                        borderRadius={9999}
                        backgroundColor={
                          index === 0
                            ? '$red9'
                            : index === 1
                              ? '$yellow9'
                              : '$blue9'
                        }
                        width={`${(data.count / maxCount) * 100}%`}
                        alignItems="center"
                        justifyContent="center"
                      >
                        {data.count > 0 && (
                          <Text fontSize="$1" fontWeight="500" color="white" paddingHorizontal="$2">
                            {data.count}
                          </Text>
                        )}
                      </YStack>
                    </YStack>
                    <Text fontSize="$3" color="$color11" width={80} style={{ textAlign: 'right' }}>
                      ${(data.value / 1000).toFixed(0)}K
                    </Text>
                  </XStack>
                </YStack>
              </XStack>
            ))}
          </YStack>
        </YStack>

        <YStack flex={1}>
          <H3 fontSize="$3" fontWeight="500" color="$color12" mb="$4">
            Next 30 Days by Type
          </H3>
          {policyTypeBreakdown.length > 0 ? (
            <YStack gap="$4">
              {policyTypeBreakdown.map((item, index) => (
                <YStack key={item.type}>
                  <XStack alignItems="center" justifyContent="space-between" mb="$1">
                    <Text fontSize="$3" textTransform="capitalize" color="$color12">
                      {item.type}
                    </Text>
                    <Text fontSize="$3" fontWeight="500" color="$color11">
                      {item.count} ({item.percentage.toFixed(0)}%)
                    </Text>
                  </XStack>
                  <YStack width="100%" backgroundColor="$gray6" borderRadius={9999} height={8}>
                    <YStack
                      height={8}
                      borderRadius={9999}
                      backgroundColor={getPolicyTypeColor(index)}
                      width={`${item.percentage}%`}
                    />
                  </YStack>
                </YStack>
              ))}
            </YStack>
          ) : (
            <YStack
              alignItems="center"
              justifyContent="center"
              paddingVertical="$8"
              alignItems="center"
            >
              <Calendar color="$color10" size={48} mb="$3" />
              <Text fontSize="$3" color="$color11">
                No policies expiring in next 30 days
              </Text>
            </YStack>
          )}
        </YStack>
      </XStack>

      <YStack mt="$6" paddingTop="$6" borderTopWidth={1} borderColor="$borderColor">
        <XStack gap="$4" flexWrap="wrap">
          <YStack flex={1} minWidth="30%" alignItems="center">
            <Text fontSize="$8" fontWeight="bold" color="$color12">
              {expiringThisMonth}
            </Text>
            <Text fontSize="$3" color="$color11">This Month</Text>
          </YStack>
          <YStack flex={1} minWidth="30%" alignItems="center">
            <Text fontSize="$8" fontWeight="bold" color="$color12">
              {expiringNextMonth}
            </Text>
            <Text fontSize="$3" color="$color11">Next Month</Text>
          </YStack>
          <YStack flex={1} minWidth="30%" alignItems="center">
            <Text fontSize="$8" fontWeight="bold" color="$color12">
              {forecastData.reduce((sum, d) => sum + d.count, 0)}
            </Text>
            <Text fontSize="$3" color="$color11">6 Months Total</Text>
          </YStack>
        </XStack>
      </YStack>
    </Card>
  );
}
