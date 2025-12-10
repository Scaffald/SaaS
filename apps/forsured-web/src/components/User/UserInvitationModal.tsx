import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Select from '../Common/Select';
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite User" size="md">
      <div className="space-y-4">
        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-3">
            <p className="text-sm text-error-700">{error}</p>
          </div>
        )}

        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          fullWidth
          required
        />

        <Input
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          fullWidth
          required
        />

        <Select
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRoleRBAC)}
          options={[
            { value: 'admin', label: 'Admin' },
            { value: 'manager', label: 'Manager' },
            { value: 'user', label: 'User' },
          ]}
          fullWidth
        />

        {/* Role Description */}
        <div className="bg-bg-secondary rounded-lg p-3 text-sm">
          <p className="font-medium text-text-primary mb-1">
            {role === 'admin' &&
              'Admin: Full access to all features and settings'}
            {role === 'manager' &&
              'Manager: Can manage projects, approve documents, invite users'}
            {role === 'user' &&
              'User: Can view assigned projects, upload documents, complete tasks'}
          </p>
        </div>

        {/* Project Assignment */}
        {projects.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Assign to Projects (Optional)
            </label>
            <div className="border border-border rounded-lg max-h-48 overflow-y-auto p-2 space-y-2">
              {projects.map((project) => (
                <label
                  key={project.id}
                  className="flex items-center space-x-2 p-2 hover:bg-bg-secondary rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedProjects.includes(project.id)}
                    onChange={() => toggleProject(project.id)}
                    className="rounded border-border text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-text-primary">
                    {project.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Client Assignment (for brokers) */}
        {isBroker && clients.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Assign to Clients (Optional)
            </label>
            <div className="border border-border rounded-lg max-h-48 overflow-y-auto p-2 space-y-2">
              {clients.map((client) => (
                <label
                  key={client.id}
                  className="flex items-center space-x-2 p-2 hover:bg-bg-secondary rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedClients.includes(client.id)}
                    onChange={() => toggleClient(client.id)}
                    className="rounded border-border text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-text-primary">
                    {client.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
          <p className="text-xs text-primary-900">
            An invitation email will be sent to the user with instructions to
            join and complete onboarding.
          </p>
        </div>

        <div className="flex space-x-3 pt-4 border-t border-border">
          <Button
            variant="secondary"
            onClick={handleClose}
            fullWidth
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            fullWidth
            disabled={loading || !email.trim() || !name.trim()}
            leftIcon={UserPlus}
          >
            {loading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
