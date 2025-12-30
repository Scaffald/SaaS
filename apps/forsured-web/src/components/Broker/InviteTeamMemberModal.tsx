/**
 * InviteTeamMemberModal - Broker-specific team member invitation modal
 * BUG-003: Incomplete Team Member Invite Implementation
 *
 * Modal for inviting team members to broker organization with role selection.
 */

import { useState, useEffect } from 'react';
import { UserPlus, X } from 'lucide-react';
import { YStack, XStack, Text, Button, Card, H2, SizableText, Input } from '@unicornlove/ui';
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
        // Store broker_role in metadata or handle separately
        // This would need backend support to properly handle broker_role
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

  return (
    <YStack
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      zIndex={50}
      alignItems="center"
      justifyContent="center"
      backgroundColor="rgba(0,0,0,0.5)"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-member-modal-title"
      onClick={handleBackdropClick}
    >
      <Card
        backgroundColor="$background"
        borderRadius="$4"
        elevation={4}
        width="100%"
        maxWidth={480}
        marginHorizontal="$4"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <XStack
          alignItems="center"
          justifyContent="space-between"
          padding="$4"
          borderBottomWidth={1}
          borderColor="$borderColor"
        >
          <XStack alignItems="center" gap="$3">
            <YStack
              width={40}
              height={40}
              borderRadius={9999}
              backgroundColor="$blue2"
              alignItems="center"
              justifyContent="center"
            >
              <UserPlus size={20} color="var(--blue10)" />
            </YStack>
            <YStack>
              <H2
                id="invite-member-modal-title"
                fontSize="$6"
                fontWeight="600"
                color="$color12"
              >
                Invite Team Member
              </H2>
              <SizableText fontSize="$3" color="$color10">
                Send an invitation to join your broker team
              </SizableText>
            </YStack>
          </XStack>

          {/* Close Button */}
          <Button
            onPress={handleClose}
            disabled={loading}
            variant="outlined"
            size="$2"
            padding="$1"
            opacity={loading ? 0.5 : 1}
            aria-label="Close modal"
          >
            <X size={20} />
          </Button>
        </XStack>

        {/* Form Content */}
        <YStack padding="$4" gap="$4">
          {/* Error Message */}
          {error && (
            <YStack
              backgroundColor="$red2"
              borderWidth={1}
              borderColor="$red6"
              borderRadius="$4"
              padding="$3"
            >
              <SizableText fontSize="$3" color="$red11">
                {error}
              </SizableText>
            </YStack>
          )}

          {/* Name Field */}
          <YStack gap="$2">
            <Text fontSize="$3" fontWeight="500" color="$color11">
              Full Name <Text color="$red10">*</Text>
            </Text>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
              disabled={loading}
              width="100%"
            />
          </YStack>

          {/* Email Field */}
          <YStack gap="$2">
            <Text fontSize="$3" fontWeight="500" color="$color11">
              Email Address <Text color="$red10">*</Text>
            </Text>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              disabled={loading}
              width="100%"
            />
          </YStack>

          {/* Broker Role Selector */}
          <YStack gap="$2">
            <Text fontSize="$3" fontWeight="500" color="$color11">
              Role <Text color="$red10">*</Text>
            </Text>
            <select
              value={brokerRole}
              onChange={(e) => setBrokerRole(e.target.value as BrokerRole)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--borderColor)',
                borderRadius: '8px',
                backgroundColor: 'var(--background)',
                color: 'var(--color12)',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              {BROKER_ROLE_CONFIG.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>

            {/* Role Description */}
            {selectedRoleConfig && (
              <YStack backgroundColor="$blue2" borderRadius="$3" padding="$2">
                <SizableText fontSize="$2" color="$blue11">
                  {selectedRoleConfig.description}
                </SizableText>
              </YStack>
            )}
          </YStack>

          {/* Info Message */}
          <YStack
            backgroundColor="$blue2"
            borderWidth={1}
            borderColor="$blue6"
            borderRadius="$4"
            padding="$3"
          >
            <SizableText fontSize="$2" color="$blue11">
              An invitation email will be sent to the user with instructions to join your broker team.
            </SizableText>
          </YStack>

          {/* Action Buttons */}
          <XStack gap="$3" paddingTop="$2">
            <Button
              variant="outlined"
              onPress={handleClose}
              flex={1}
              disabled={loading}
              opacity={loading ? 0.5 : 1}
            >
              Cancel
            </Button>
            <Button
              onPress={handleSubmit}
              flex={1}
              disabled={loading || !email.trim() || !name.trim()}
              opacity={loading || !email.trim() || !name.trim() ? 0.5 : 1}
              backgroundColor="$blue10"
            >
              <XStack alignItems="center" gap="$2">
                <UserPlus size={16} />
                <Text color="white">
                  {loading ? 'Sending...' : 'Send Invitation'}
                </Text>
              </XStack>
            </Button>
          </XStack>
        </YStack>
      </Card>
    </YStack>
  );
}
