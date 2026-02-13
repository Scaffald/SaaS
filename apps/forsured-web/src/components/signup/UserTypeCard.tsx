/**
 * UserTypeCard - User type selection card using Beyond UI
 */
import { useState, useEffect } from 'react';
import { Stack, Row, Text, Button } from '@scaffald/ui';
import { Loader2 } from 'lucide-react';

interface UserTypeCardProps {
  type: 'gc' | 'contractor';
  title: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
  loading?: boolean;
}

function getCardStyle(selected: boolean): React.CSSProperties {
  return {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: selected ? 'var(--color-blue2)' : 'var(--color-background)',
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: selected ? 'var(--color-blue9)' : 'transparent',
    borderRadius: 12,
    cursor: 'pointer',
  };
}

function UserTypeCard({
  type,
  title,
  description,
  icon,
  selected,
  onSelect,
  loading = false
}: UserTypeCardProps) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setRotation((prev) => (prev + 30) % 360);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [loading]);

  return (
    <Button
      onPress={onSelect}
      disabled={loading}
      aria-pressed={selected}
      style={getCardStyle(selected)}
    >
      <Stack style={{ alignItems: 'center', gap: 8 }}>
        <Stack>{icon}</Stack>
        <Text size="lg" weight="semibold">
          {title}
        </Text>
        <Text size="sm" color="secondary" style={{ textAlign: 'center' }}>
          {description}
        </Text>
        <Stack style={{ marginTop: 8 }}>
          {loading ? (
            <Row style={{ alignItems: 'center', gap: 8 }}>
              <div style={{ transform: `rotate(${rotation}deg)` }}>
                <Loader2 size={16} className="animate-spin" />
              </div>
              <Text size="sm">Loading...</Text>
            </Row>
          ) : (
            <Text size="sm" color="var(--color-blue9)">
              Select {title.split(' ')[0]}
            </Text>
          )}
        </Stack>
      </Stack>
    </Button>
  );
}

export default UserTypeCard;
