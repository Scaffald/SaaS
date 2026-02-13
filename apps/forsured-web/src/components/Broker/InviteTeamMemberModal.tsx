/**
 * InviteTeamMemberModal - Broker-specific team member invitation modal
 * Modal for inviting team members to broker organization with role selection.
 *
 * Uses SimpleModal instead of React Native Modal to avoid focus trap issues
 * that cause the modal to close unexpectedly on web.
 */

import { useState, useCallback } from 'react';
import { UserPlus } from 'lucide-react';
import {
  Stack,
  Row,
  Text,
  Input,
  Button,
} from '@scaffald/ui';
import { SimpleModal } from '../Common/SimpleModal';
import { useUserInvitations } from '../../hooks/useUserInvitations';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface InviteTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  organizationId?: string | null;
}

type BrokerRole = 'admin' | 'worker';

const BROKER_ROLE_CONFIG = [
  {
    value: 'admin' as BrokerRole,
    label: 'Administrator',
    description: 'Full access to manage team, clients, and settings',
  },
  {
    value: 'worker' as BrokerRole,
    label: 'Worker',
    description: 'Access to assigned clients and basic features',
  },
];

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InviteTeamMemberModal({
  isOpen,
  onClose,
  onSuccess,
  organizationId,
}: InviteTeamMemberModalProps) {
  const { currentUser } = useUser();
  const { user: authUser } = useAuth();
  const { createInvitation } = useUserInvitations();

  // Use either currentUser.id or authUser.id (from Supabase auth)
  const inviterId = currentUser?.id || authUser?.id;

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [brokerRole, setBrokerRole] = useState<BrokerRole>('worker');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Internal modal handler - completely separate from parent component handlers
  const handleClose = useCallback(() => {
    if (loading) return;

    setEmail('');
    setName('');
    setBrokerRole('worker');
    setError(null);
    onClose();
  }, [loading, onClose]);

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setError('Email address is required');
      return false;
    }

    if (!EMAIL_REGEX.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!name.trim()) {
      setError('Full name is required');
      return false;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (!organizationId) {
        setError('Organization ID is required. Please refresh the page and try again.');
        setLoading(false);
        return;
      }

      if (!inviterId) {
        setError('User session not found. Please refresh the page and try again.');
        setLoading(false);
        return;
      }

      // Create invitation with the same organization_id as the inviter
      // The invited user will join the same broker organization/team
      await createInvitation({
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role: 'broker', // User type is 'broker'
        invited_by: inviterId,
        status: 'pending',
        invited_at: new Date().toISOString(),
        organization_id: organizationId, // Same organization as the inviter
      });

      toast.success('Invitation sent successfully', {
        description: `An invitation has been sent to ${email}`,
      });

      // Reset form
      setEmail('');
      setName('');
      setBrokerRole('worker');
      setError(null);

      // Notify parent of success - parent will handle closing and refreshing
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to send invitation. Please try again.';

      setError(errorMessage);
      toast.error('Failed to send invitation', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedRoleConfig = BROKER_ROLE_CONFIG.find((r) => r.value === brokerRole);

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    backgroundColor: 'var(--color-background)',
    color: 'var(--color-text)',
    fontSize: 14,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.5 : 1,
  };

  const footer = (
    <Row gap={12} justifyContent="flex-end" style={{ width: '100%' }}>
      <Button
        variant="ghost"
        color="gray"
        onPress={handleClose}
        disabled={loading}
      >
        Cancel
      </Button>
      <Button
        color="primary"
        onPress={handleSubmit}
        disabled={loading || !email.trim() || !name.trim()}
        loading={loading}
      >
        {loading ? 'Sending...' : 'Send Invitation'}
      </Button>
    </Row>
  );

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite Team Member"
      description="Send an invitation to join your broker team"
      icon={<UserPlus size={20} style={{ color: 'var(--color-blue-10)' }} />}
      width={480}
      closeOnBackdropClick={!loading}
      closeOnEscape={!loading}
      footer={footer}
      testID="invite-team-member-modal"
    >
      <Stack gap={16}>
        {/* Error Message */}
        {error && (
          <Stack
            style={{
              backgroundColor: 'var(--color-red-2)',
              border: '1px solid var(--color-red-6)',
              borderRadius: 8,
              padding: 12,
            }}
          >
            <Text size="sm" style={{ color: 'var(--color-red-11)' }}>
              {error}
            </Text>
          </Stack>
        )}

        {/* Name Field */}
        <Stack gap={8}>
          <Text size="sm" weight="medium" muted>
            Full Name <span style={{ color: 'var(--color-red-10)' }}>*</span>
          </Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Enter full name"
            disabled={loading}
          />
        </Stack>

        {/* Email Field */}
        <Stack gap={8}>
          <Text size="sm" weight="medium" muted>
            Email Address <span style={{ color: 'var(--color-red-10)' }}>*</span>
          </Text>
          <Input
            type="email"
            value={email}
            onChangeText={setEmail}
            placeholder="user@example.com"
            disabled={loading}
          />
        </Stack>

        {/* Broker Role Selector */}
        <Stack gap={8}>
          <Text size="sm" weight="medium" muted>
            Role <span style={{ color: 'var(--color-red-10)' }}>*</span>
          </Text>
          <select
            value={brokerRole}
            onChange={(e) => setBrokerRole(e.target.value as BrokerRole)}
            disabled={loading}
            style={selectStyle}
          >
            {BROKER_ROLE_CONFIG.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>

          {/* Role Description */}
          {selectedRoleConfig && (
            <Stack
              style={{
                backgroundColor: 'var(--color-blue-2)',
                borderRadius: 6,
                padding: 8,
              }}
            >
              <Text size="xs" style={{ color: 'var(--color-blue-11)' }}>
                {selectedRoleConfig.description}
              </Text>
            </Stack>
          )}
        </Stack>

        {/* Info Message */}
        <Stack
          style={{
            backgroundColor: 'var(--color-blue-2)',
            border: '1px solid var(--color-blue-6)',
            borderRadius: 8,
            padding: 12,
          }}
        >
          <Text size="xs" style={{ color: 'var(--color-blue-11)' }}>
            An invitation email will be sent to the user with instructions to join your broker team.
          </Text>
        </Stack>
      </Stack>
    </SimpleModal>
  );
}
