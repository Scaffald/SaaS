// src/pages/gc/settings/TeamSettings.tsx
import { useState } from 'react';
import { YStack, XStack, Text, Button, Card, H2 } from '@unicornlove/ui';
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
    <YStack gap="$6">
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$6">
        <H2>Team Management</H2>
        <Button variant="primary" onPress={handleInviteMember} icon={<PlusCircle size={16} />}>
          Invite Member
        </Button>
      </XStack>

      <Card padding="$6" marginBottom="$6">
        <YStack gap="$2">
          {/* Table Header */}
          <XStack paddingVertical="$2" paddingHorizontal="$4" borderBottomWidth={1} borderBottomColor="$borderColor">
            <Text flex={1} fontWeight="600" fontSize="$4">Name</Text>
            <Text flex={1} fontWeight="600" fontSize="$4">Email</Text>
            <Text flex={1} fontWeight="600" fontSize="$4">Role</Text>
            <Text flex={1} fontWeight="600" fontSize="$4">Status</Text>
            <Text flex={1} fontWeight="600" fontSize="$4">Actions</Text>
          </XStack>
          {/* Table Rows */}
          {teamMembers.map(member => (
            <XStack
              key={member.id}
              paddingVertical="$2"
              paddingHorizontal="$4"
              borderBottomWidth={1}
              borderBottomColor="$borderColor"
              alignItems="center"
            >
              <Text flex={1} fontSize="$4">{member.name}</Text>
              <Text flex={1} fontSize="$4">{member.email}</Text>
              <Text flex={1} fontSize="$4">{member.role}</Text>
              <Text flex={1} fontSize="$4">{member.status}</Text>
              <XStack flex={1} gap="$2">
                <Button
                  variant="ghost"
                  size="$3"
                  onPress={() => handleEditMember(member.id)}
                  color="$blue10"
                  icon={<Edit size={16} />}
                />
                <Button
                  variant="ghost"
                  size="$3"
                  onPress={() => handleToggleMemberStatus(member.id, member.status)}
                  color="$red10"
                  icon={<UserX size={16} />}
                >
                  {member.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
              </XStack>
            </XStack>
          ))}
        </YStack>
      </Card>
    </YStack>
  );
}

export default GCTeamSettings;
