/**
 * TeamMembersList - Container for team member cards
 * REQ-283: Team Member Management UI
 * TASK-1: Create Team Members List Page
 *
 * Displays a grid/list of team members with:
 * - Role filtering
 * - Search functionality
 * - Loading states
 * - Empty states
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Search, Users as UsersIcon } from 'lucide-react';
import { Stack, Row, Text, Card, Button, Input } from '@unicornlove/beyond-ui';
import { TeamMemberCard, type TeamMember } from './TeamMemberCard';

type RoleFilter = 'all' | TeamMember['role'];

interface TeamMembersListProps {
  members: TeamMember[];
  loading?: boolean;
  onMemberClick?: (member: TeamMember) => void;
  onMemberEdit?: (member: TeamMember) => void;
  onMemberRemove?: (member: TeamMember) => void;
  onSearch?: (query: string) => void;
  onRoleFilter?: (role: RoleFilter) => void;
}

const ROLE_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'All Roles' },
  { value: 'admin', label: 'Admins' },
  { value: 'manager', label: 'Managers' },
  { value: 'broker', label: 'Brokers' },
  { value: 'subcontractor', label: 'Subcontractors' },
  { value: 'user', label: 'Users' },
];

export function TeamMembersList({
  members,
  loading = false,
  onMemberClick,
  onMemberEdit,
  onMemberRemove,
  onSearch,
  onRoleFilter,
}: TeamMembersListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRole, setActiveRole] = useState<RoleFilter>('all');

  // Handle search input
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      onSearch?.(value);
    },
    [onSearch]
  );

  // Handle role filter change
  const handleRoleChange = useCallback(
    (role: RoleFilter) => {
      setActiveRole(role);
      onRoleFilter?.(role);
    },
    [onRoleFilter]
  );

  // Client-side filtering (if no onSearch/onRoleFilter provided)
  const filteredMembers = useMemo(() => {
    if (onSearch && onRoleFilter) {
      // Server-side filtering, return as-is
      return members;
    }

    return members.filter((member) => {
      // Search filter
      if (searchQuery && !onSearch) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          member.name.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query) ||
          member.company?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Role filter
      if (activeRole !== 'all' && !onRoleFilter) {
        if (member.role !== activeRole) return false;
      }

      return true;
    });
  }, [members, searchQuery, activeRole, onSearch, onRoleFilter]);

  // Loading skeleton
  if (loading) {
    return (
      <Stack gap="md">
        {/* Search and Filter Bar */}
        <Row style={{ flexDirection: 'column', flexWrap: 'wrap', gap: 16 }}>
          <Stack style={{ flex: 1 }}>
            <div style={{ height: 40, backgroundColor: 'var(--color-gray-3)', borderRadius: 8 }} />
          </Stack>
          <Stack style={{ width: 160 }}>
            <div style={{ height: 40, backgroundColor: 'var(--color-gray-3)', borderRadius: 8 }} />
          </Stack>
        </Row>

        {/* Skeleton Cards */}
        <Row style={{ flexWrap: 'wrap', gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card
              key={i}
              style={{
                backgroundColor: 'var(--color-background)',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                padding: 16,
                width: '100%',
                flexWrap: 'wrap',
              }}
            >
              <Row style={{ alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--color-gray-3)' }} />
                <Stack style={{ flex: 1, gap: 8 }}>
                  <div style={{ height: 16, backgroundColor: 'var(--color-gray-3)', borderRadius: 4, width: '75%' }} />
                  <div style={{ height: 12, backgroundColor: 'var(--color-gray-3)', borderRadius: 4, width: '50%' }} />
                </Stack>
              </Row>
            </Card>
          ))}
        </Row>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      {/* Search and Filter Bar */}
      <Row style={{ flexDirection: 'column', flexWrap: 'wrap', gap: 16 }}>
        {/* Search Input */}
        <Row style={{ flex: 1, position: 'relative', alignItems: 'center' }}>
          <Search
            size={20}
            style={{ position: 'absolute', left: 12, zIndex: 1 }}
            color="var(--color-gray-10)"
          />
          <Input
            type="text"
            placeholder="Search by name, email, or company..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              paddingLeft: 40,
              paddingRight: 16,
            }}
          />
        </Row>

        {/* Role Filter */}
        <Row style={{ width: '100%', flexWrap: 'wrap' }}>
          <select
            value={activeRole}
            onChange={(e) => handleRoleChange(e.target.value as RoleFilter)}
            style={{
              width: 160,
              padding: '8px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              backgroundColor: 'var(--color-background)',
            }}
            aria-label="Filter by role"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Row>
      </Row>

      {/* Results Count */}
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 14, color: 'var(--color-gray-10)' }}>
          {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} found
        </Text>
        {(searchQuery || activeRole !== 'all') && (
          <Button
            onClick={() => {
              setSearchQuery('');
              setActiveRole('all');
              onSearch?.('');
              onRoleFilter?.('all');
            }}
            variant="outline"
            size="sm"
          >
            Clear filters
          </Button>
        )}
      </Row>

      {/* Member Cards Grid */}
      {filteredMembers.length > 0 ? (
        <Row style={{ flexWrap: 'wrap', gap: 16 }}>
          {filteredMembers.map((member) => (
            <Stack
              key={member.id}
              style={{
                width: '100%',
                flexWrap: 'wrap',
              }}
            >
              <TeamMemberCard
                member={member}
                onClick={onMemberClick}
                onEdit={onMemberEdit}
                onRemove={onMemberRemove}
              />
            </Stack>
          ))}
        </Row>
      ) : (
        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            padding: 48,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <UsersIcon size={48} color="var(--color-gray-10)" />
          <Text style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-gray-12)', marginTop: 16 }}>
            No team members found
          </Text>
          <Text style={{ fontSize: 14, color: 'var(--color-gray-10)', marginTop: 8, textAlign: 'center' }}>
            {searchQuery || activeRole !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by inviting team members'}
          </Text>
        </Card>
      )}
    </Stack>
  );
}

export default TeamMembersList;
