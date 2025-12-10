/**
 * MyManagersPage - My managers page using Tamagui
 */
import React, { useState } from 'react';
import { YStack, XStack, Text } from '@unicornlove/ui';
import { Card } from '@unicornlove/ui';
import { Button as CoreButton } from '@unicornlove/ui';
import { Building, Users, TrendingUp, CheckCircle } from 'lucide-react';
import RelationshipCard from '../Shared/RelationshipCard';

export default function MyManagersPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'pending'>('all');

  const mockRelationships = [
    {
      id: '1',
      organizationName: 'Sunrise Contractors',
      organizationType: 'gc' as const,
      status: 'active' as const,
      complianceScore: 95,
      lastActivity: new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000
      ).toISOString(),
      relationshipHealth: 'excellent' as const,
      activeProjects: 3,
    },
    {
      id: '2',
      organizationName: 'Metro Construction Group',
      organizationType: 'gc' as const,
      status: 'active' as const,
      complianceScore: 88,
      lastActivity: new Date(
        Date.now() - 5 * 24 * 60 * 60 * 1000
      ).toISOString(),
      relationshipHealth: 'good' as const,
      activeProjects: 2,
    },
    {
      id: '3',
      organizationName: 'Bay Area Builders Inc',
      organizationType: 'gc' as const,
      status: 'pending' as const,
      complianceScore: 0,
      lastActivity: new Date(
        Date.now() - 1 * 24 * 60 * 60 * 1000
      ).toISOString(),
      relationshipHealth: undefined,
      activeProjects: 0,
    },
    {
      id: '4',
      organizationName: 'Pacific Development Corp',
      organizationType: 'gc' as const,
      status: 'inactive' as const,
      complianceScore: 82,
      lastActivity: new Date(
        Date.now() - 45 * 24 * 60 * 60 * 1000
      ).toISOString(),
      relationshipHealth: 'fair' as const,
      activeProjects: 0,
    },
  ];

  const filteredRelationships = mockRelationships.filter((rel) => {
    if (filter === 'all') return true;
    if (filter === 'active') return rel.status === 'active';
    if (filter === 'pending') return rel.status === 'pending';
    return true;
  });

  const stats = {
    total: mockRelationships.length,
    active: mockRelationships.filter((r) => r.status === 'active').length,
    totalProjects: mockRelationships.reduce(
      (acc, r) => acc + r.activeProjects,
      0
    ),
    avgCompliance: Math.round(
      mockRelationships
        .filter((r) => r.complianceScore > 0)
        .reduce((acc, r) => acc + r.complianceScore, 0) /
        mockRelationships.filter((r) => r.complianceScore > 0).length
    ),
  };

  return (
    <YStack gap="$6">
      {/* Header */}
      <YStack gap="$2">
        <Text fontSize="$8" fontWeight="700" color="$color12">
          My Managers
        </Text>
        <Text fontSize="$3" color="$color10">
          Manage your relationships with general contractors
        </Text>
      </YStack>

      {/* Stats Cards */}
      <XStack flexWrap="wrap" gap="$4">
        <Card padding="$4" flex={1} minWidth={200}>
          <XStack alignItems="center" gap="$2" marginBottom="$2">
            <Building size={20} color="currentColor" />
            <Text fontSize="$2" color="$color10">Total Managers</Text>
          </XStack>
          <Text fontSize="$8" fontWeight="700" color="$color12">
            {stats.total}
          </Text>
        </Card>

        <Card padding="$4" flex={1} minWidth={200}>
          <XStack alignItems="center" gap="$2" marginBottom="$2">
            <CheckCircle size={20} color="currentColor" />
            <Text fontSize="$2" color="$color10">Active</Text>
          </XStack>
          <Text fontSize="$8" fontWeight="700" color="$color12">
            {stats.active}
          </Text>
        </Card>

        <Card padding="$4" flex={1} minWidth={200}>
          <XStack alignItems="center" gap="$2" marginBottom="$2">
            <Users size={20} color="currentColor" />
            <Text fontSize="$2" color="$color10">Total Projects</Text>
          </XStack>
          <Text fontSize="$8" fontWeight="700" color="$color12">
            {stats.totalProjects}
          </Text>
        </Card>

        <Card padding="$4" flex={1} minWidth={200}>
          <XStack alignItems="center" gap="$2" marginBottom="$2">
            <TrendingUp size={20} color="currentColor" />
            <Text fontSize="$2" color="$color10">Avg Compliance</Text>
          </XStack>
          <Text fontSize="$8" fontWeight="700" color="$color12">
            {stats.avgCompliance}%
          </Text>
        </Card>
      </XStack>

      {/* Filter Buttons */}
      <XStack gap="$2">
        <CoreButton
          variant={filter === 'all' ? 'primary' : 'outlined'}
          onPress={() => setFilter('all')}
        >
          All ({stats.total})
        </CoreButton>
        <CoreButton
          variant={filter === 'active' ? 'primary' : 'outlined'}
          onPress={() => setFilter('active')}
        >
          Active ({stats.active})
        </CoreButton>
        <CoreButton
          variant={filter === 'pending' ? 'primary' : 'outlined'}
          onPress={() => setFilter('pending')}
        >
          Pending ({mockRelationships.filter((r) => r.status === 'pending').length})
        </CoreButton>
      </XStack>

      {/* Relationship Cards */}
      <XStack flexWrap="wrap" gap="$4">
        {filteredRelationships.map((relationship) => (
          <RelationshipCard
            key={relationship.id}
            organizationName={relationship.organizationName}
            organizationType={relationship.organizationType}
            status={relationship.status}
            complianceScore={relationship.complianceScore}
            lastActivity={relationship.lastActivity}
            relationshipHealth={relationship.relationshipHealth}
            activeProjects={relationship.activeProjects}
            onClick={() => {
              console.log('Navigate to manager:', relationship.id);
            }}
          />
        ))}
      </XStack>
    </YStack>
  );
}
