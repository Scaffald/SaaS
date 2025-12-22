/**
 * GCDashboard - GC dashboard page using Tamagui
 */
import React from 'react';
import { YStack, XStack, Text } from '@unicornlove/ui';
import { Card } from '@unicornlove/ui';
import { Button as CoreButton } from '@unicornlove/ui';
import { Chip as Badge } from '@unicornlove/ui';
import { Archive, Building2, Users, CheckCircle } from 'lucide-react';
import { EmptyState } from '@unicornlove/ui';
import { useLexicon } from '../../contexts/LexiconContext';

// Mock projects for testing
const mockProjects = [
  {
    id: 'project-1',
    name: 'Downtown Tower',
    address: '123 Main St, Austin, TX',
    status: 'active',
    contractorCount: 5,
    complianceScore: 85,
  },
  {
    id: 'project-2',
    name: 'Harbor View Complex',
    address: '456 Harbor Dr, Austin, TX',
    status: 'active',
    contractorCount: 3,
    complianceScore: 92,
  },
];

function GCDashboard() {
  // REQ-4: Use lexicon for dynamic labels
  const { t, getContractorLabel } = useLexicon();

  const handleCreateProject = () => {
    console.log('Navigate to create project page');
  };

  const hasProjects = mockProjects.length > 0;

  return (
    <YStack gap="$6">
      <Text fontSize="$8" fontWeight="700" marginBottom="$6">
        {t('nav.dashboard')}
      </Text>
      {!hasProjects ? (
        <EmptyState
          icon={<Archive size={48} />}
          title="No Projects Yet"
          description={`Create your first project to start managing ${getContractorLabel().toLowerCase()} compliance.`}
          primaryAction={{ label: 'Create Project', onClick: handleCreateProject }}
          helpLinks={[
            { label: 'Watch Tutorial', href: '#' },
            { label: 'Read Guide', href: '#' },
          ]}
        />
      ) : (
        <YStack gap="$6">
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize="$5" fontWeight="600">
              Active Projects
            </Text>
            <CoreButton
              data-testid="new-project-button"
              onPress={handleCreateProject}
              variant="primary"
            >
              New Project
            </CoreButton>
          </XStack>
          <XStack flexWrap="wrap" gap="$4">
            {mockProjects.map((project) => (
              <Card
                key={project.id}
                data-testid="project-card"
                padding="$6"
                hoverStyle={{ shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
                cursor="pointer"
                flex={1}
                minWidth={300}
              >
                <XStack alignItems="flex-start" justifyContent="space-between" marginBottom="$4">
                  <XStack alignItems="center" gap="$3">
                    <YStack
                      padding="$2"
                      backgroundColor="$blue3"
                      borderRadius="$3"
                    >
                      <Building2 size={24} color="currentColor" />
                    </YStack>
                    <YStack>
                      <Text fontSize="$5" fontWeight="600">
                        {project.name}
                      </Text>
                      <Text fontSize="$2" color="$color10">
                        {project.address}
                      </Text>
                    </YStack>
                  </XStack>
                  <Badge variant="success" size="sm">
                    {project.status}
                  </Badge>
                </XStack>
                <XStack alignItems="center" justifyContent="space-between" fontSize="$2">
                  <XStack alignItems="center" gap="$1" color="$color10">
                    <Users size={16} />
                    <Text>{project.contractorCount} contractors</Text>
                  </XStack>
                  <XStack alignItems="center" gap="$1">
                    <CheckCircle size={16} color="currentColor" />
                    <Text fontWeight="500" data-testid="compliance-score">
                      {project.complianceScore}% compliant
                    </Text>
                  </XStack>
                </XStack>
              </Card>
            ))}
          </XStack>
        </YStack>
      )}
    </YStack>
  );
}

export default GCDashboard;
