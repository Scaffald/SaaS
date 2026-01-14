/**
 * Team Members Page
 * REQ-283: Team Member Management UI
 * TASK-1: Create Team Members List Page
 * TASK-2: Build Member Detail Modal with Access Management
 *
 * Main team management page with:
 * - Team members list with filtering
 * - Summary statistics
 * - Member detail modal with access management
 * - Add member button (for TASK-3)
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Stack, Row, Text, Button, Card, H1 } from '@unicornlove/beyond-ui';
import { Plus } from 'lucide-react';
import {
  TeamMembersList,
  MemberDetailModal,
  AddTeamMemberModal,
  type TeamMember,
  type AccessLevel,
  type ActivityEntry,
} from '../../../components/team';
import { trpc } from '../../../lib/trpc';

// TODO: Replace with real organization ID from auth context
const MOCK_ORG_ID = '00000000-0000-0000-0000-000000000001';

type RoleFilter = 'all' | TeamMember['role'];

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch team members
  const {
    data: membersData,
    isLoading: membersLoading,
    refetch: refetchMembers,
  } = trpc.teamMembers.list.useQuery(
    {
      organizationId: MOCK_ORG_ID,
      role: roleFilter === 'all' ? undefined : roleFilter,
      search: searchQuery || undefined,
      limit: 100,
      offset: 0,
    },
    {
      enabled: !!MOCK_ORG_ID,
    }
  );

  // Fetch team summary
  const { data: summaryData, refetch: refetchSummary } = trpc.teamMembers.getSummary.useQuery(
    {
      organizationId: MOCK_ORG_ID,
    },
    {
      enabled: !!MOCK_ORG_ID,
    }
  );

  // Mutation for updating member role
  const updateRoleMutation = trpc.teamMembers.updateRole.useMutation({
    onSuccess: () => {
      refetchMembers();
      refetchSummary();
    },
  });

  // Mutation for removing member
  const removeMemberMutation = trpc.teamMembers.remove.useMutation({
    onSuccess: () => {
      refetchMembers();
      refetchSummary();
    },
  });

  // Mutation for inviting member
  const inviteMemberMutation = trpc.teamMembers.invite.useMutation({
    onSuccess: () => {
      refetchMembers();
      refetchSummary();
      setIsAddModalOpen(false);
    },
  });

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handle role filter
  const handleRoleFilter = useCallback((role: RoleFilter) => {
    setRoleFilter(role);
  }, []);

  // Handle member click - open detail modal
  const handleMemberClick = useCallback((member: TeamMember) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  }, []);

  // Handle member edit - also opens modal
  const handleMemberEdit = useCallback((member: TeamMember) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  }, []);

  // Handle member remove from list (with confirmation in modal)
  const handleMemberRemove = useCallback((member: TeamMember) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  }, []);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedMember(null);
  }, []);

  // Handle role update from modal
  const handleUpdateRole = useCallback(
    async (memberId: string, role: AccessLevel) => {
      await updateRoleMutation.mutateAsync({
        organizationId: MOCK_ORG_ID,
        memberId,
        role,
      });
    },
    [updateRoleMutation]
  );

  // Handle remove from modal
  const handleRemoveMember = useCallback(
    async (memberId: string) => {
      await removeMemberMutation.mutateAsync({
        organizationId: MOCK_ORG_ID,
        memberId,
      });
    },
    [removeMemberMutation]
  );

  // Handle add member - open add member modal
  const handleAddMember = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  // Handle invite member submission
  const handleInviteMember = useCallback(
    async (data: { email: string; name: string; role: AccessLevel }) => {
      await inviteMemberMutation.mutateAsync({
        organizationId: MOCK_ORG_ID,
        email: data.email,
        name: data.name,
        role: data.role,
      });
    },
    [inviteMemberMutation]
  );

  // Map API data to TeamMember type
  const members: TeamMember[] =
    membersData?.members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      company: m.company,
      avatar: m.avatar,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    })) ?? [];

  // Get existing emails for duplicate checking
  const existingEmails = members.map((m) => m.email.toLowerCase());

  // Mock activities for now (TODO: fetch from audit logs)
  const mockActivities: ActivityEntry[] = selectedMember
    ? [
        {
          id: '1',
          action: 'login',
          description: 'Logged in from Chrome on macOS',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '2',
          action: 'update',
          description: 'Updated project compliance settings',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '3',
          action: 'create',
          description: 'Created new task "Review insurance documents"',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
        },
      ]
    : [];

  return (
    <Stack style={{ minHeight: '100vh', backgroundColor: 'var(--color-gray-2)' }}>
      <Stack style={{ maxWidth: 1120, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
        {/* Header */}
        <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <Stack>
            <H1>Team Members</H1>
            <Text style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-2)', color: 'var(--color-gray-11)' }}>
              Manage your organization's team members and their roles
            </Text>
          </Stack>
          <Button
            onPress={handleAddMember}
            style={{ backgroundColor: 'var(--color-blue-9)', color: 'white', fontSize: 'var(--font-size-2)', fontWeight: 500, borderRadius: 'var(--radius-4)' }}
          >
            <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
              <Plus size={20} />
              <Text>Invite Member</Text>
            </Row>
          </Button>
        </Row>

        {/* Summary Cards */}
        {summaryData && (
          <Row style={{ flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
            <Card style={{ flex: 1, minWidth: 150, padding: 'var(--space-4)', borderWidth: 1, borderColor: 'var(--color-gray-6)' }}>
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-gray-11)' }}>Total Members</Text>
              <Text style={{ fontSize: 'var(--font-size-8)', fontWeight: 700, color: 'var(--color-gray-12)' }}>{summaryData.total}</Text>
            </Card>
            <Card style={{ flex: 1, minWidth: 150, padding: 'var(--space-4)', borderWidth: 1, borderColor: 'var(--color-purple-6)' }}>
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-purple-11)' }}>Admins</Text>
              <Text style={{ fontSize: 'var(--font-size-8)', fontWeight: 700, color: 'var(--color-purple-12)' }}>
                {summaryData.byRole.admin}
              </Text>
            </Card>
            <Card style={{ flex: 1, minWidth: 150, padding: 'var(--space-4)', borderWidth: 1, borderColor: 'var(--color-blue-6)' }}>
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-blue-11)' }}>Managers</Text>
              <Text style={{ fontSize: 'var(--font-size-8)', fontWeight: 700, color: 'var(--color-blue-12)' }}>
                {summaryData.byRole.manager}
              </Text>
            </Card>
            <Card style={{ flex: 1, minWidth: 150, padding: 'var(--space-4)', borderWidth: 1, borderColor: 'var(--color-green-6)' }}>
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-green-11)' }}>Brokers</Text>
              <Text style={{ fontSize: 'var(--font-size-8)', fontWeight: 700, color: 'var(--color-green-12)' }}>
                {summaryData.byRole.broker}
              </Text>
            </Card>
            <Card style={{ flex: 1, minWidth: 150, padding: 'var(--space-4)', borderWidth: 1, borderColor: 'var(--color-orange-6)' }}>
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-orange-11)' }}>Subcontractors</Text>
              <Text style={{ fontSize: 'var(--font-size-8)', fontWeight: 700, color: 'var(--color-orange-12)' }}>
                {summaryData.byRole.subcontractor}
              </Text>
            </Card>
          </Row>
        )}

        {/* Team Members List */}
        <TeamMembersList
          members={members}
          loading={membersLoading}
          onMemberClick={handleMemberClick}
          onMemberEdit={handleMemberEdit}
          onMemberRemove={handleMemberRemove}
          onSearch={handleSearch}
          onRoleFilter={handleRoleFilter}
        />
      </Stack>

      {/* Member Detail Modal */}
      <MemberDetailModal
        member={selectedMember}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onUpdateRole={handleUpdateRole}
        onRemove={handleRemoveMember}
        activities={mockActivities}
        activitiesLoading={false}
      />

      {/* Add Team Member Modal */}
      <AddTeamMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleInviteMember}
        loading={inviteMemberMutation.isPending}
        existingEmails={existingEmails}
      />
    </Stack>
  );
}
