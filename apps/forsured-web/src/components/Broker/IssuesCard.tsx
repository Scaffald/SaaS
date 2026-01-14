import { XCircle, ChevronRight } from 'lucide-react';
import { Stack, Row, Text, Card } from '@unicornlove/beyond-ui';

interface IssuesCardProps {
  count: number;
  onClick?: () => void;
}

export default function IssuesCard({ count, onClick }: IssuesCardProps) {
  return (
    <Card
      onClick={onClick}
      style={{
        backgroundColor: 'var(--color-red-2)',
        borderRadius: 12,
        border: '2px solid var(--color-red-6)',
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
              backgroundColor: 'var(--color-red-3)',
            }}
          >
            <XCircle size={24} style={{ color: 'var(--color-red-10)' }} />
          </Stack>
          <Stack>
            <Text size="sm" weight="medium" muted>
              Critical Issues
            </Text>
            <Row alignItems="center" gap={8} style={{ marginTop: 4 }}>
              <Text size="2xl" weight="bold" style={{ color: 'var(--color-red-10)' }}>{count}</Text>
            </Row>
          </Stack>
        </Row>
        <ChevronRight size={20} style={{ color: 'var(--color-text-muted)' }} />
      </Row>
      <Stack style={{ marginTop: 16 }}>
        <Text size="xs" muted>Policy issues to address</Text>
      </Stack>
    </Card>
  );
}
