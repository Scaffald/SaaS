import { Shield, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { YStack, XStack, Text, Card } from '@unicornlove/ui';

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
    if (score >= 90) {
      return {
        backgroundColor: '$green2',
        color: '$green11',
        borderColor: '$green6',
        iconBg: '$green3',
        iconColor: '$green10',
        textColor: '$green11',
        progressColor: '$green10',
      };
    }
    if (score >= 70) {
      return {
        backgroundColor: '$yellow2',
        color: '$yellow11',
        borderColor: '$yellow6',
        iconBg: '$yellow3',
        iconColor: '$yellow10',
        textColor: '$yellow11',
        progressColor: '$yellow10',
      };
    }
    return {
      backgroundColor: '$red2',
      color: '$red11',
      borderColor: '$red6',
      iconBg: '$red3',
      iconColor: '$red10',
      textColor: '$red11',
      progressColor: '$red10',
    };
  };

  const colors = getScoreColor(score);

  return (
    <Card
      backgroundColor={colors.backgroundColor}
      borderRadius="$4"
      borderWidth={2}
      borderColor={colors.borderColor}
      padding="$6"
      cursor="pointer"
      hoverStyle={{ elevation: 2 }}
      onClick={onClick}
    >
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
        <XStack alignItems="center" gap="$3">
          <YStack padding="$3" borderRadius="$4" backgroundColor={colors.iconBg}>
            <Shield color={colors.iconColor} size={24} />
          </YStack>
          <YStack>
            <Text fontSize="$3" fontWeight="500" color="$color11">
              Overall Compliance
            </Text>
            <XStack alignItems="center" gap="$2" marginTop="$1">
              <Text fontSize="$9" fontWeight="bold" color={colors.textColor}>
                {score}%
              </Text>
              {trend !== 'stable' && (
                <YStack
                  alignItems="center"
                  color={trend === 'up' ? '$green10' : '$red10'}
                >
                  {trend === 'up' ? (
                    <TrendingUp size={16} color="$green10" />
                  ) : (
                    <TrendingDown size={16} color="$red10" />
                  )}
                </YStack>
              )}
            </XStack>
          </YStack>
        </XStack>
        <ChevronRight color="$color10" size={20} />
      </XStack>

      <YStack gap="$2">
        <XStack justifyContent="space-between">
          <Text fontSize="$1" color="$color11">Across all clients and policies</Text>
          {lastUpdated && <Text fontSize="$1" color="$color11">Updated {lastUpdated}</Text>}
        </XStack>
        <YStack width="100%" backgroundColor="$gray6" borderRadius={9999} height={8}>
          <YStack
            height={8}
            borderRadius={9999}
            backgroundColor={colors.progressColor}
            width={`${score}%`}
          />
        </YStack>
      </YStack>
    </Card>
  );
}
