// src/pages/gc/settings/TeamSettings.tsx
import { useState } from 'react';
import { Stack, Row, Button, SettingsTeamTable, SettingsSectionHeader } from '@scaffald/ui';
import type { TeamMember } from '@scaffald/ui';
import { PlusCircle, Users } from 'lucide-react-native';

const mockTeamMembers: TeamMember[] = [
  { id: '1', name: 'John Doe', email: 'john.doe@example.com', dateAdded: '2024-01-15', role: 'Manager', selected: false },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', dateAdded: '2024-01-20', role: 'Member', selected: false },
  { id: '3', name: 'Bob Johnson', email: 'bob.j@example.com', dateAdded: '2024-02-01', role: 'Member', selected: false },
];

function GCTeamSettings() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);

  const handleInviteMember = () => {
    console.log('Inviting new team member');
    // In a real app, open a modal for inviting a new member
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setTeamMembers(prev =>
      prev.map(member => ({
        ...member,
        selected: selectedIds.includes(member.id),
      }))
    );
  };

  const handleEdit = (memberId: string) => {
    console.log('Editing team member:', memberId);
    // In a real app, open a modal for editing a member
  };

  const handleDelete = (memberId: string) => {
    setTeamMembers(prev => prev.filter(member => member.id !== memberId));
    // In a real app, make an API call to delete member
  };

  return (
    <Stack style={{ gap: 'var(--space-6)' }}>
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <SettingsSectionHeader
          icon={Users}
          title="Team"
          description="Manage your team members here"
        />
        <Button variant="primary" onPress={handleInviteMember} leftIcon={<PlusCircle size={16} />}>
          Add new
        </Button>
      </Row>

      <SettingsTeamTable
        members={teamMembers}
        onSelectionChange={handleSelectionChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </Stack>
  );
}

export default GCTeamSettings;
