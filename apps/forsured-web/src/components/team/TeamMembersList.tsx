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

import { useState, useCallback, useMemo } from 'react';
import { Search, Users as UsersIcon } from 'lucide-react';
import { YStack, XStack, Text, Input, Button, Card, SizableText } from '@unicornlove/ui';
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
      <YStack gap="$4">
        {/* Search and Filter Bar */}
        <XStack
          flexDirection="column"
          $gtSm={{ flexDirection: 'row' }}
          gap="$4"
        >
          <YStack flex={1}>
            <YStack height={40} backgroundColor="$color3" borderRadius="$4" />
          </YStack>
          <YStack width={160} $gtSm={{ width: 160 }}>
            <YStack height={40} backgroundColor="$color3" borderRadius="$4" />
          </YStack>
        </XStack>

        {/* Skeleton Cards */}
        <XStack flexWrap="wrap" gap="$4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card
              key={i}
              backgroundColor="$background"
              borderRadius="$4"
              elevation={1}
              borderWidth={1}
              borderColor="$borderColor"
              padding="$4"
              width="100%"
              $gtMd={{ width: 'calc(50% - 8px)' }}
              $gtLg={{ width: 'calc(33.333% - 11px)' }}
            >
              <XStack alignItems="flex-start" gap="$3">
                <YStack width={48} height={48} borderRadius={9999} backgroundColor="$color3" />
                <YStack flex={1} gap="$2">
                  <YStack height={16} backgroundColor="$color3" borderRadius="$2" width="75%" />
                  <YStack height={12} backgroundColor="$color3" borderRadius="$2" width="50%" />
                </YStack>
              </XStack>
            </Card>
          ))}
        </XStack>
      </YStack>
    );
  }

  return (
    <YStack gap="$4">
      {/* Search and Filter Bar */}
      <XStack
        flexDirection="column"
        $gtSm={{ flexDirection: 'row' }}
        gap="$4"
      >
        {/* Search Input */}
        <XStack flex={1} position="relative" alignItems="center">
          <Search
            size={20}
            style={{ position: 'absolute', left: 12, zIndex: 1 }}
            color="var(--color10)"
          />
          <Input
            type="text"
            placeholder="Search by name, email, or company..."
            value={searchQuery}
            onChange={handleSearchChange}
            width="100%"
            paddingLeft="$10"
            paddingRight="$4"
            paddingVertical="$2"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            focusStyle={{
              borderColor: '$blue10',
              outlineWidth: 2,
              outlineColor: '$blue10',
            }}
          />
        </XStack>

        {/* Role Filter */}
        <XStack width="100%" $gtSm={{ width: 160 }}>
          <select
            value={activeRole}
            onChange={(e) => handleRoleChange(e.target.value as RoleFilter)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--borderColor)',
              borderRadius: '8px',
              backgroundColor: 'var(--background)',
            }}
            aria-label="Filter by role"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </XStack>
      </XStack>

      {/* Results Count */}
      <XStack alignItems="center" justifyContent="space-between">
        <SizableText fontSize="$3" color="$color10">
          {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} found
        </SizableText>
        {(searchQuery || activeRole !== 'all') && (
          <Button
            onPress={() => {
              setSearchQuery('');
              setActiveRole('all');
              onSearch?.('');
              onRoleFilter?.('all');
            }}
            variant="outlined"
            size="$2"
          >
            Clear filters
          </Button>
        )}
      </XStack>

      {/* Member Cards Grid */}
      {filteredMembers.length > 0 ? (
        <XStack flexWrap="wrap" gap="$4">
          {filteredMembers.map((member) => (
            <YStack
              key={member.id}
              width="100%"
              $gtMd={{ width: 'calc(50% - 8px)' }}
              $gtLg={{ width: 'calc(33.333% - 11px)' }}
            >
              <TeamMemberCard
                member={member}
                onClick={onMemberClick}
                onEdit={onMemberEdit}
                onRemove={onMemberRemove}
              />
            </YStack>
          ))}
        </XStack>
      ) : (
        <Card
          backgroundColor="$background"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderColor"
          padding="$12"
          alignItems="center"
        >
          <UsersIcon size={48} color="var(--color10)" />
          <Text fontSize="$6" fontWeight="500" color="$color12" marginTop="$4">
            No team members found
          </Text>
          <SizableText fontSize="$3" color="$color10" marginTop="$2" textAlign="center">
            {searchQuery || activeRole !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by inviting team members'}
          </SizableText>
        </Card>
      )}
    </YStack>
  );
}

export default TeamMembersList;
