// src/pages/gc/settings/TeamSettings.tsx
import { useState } from 'react';
import { Stack, Row, Text, Button, Card, H2 } from '@unicornlove/beyond-ui';
import { PlusCircle, UserX, Edit } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  status: 'active' | 'inactive';
}

const mockTeamMembers: TeamMember[] = [
  { id: '1', name: 'John Doe', email: 'john.doe@example.com', role: 'manager', status: 'active' },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'member', status: 'active' },
  { id: '3', name: 'Bob Johnson', email: 'bob.j@example.com', role: 'member', status: 'inactive' },
];

function GCTeamSettings() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);

  const handleInviteMember = () => {
    console.log('Inviting new team member');
    // In a real app, open a modal for inviting a new member
  };

  const handleEditMember = (memberId: string) => {
    console.log('Editing team member:', memberId);
    // In a real app, open a modal for editing a member
  };

  const handleToggleMemberStatus = (memberId: string, currentStatus: TeamMember['status']) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    console.log(`Toggling status for member ${memberId} to ${newStatus}`);
    setTeamMembers(prev =>
      prev.map(member =>
        member.id === memberId ? { ...member, status: newStatus } : member
      )
    );
    // In a real app, make an API call to update member status
  };

  return (
    <Stack style={{ gap: 'var(--space-6)' }}>
      <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <H2>Team Management</H2>
        <Button variant="primary" onPress={handleInviteMember} leftIcon={<PlusCircle size={16} />}>
          Invite Member
        </Button>
      </Row>

      <Card style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <Stack style={{ gap: 'var(--space-2)' }}>
          {/* Table Header */}
          <Row style={{ paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)', paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
            <Text style={{ flex: 1, fontWeight: 600, fontSize: 'var(--font-size-4)' }}>Name</Text>
            <Text style={{ flex: 1, fontWeight: 600, fontSize: 'var(--font-size-4)' }}>Email</Text>
            <Text style={{ flex: 1, fontWeight: 600, fontSize: 'var(--font-size-4)' }}>Role</Text>
            <Text style={{ flex: 1, fontWeight: 600, fontSize: 'var(--font-size-4)' }}>Status</Text>
            <Text style={{ flex: 1, fontWeight: 600, fontSize: 'var(--font-size-4)' }}>Actions</Text>
          </Row>
          {/* Table Rows */}
          {teamMembers.map(member => (
            <Row
              key={member.id}
              style={{
                paddingTop: 'var(--space-2)',
                paddingBottom: 'var(--space-2)',
                paddingLeft: 'var(--space-4)',
                paddingRight: 'var(--space-4)',
                borderBottom: '1px solid var(--color-border)',
                alignItems: 'center',
              }}
            >
              <Text style={{ flex: 1, fontSize: 'var(--font-size-4)' }}>{member.name}</Text>
              <Text style={{ flex: 1, fontSize: 'var(--font-size-4)' }}>{member.email}</Text>
              <Text style={{ flex: 1, fontSize: 'var(--font-size-4)' }}>{member.role}</Text>
              <Text style={{ flex: 1, fontSize: 'var(--font-size-4)' }}>{member.status}</Text>
              <Row style={{ flex: 1, gap: 'var(--space-2)' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => handleEditMember(member.id)}
                  leftIcon={<Edit size={16} />}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => handleToggleMemberStatus(member.id, member.status)}
                  leftIcon={<UserX size={16} />}
                >
                  {member.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
              </Row>
            </Row>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}

export default GCTeamSettings;
