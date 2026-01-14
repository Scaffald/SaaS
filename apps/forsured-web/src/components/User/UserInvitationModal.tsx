import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Stack, Row, Text, Button, Card, Input } from '@unicornlove/beyond-ui';
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
      <Stack style={{ gap: '16px' }}>
        {error && (
          <Stack
            style={{
              backgroundColor: 'var(--color-red-2)',
              border: '1px solid var(--color-red-6)',
              borderRadius: '8px',
              padding: '12px',
            }}
          >
            <Text style={{ fontSize: '14px', color: 'var(--color-red-11)' }}>
              {error}
            </Text>
          </Stack>
        )}

        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          style={{ width: '100%' }}
          required
        />

        <Input
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          style={{ width: '100%' }}
          required
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRoleRBAC)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            backgroundColor: 'var(--color-background)',
          }}
        >
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="user">User</option>
        </select>

        {/* Role Description */}
        <Stack style={{ backgroundColor: 'var(--color-2)', borderRadius: '8px', padding: '12px' }}>
          <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-12)', marginBottom: '4px' }}>
            {role === 'admin' &&
              'Admin: Full access to all features and settings'}
            {role === 'manager' &&
              'Manager: Can manage projects, approve documents, invite users'}
            {role === 'user' &&
              'User: Can view assigned projects, upload documents, complete tasks'}
          </Text>
        </Stack>

        {/* Project Assignment */}
        {projects.length > 0 && (
          <Stack>
            <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-12)', marginBottom: '8px' }}>
              Assign to Projects (Optional)
            </Text>
            <Card
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                maxHeight: '192px',
                overflow: 'auto',
                padding: '8px',
              }}
            >
              <Stack style={{ gap: '8px' }}>
                {projects.map((project) => (
                  <Row
                    key={project.id}
                    style={{
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleProject(project.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProjects.includes(project.id)}
                      onChange={() => toggleProject(project.id)}
                      style={{ borderRadius: '4px', border: '1px solid var(--color-border)' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Text style={{ fontSize: '14px', color: 'var(--color-12)' }}>
                      {project.name}
                    </Text>
                  </Row>
                ))}
              </Stack>
            </Card>
          </Stack>
        )}

        {/* Client Assignment (for brokers) */}
        {isBroker && clients.length > 0 && (
          <Stack>
            <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-12)', marginBottom: '8px' }}>
              Assign to Clients (Optional)
            </Text>
            <Card
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                maxHeight: '192px',
                overflow: 'auto',
                padding: '8px',
              }}
            >
              <Stack style={{ gap: '8px' }}>
                {clients.map((client) => (
                  <Row
                    key={client.id}
                    style={{
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleClient(client.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client.id)}
                      onChange={() => toggleClient(client.id)}
                      style={{ borderRadius: '4px', border: '1px solid var(--color-border)' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Text style={{ fontSize: '14px', color: 'var(--color-12)' }}>
                      {client.name}
                    </Text>
                  </Row>
                ))}
              </Stack>
            </Card>
          </Stack>
        )}

        <Stack
          style={{
            backgroundColor: 'var(--color-blue-2)',
            border: '1px solid var(--color-blue-6)',
            borderRadius: '8px',
            padding: '12px',
          }}
        >
          <Text style={{ fontSize: '12px', color: 'var(--color-blue-11)' }}>
            An invitation email will be sent to the user with instructions to
            join and complete onboarding.
          </Text>
        </Stack>

        <Row style={{ gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
          <Button
            variant="outlined"
            onClick={handleClose}
            style={{ flex: 1 }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            style={{ flex: 1, opacity: loading || !email.trim() || !name.trim() ? 0.5 : 1 }}
            disabled={loading || !email.trim() || !name.trim()}
          >
            <Row style={{ alignItems: 'center', gap: '8px' }}>
              <UserPlus size={16} />
              <Text>{loading ? 'Sending...' : 'Send Invitation'}</Text>
            </Row>
          </Button>
        </Row>
      </Stack>
    </Modal>
  );
}
