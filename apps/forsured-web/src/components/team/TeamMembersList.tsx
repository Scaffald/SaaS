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
      <div className="space-y-4">
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
          </div>
          <div className="w-40">
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Skeleton Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Role Filter */}
        <div className="w-full sm:w-40">
          <select
            value={activeRole}
            onChange={(e) => handleRoleChange(e.target.value as RoleFilter)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            aria-label="Filter by role"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} found
        </p>
        {(searchQuery || activeRole !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveRole('all');
              onSearch?.('');
              onRoleFilter?.('all');
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Member Cards Grid */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              onClick={onMemberClick}
              onEdit={onMemberEdit}
              onRemove={onMemberRemove}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No team members found
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchQuery || activeRole !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by inviting team members'}
          </p>
        </div>
      )}
    </div>
  );
}

export default TeamMembersList;
