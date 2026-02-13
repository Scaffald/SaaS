import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Stack, Row, Text, Card } from '@scaffald/ui';

interface WarningsCardProps {
  count: number;
  onClick?: () => void;
}

export default function WarningsCard({ count, onClick }: WarningsCardProps) {
  return (
    <Card
      onClick={onClick}
      style={{
        backgroundColor: 'var(--color-yellow-2)',
        borderRadius: 12,
        border: '2px solid var(--color-yellow-6)',
        padding: 24,
        cursor: 'pointer',
      }}
    >
      <Row alignItems="center" justifyContent="space-between">
        <Row alignItems="center" gap={12}>
          <Stack
            style={{
              padding: 12,
              borderRadius: 8,
              backgroundColor: 'var(--color-yellow-3)',
            }}
          >
            <AlertTriangle size={24} style={{ color: 'var(--color-yellow-10)' }} />
          </Stack>
          <Stack>
            <Text size="sm" weight="medium" muted>
              Warnings
            </Text>
            <Row alignItems="center" gap={8} style={{ marginTop: 4 }}>
              <Text size="2xl" weight="bold" style={{ color: 'var(--color-yellow-10)' }}>
                {count}
              </Text>
            </Row>
          </Stack>
        </Row>
        <ChevronRight size={20} style={{ color: 'var(--color-text-muted)' }} />
      </Row>
      <Stack style={{ marginTop: 16 }}>
        <Text size="xs" muted>Suggestions and warnings</Text>
      </Stack>
    </Card>
  );
}
