/**
 * InvitationForm - Invitation form using Beyond UI
 */
import React, { useState } from 'react';
import { Stack, Row, Text, Button, Input, Card } from '@unicornlove/beyond-ui';

interface InvitationFormProps {
  onSubmit: (data: { email: string; expiresAt: string; maxUses: number }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function InvitationForm({ onSubmit, onCancel, isLoading = false }: InvitationFormProps) {
  const [email, setEmail] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxUses, setMaxUses] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, expiresAt, maxUses });
  };

  return (
    <Card style={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
        Create New Broker Invitation
      </Text>
      <Stack as="form" onSubmit={handleSubmit} style={{ gap: 16 }}>
        <Stack style={{ gap: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-11)' }}>
            Email (Optional)
          </Text>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="broker@example.com"
          />
        </Stack>
        <Stack style={{ gap: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-11)' }}>
            Expires At
          </Text>
          <Input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            required
          />
        </Stack>
        <Stack style={{ gap: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-11)' }}>
            Max Uses
          </Text>
          <Input
            type="number"
            value={maxUses.toString()}
            onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
            min="1"
            required
          />
        </Stack>
        <Row style={{ justifyContent: 'flex-end', gap: 8 }}>
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            Create
          </Button>
        </Row>
      </Stack>
    </Card>
  );
}

export default InvitationForm;
