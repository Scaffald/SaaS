/**
 * MyManagersPage - My managers page using Beyond UI
 * Migrated from Tamagui to Beyond UI
 */
import React, { useState } from 'react';
import { Stack, Row, Text, Card } from '@unicornlove/beyond-ui';
import { Button } from '@unicornlove/beyond-ui';
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
    <Stack gap={24}>
      {/* Header */}
      <Stack gap={8}>
        <Text size="2xl" weight="bold">
          My Managers
        </Text>
        <Text size="sm" muted>
          Manage your relationships with general contractors
        </Text>
      </Stack>

      {/* Stats Cards */}
      <Row style={{ flexWrap: 'wrap', gap: 16 }}>
        <Card style={{ padding: 16, flex: 1, minWidth: 200 }}>
          <Row alignItems="center" gap={8} style={{ marginBottom: 8 }}>
            <Building size={20} color="currentColor" />
            <Text size="xs" muted>Total Managers</Text>
          </Row>
          <Text size="2xl" weight="bold">
            {stats.total}
          </Text>
        </Card>

        <Card style={{ padding: 16, flex: 1, minWidth: 200 }}>
          <Row alignItems="center" gap={8} style={{ marginBottom: 8 }}>
            <CheckCircle size={20} color="currentColor" />
            <Text size="xs" muted>Active</Text>
          </Row>
          <Text size="2xl" weight="bold">
            {stats.active}
          </Text>
        </Card>

        <Card style={{ padding: 16, flex: 1, minWidth: 200 }}>
          <Row alignItems="center" gap={8} style={{ marginBottom: 8 }}>
            <Users size={20} color="currentColor" />
            <Text size="xs" muted>Total Projects</Text>
          </Row>
          <Text size="2xl" weight="bold">
            {stats.totalProjects}
          </Text>
        </Card>

        <Card style={{ padding: 16, flex: 1, minWidth: 200 }}>
          <Row alignItems="center" gap={8} style={{ marginBottom: 8 }}>
            <TrendingUp size={20} color="currentColor" />
            <Text size="xs" muted>Avg Compliance</Text>
          </Row>
          <Text size="2xl" weight="bold">
            {stats.avgCompliance}%
          </Text>
        </Card>
      </Row>

      {/* Filter Buttons */}
      <Row gap={8}>
        <Button
          color={filter === 'all' ? 'primary' : 'gray'}
          variant={filter === 'all' ? 'filled' : 'outline'}
          onPress={() => setFilter('all')}
        >
          All ({stats.total})
        </Button>
        <Button
          color={filter === 'active' ? 'primary' : 'gray'}
          variant={filter === 'active' ? 'filled' : 'outline'}
          onPress={() => setFilter('active')}
        >
          Active ({stats.active})
        </Button>
        <Button
          color={filter === 'pending' ? 'primary' : 'gray'}
          variant={filter === 'pending' ? 'filled' : 'outline'}
          onPress={() => setFilter('pending')}
        >
          Pending ({mockRelationships.filter((r) => r.status === 'pending').length})
        </Button>
      </Row>

      {/* Relationship Cards */}
      <Row style={{ flexWrap: 'wrap', gap: 16 }}>
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
      </Row>
    </Stack>
  );
}
