import { Shield, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { Stack, Row, Text, Card } from '@scaffald/ui';

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
  const getScoreColors = (score: number) => {
    if (score >= 90) {
      return {
        backgroundColor: 'var(--color-green-2)',
        borderColor: 'var(--color-green-6)',
        iconBg: 'var(--color-green-3)',
        iconColor: 'var(--color-green-10)',
        textColor: 'var(--color-green-11)',
        progressColor: 'var(--color-green-10)',
      };
    }
    if (score >= 70) {
      return {
        backgroundColor: 'var(--color-yellow-2)',
        borderColor: 'var(--color-yellow-6)',
        iconBg: 'var(--color-yellow-3)',
        iconColor: 'var(--color-yellow-10)',
        textColor: 'var(--color-yellow-11)',
        progressColor: 'var(--color-yellow-10)',
      };
    }
    return {
      backgroundColor: 'var(--color-red-2)',
      borderColor: 'var(--color-red-6)',
      iconBg: 'var(--color-red-3)',
      iconColor: 'var(--color-red-10)',
      textColor: 'var(--color-red-11)',
      progressColor: 'var(--color-red-10)',
    };
  };

  const colors = getScoreColors(score);

  return (
    <Card
      onClick={onClick}
      style={{
        backgroundColor: colors.backgroundColor,
        borderRadius: 12,
        border: `2px solid ${colors.borderColor}`,
        padding: 24,
        cursor: 'pointer',
      }}
    >
      <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 16 }}>
        <Row alignItems="center" gap={12}>
          <Stack
            style={{
              padding: 12,
              borderRadius: 8,
              backgroundColor: colors.iconBg,
            }}
          >
            <Shield size={24} style={{ color: colors.iconColor }} />
          </Stack>
          <Stack>
            <Text size="sm" weight="medium" muted>
              Overall Compliance
            </Text>
            <Row alignItems="center" gap={8} style={{ marginTop: 4 }}>
              <Text size="2xl" weight="bold" style={{ color: colors.textColor }}>
                {score}%
              </Text>
              {trend !== 'stable' && (
                <Stack>
                  {trend === 'up' ? (
                    <TrendingUp size={16} style={{ color: 'var(--color-green-10)' }} />
                  ) : (
                    <TrendingDown size={16} style={{ color: 'var(--color-red-10)' }} />
                  )}
                </Stack>
              )}
            </Row>
          </Stack>
        </Row>
        <ChevronRight size={20} style={{ color: 'var(--color-text-muted)' }} />
      </Row>

      <Stack gap={8}>
        <Row justifyContent="space-between">
          <Text size="xs" muted>Across all clients and policies</Text>
          {lastUpdated && <Text size="xs" muted>Updated {lastUpdated}</Text>}
        </Row>
        <Stack
          style={{
            width: '100%',
            backgroundColor: 'var(--color-gray-6)',
            borderRadius: 9999,
            height: 8,
          }}
        >
          <Stack
            style={{
              height: 8,
              borderRadius: 9999,
              backgroundColor: colors.progressColor,
              width: `${score}%`,
            }}
          />
        </Stack>
      </Stack>
    </Card>
  );
}
