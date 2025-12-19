import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { YStack, XStack, Text, Button, Card, SizableText, Input, Checkbox } from '@unicornlove/ui';
import Modal from '../Common/Modal';
import { useUserInvitations } from '../../hooks/useUserInvitations';
import { useProjects } from '../../hooks/useProjects';
import { useClients } from '../../hooks/useClients';
import { useUser } from '../../contexts/UserContext';
import { UserRoleRBAC } from '../../types';

interface UserInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  onSuccess?: () => void;
}

export default function UserInvitationModal({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}: UserInvitationModalProps) {
  const { currentUser } = useUser();
  const { createInvitation } = useUserInvitations();
  const { projects } = useProjects();
  const { clients } = useClients();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRoleRBAC>('user');
  const [selectedProjects, setSelectedProjects] = useState<string[]>(
    projectId ? [projectId] : []
  );
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!email.trim() || !name.trim()) {
      setError('Email and name are required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await createInvitation({
        email: email.trim(),
        name: name.trim(),
        role,
        invited_by: currentUser?.id || '',
        status: 'pending',
        project_ids: selectedProjects,
        client_ids: selectedClients,
        invited_at: new Date().toISOString(),
      });

      // Reset form
      setEmail('');
      setName('');
      setRole('user');
      setSelectedProjects(projectId ? [projectId] : []);
      setSelectedClients([]);
      setError(null);

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to send invitation. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setName('');
    setRole('user');
    setSelectedProjects(projectId ? [projectId] : []);
    setSelectedClients([]);
    setError(null);
    onClose();
  };

  const toggleProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const toggleClient = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const isBroker = currentUser?.role === 'broker';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite User" size="medium">
      <YStack gap="$4">
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

        <Input
          label="Email Address"
          type="email"
          value={email}
          onChangeText={setEmail}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          width="100%"
          required
        />

        <Input
          label="Full Name"
          value={name}
          onChangeText={setName}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          width="100%"
          required
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRoleRBAC)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid var(--borderColor)',
            borderRadius: '8px',
            backgroundColor: 'var(--background)',
          }}
        >
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="user">User</option>
        </select>

        {/* Role Description */}
        <YStack backgroundColor="$color2" borderRadius="$4" padding="$3">
          <SizableText fontSize="$3" fontWeight="500" color="$color12" marginBottom="$1">
            {role === 'admin' &&
              'Admin: Full access to all features and settings'}
            {role === 'manager' &&
              'Manager: Can manage projects, approve documents, invite users'}
            {role === 'user' &&
              'User: Can view assigned projects, upload documents, complete tasks'}
          </SizableText>
        </YStack>

        {/* Project Assignment */}
        {projects.length > 0 && (
          <YStack>
            <SizableText fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2">
              Assign to Projects (Optional)
            </SizableText>
            <Card
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              maxHeight={192}
              overflow="scroll"
              padding="$2"
            >
              <YStack gap="$2">
                {projects.map((project) => (
                  <XStack
                    key={project.id}
                    alignItems="center"
                    gap="$2"
                    padding="$2"
                    borderRadius="$2"
                    cursor="pointer"
                    hoverStyle={{ backgroundColor: '$color2' }}
                    onPress={() => toggleProject(project.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProjects.includes(project.id)}
                      onChange={() => toggleProject(project.id)}
                      style={{ borderRadius: '4px', border: '1px solid var(--borderColor)' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <SizableText fontSize="$3" color="$color12">
                      {project.name}
                    </SizableText>
                  </XStack>
                ))}
              </YStack>
            </Card>
          </YStack>
        )}

        {/* Client Assignment (for brokers) */}
        {isBroker && clients.length > 0 && (
          <YStack>
            <SizableText fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2">
              Assign to Clients (Optional)
            </SizableText>
            <Card
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              maxHeight={192}
              overflow="scroll"
              padding="$2"
            >
              <YStack gap="$2">
                {clients.map((client) => (
                  <XStack
                    key={client.id}
                    alignItems="center"
                    gap="$2"
                    padding="$2"
                    borderRadius="$2"
                    cursor="pointer"
                    hoverStyle={{ backgroundColor: '$color2' }}
                    onPress={() => toggleClient(client.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client.id)}
                      onChange={() => toggleClient(client.id)}
                      style={{ borderRadius: '4px', border: '1px solid var(--borderColor)' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <SizableText fontSize="$3" color="$color12">
                      {client.name}
                    </SizableText>
                  </XStack>
                ))}
              </YStack>
            </Card>
          </YStack>
        )}

        <YStack backgroundColor="$blue2" borderWidth={1} borderColor="$blue6" borderRadius="$4" padding="$3">
          <SizableText fontSize="$1" color="$blue11">
            An invitation email will be sent to the user with instructions to
            join and complete onboarding.
          </SizableText>
        </YStack>

        <XStack gap="$3" paddingTop="$4" borderTopWidth={1} borderColor="$borderColor">
          <Button
            variant="outlined"
            onPress={handleClose}
            flex={1}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onPress={handleSubmit}
            flex={1}
            disabled={loading || !email.trim() || !name.trim()}
            opacity={loading || !email.trim() || !name.trim() ? 0.5 : 1}
          >
            <XStack alignItems="center" gap="$2">
              <UserPlus size={16} />
              <Text>{loading ? 'Sending...' : 'Send Invitation'}</Text>
            </XStack>
          </Button>
        </XStack>
      </YStack>
    </Modal>
  );
}
