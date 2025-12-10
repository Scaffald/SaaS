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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your organization's team members and their roles
            </p>
          </div>
          <button
            onClick={handleAddMember}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Invite Member
          </button>
        </div>

        {/* Summary Cards */}
        {summaryData && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{summaryData.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-4">
              <p className="text-sm text-purple-600">Admins</p>
              <p className="text-2xl font-bold text-purple-700">
                {summaryData.byRole.admin}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
              <p className="text-sm text-blue-600">Managers</p>
              <p className="text-2xl font-bold text-blue-700">
                {summaryData.byRole.manager}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
              <p className="text-sm text-green-600">Brokers</p>
              <p className="text-2xl font-bold text-green-700">
                {summaryData.byRole.broker}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-orange-200 p-4">
              <p className="text-sm text-orange-600">Subcontractors</p>
              <p className="text-2xl font-bold text-orange-700">
                {summaryData.byRole.subcontractor}
              </p>
            </div>
          </div>
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
      </div>

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
    </div>
  );
}
