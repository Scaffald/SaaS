/**
 * ProjectCard - Project card using Tamagui
 */
import React from 'react';
import { XStack, YStack, Text } from '@unicornlove/ui';
import { Card } from '@unicornlove/ui';
import { Chip as Badge } from '@unicornlove/ui';
import { Button as CoreButton } from '@unicornlove/ui';
import {
  Building,
  MapPin,
  Calendar,
  Shield,
  Users,
  UserPlus,
  ListTodo,
} from 'lucide-react';
import { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  showActions?: boolean;
  participantCount?: number;
  userRole?: 'manager' | 'subcontractor' | 'broker';
  onClick?: () => void;
  onInviteUser?: (projectId: string) => void;
  onCreateTask?: (projectId: string) => void;
}

export default function ProjectCard({
  project,
  showActions = false,
  participantCount,
  userRole,
  onClick,
  onInviteUser,
  onCreateTask,
}: ProjectCardProps) {
  const getComplianceVariant = (): 'success' | 'warning' | 'error' | 'default' => {
    switch (project.compliance_status) {
      case 'compliant':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRequiredCoverages = () => {
    const coverages = [];
    if (project.general_liability_required)
      coverages.push({
        name: 'GL',
        amount: project.general_liability_required,
      });
    if (project.workers_comp_required)
      coverages.push({ name: 'WC', amount: project.workers_comp_required });
    if (project.auto_liability_required)
      coverages.push({ name: 'Auto', amount: project.auto_liability_required });
    if (project.umbrella_required)
      coverages.push({ name: 'Umbrella', amount: project.umbrella_required });
    if (project.professional_liability_required)
      coverages.push({
        name: 'Prof',
        amount: project.professional_liability_required,
      });
    if (project.pollution_liability_required)
      coverages.push({
        name: 'Pollution',
        amount: project.pollution_liability_required,
      });
    return coverages;
  };

  const requiredCoverages = getRequiredCoverages();

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card
      onPress={onClick}
      cursor={onClick ? 'pointer' : 'default'}
      hoverStyle={onClick ? { shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, borderColor: '$blue9' } : undefined}
      padding="$6"
    >
      <XStack alignItems="flex-start" justifyContent="space-between" mb="$4">
        <XStack alignItems="flex-start" gap="$3" flex={1}>
          <YStack
            width={48}
            height={48}
            backgroundColor="$orange3"
            borderRadius="$3"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <Building size={24} color="currentColor" />
          </YStack>
          <YStack flex={1} minWidth={0} gap="$1">
            <Text fontSize="$5" fontWeight="600" color="$color11" numberOfLines={1}>
              {project.name}
            </Text>
            {project.description && (
              <Text fontSize="$2" color="$color10" numberOfLines={2} mt="$1">
                {project.description}
              </Text>
            )}
          </YStack>
        </XStack>
        <YStack alignItems="flex-end" ml="$4">
          <Badge variant={getComplianceVariant()} size="$2">
            {project.compliance_status}
          </Badge>
        </YStack>
      </XStack>

      <YStack gap="$3" mb="$4">
        <XStack flexWrap="wrap" gap="$4">
          {project.location && (
            <XStack alignItems="center" gap="$2" color="$color10">
              <MapPin size={14} />
              <Text fontSize="$2" numberOfLines={1}>
                {project.location}
              </Text>
            </XStack>
          )}

          {project.project_manager && (
            <XStack alignItems="center" gap="$2" color="$color10">
              <Users size={14} />
              <Text fontSize="$2" numberOfLines={1}>
                {project.project_manager}
              </Text>
            </XStack>
          )}

          <XStack alignItems="center" gap="$2" color="$color10" flexBasis="100%">
            <Calendar size={14} />
            <Text fontSize="$2">
              {formatDate(project.start_date)} - {formatDate(project.end_date)}
            </Text>
          </XStack>
        </XStack>

        {requiredCoverages.length > 0 && (
          <YStack paddingTop="$3" borderTopWidth={1} borderTopColor="$borderColor" gap="$2">
            <XStack alignItems="flex-start" gap="$2" mb="$2">
              <Shield size={14} color="currentColor" style={{ marginTop: 2 }} />
              <Text fontSize="$1" fontWeight="500" color="$color10">
                Required Insurance:
              </Text>
            </XStack>
            <XStack flexWrap="wrap" gap="$2">
              {requiredCoverages.map((coverage, index) => (
                <Badge key={index} variant="info" size="$2">
                  {coverage.name}: {formatCurrency(coverage.amount)}
                </Badge>
              ))}
            </XStack>
            {project.waiver_of_subrogation_required && (
              <YStack mt="$2">
                <Badge variant="warning" size="$2">
                  Waiver of Subrogation Required
                </Badge>
              </YStack>
            )}
          </YStack>
        )}
      </YStack>

      {participantCount !== undefined && (
        <YStack paddingTop="$4" borderTopWidth={1} borderTopColor="$borderColor">
          <XStack alignItems="center" justifyContent="space-between" fontSize="$2">
            <Text color="$color10">
              {userRole === 'manager' ? 'Subcontractors' : 'Participants'}
            </Text>
            <Text fontWeight="600" color="$color11">
              {participantCount}
            </Text>
          </XStack>
        </YStack>
      )}

      {showActions &&
        userRole === 'manager' &&
        (onInviteUser || onCreateTask) && (
          <YStack paddingTop="$4" borderTopWidth={1} borderTopColor="$borderColor" mt="$4">
            <XStack gap="$2">
              {onInviteUser && (
                <CoreButton
                  variant="outlined"
                  onPress={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onInviteUser(project.id);
                  }}
                  fontSize="$2"
                  flex={1}
                >
                  <XStack alignItems="center" gap="$1">
                    <UserPlus size={14} />
                    <Text>Invite User</Text>
                  </XStack>
                </CoreButton>
              )}
              {onCreateTask && (
                <CoreButton
                  variant="outlined"
                  onPress={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onCreateTask(project.id);
                  }}
                  fontSize="$2"
                  flex={1}
                >
                  <XStack alignItems="center" gap="$1">
                    <ListTodo size={14} />
                    <Text>Create Task</Text>
                  </XStack>
                </CoreButton>
              )}
            </XStack>
          </YStack>
        )}

      {userRole === 'subcontractor' && project.notes && (
        <YStack paddingTop="$4" borderTopWidth={1} borderTopColor="$borderColor" mt="$4">
          <Text fontSize="$1" color="$color10">
            {project.notes}
          </Text>
        </YStack>
      )}
    </Card>
  );
}
