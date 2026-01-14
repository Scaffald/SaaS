/**
 * InviteTeamMemberModal - Broker-specific team member invitation modal
 * BUG-003: Incomplete Team Member Invite Implementation
 *
 * Modal for inviting team members to broker organization with role selection.
 */

import { useState, useEffect } from 'react';
import { UserPlus, X } from 'lucide-react';
import { Stack, Row, Text, Button, Card, H2, Input } from '@unicornlove/beyond-ui';
import { useUserInvitations } from '../../hooks/useUserInvitations';
import { useUser } from '../../contexts/UserContext';
import { toast } from 'sonner';

interface InviteTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
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
}: InviteTeamMemberModalProps) {
  const { currentUser } = useUser();
  const { createInvitation } = useUserInvitations();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [brokerRole, setBrokerRole] = useState<BrokerRole>('worker');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, loading]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    if (loading) return;

    setEmail('');
    setName('');
    setBrokerRole('worker');
    setError(null);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      handleClose();
    }
  };

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
      await createInvitation({
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role: 'broker', // User type is 'broker'
        invited_by: currentUser?.id || '',
        status: 'pending',
        invited_at: new Date().toISOString(),
      });

      toast.success('Invitation sent successfully', {
        description: `An invitation has been sent to ${email}`,
      });

      // Reset form
      setEmail('');
      setName('');
      setBrokerRole('worker');
      setError(null);

      onSuccess?.();
      onClose();
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

  if (!isOpen) return null;

  const selectedRoleConfig = BROKER_ROLE_CONFIG.find((r) => r.value === brokerRole);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    backgroundColor: 'var(--color-background)',
    color: 'var(--color-text)',
    fontSize: 14,
  };

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

  return (
    <Stack
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-member-modal-title"
    >
      <Card
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 12,
          width: '100%',
          maxWidth: 480,
          marginLeft: 16,
          marginRight: 16,
        }}
      >
        {/* Header */}
        <Row
          alignItems="center"
          justifyContent="space-between"
          padding={16}
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <Row alignItems="center" gap={12}>
            <Stack
              style={{
                width: 40,
                height: 40,
                borderRadius: 9999,
                backgroundColor: 'var(--color-blue-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserPlus size={20} style={{ color: 'var(--color-blue-10)' }} />
            </Stack>
            <Stack>
              <H2
                id="invite-member-modal-title"
                style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)' }}
              >
                Invite Team Member
              </H2>
              <Text size="sm" muted>
                Send an invitation to join your broker team
              </Text>
            </Stack>
          </Row>

          {/* Close Button */}
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="ghost"
            style={{ padding: 4, opacity: loading ? 0.5 : 1 }}
            aria-label="Close modal"
          >
            <X size={20} />
          </Button>
        </Row>

        {/* Form Content */}
        <Stack padding={16} gap={16}>
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
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
              disabled={loading}
              style={inputStyle}
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
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              disabled={loading}
              style={inputStyle}
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

          {/* Action Buttons */}
          <Row gap={12} style={{ paddingTop: 8 }}>
            <Button
              variant="outlined"
              onClick={handleClose}
              disabled={loading}
              style={{ flex: 1, opacity: loading ? 0.5 : 1 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !email.trim() || !name.trim()}
              style={{
                flex: 1,
                opacity: loading || !email.trim() || !name.trim() ? 0.5 : 1,
                backgroundColor: 'var(--color-blue-10)',
              }}
            >
              <Row alignItems="center" gap={8}>
                <UserPlus size={16} />
                <Text style={{ color: 'white' }}>
                  {loading ? 'Sending...' : 'Send Invitation'}
                </Text>
              </Row>
            </Button>
          </Row>
        </Stack>
      </Card>
    </Stack>
  );
}
