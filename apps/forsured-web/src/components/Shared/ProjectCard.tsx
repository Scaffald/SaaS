/**
 * ProjectCard - Project card using Beyond UI
 */
import React from 'react';
import { Row, Stack, Text, Card } from '@unicornlove/beyond-ui';
import { Chip as Badge } from '@unicornlove/beyond-ui';
import { Button as CoreButton } from '@unicornlove/beyond-ui';
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
      style={{
        cursor: onClick ? 'pointer' : 'default',
        padding: 24,
      }}
    >
      <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <Row style={{ alignItems: 'flex-start', gap: 12, flex: 1 }}>
          <Stack
            style={{
              width: 48,
              height: 48,
              backgroundColor: 'var(--color-orange3)',
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Building size={24} color="currentColor" />
          </Stack>
          <Stack style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--color-color11)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {project.name}
            </Text>
            {project.description && (
              <Text
                style={{
                  fontSize: 14,
                  color: 'var(--color-color10)',
                  marginTop: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {project.description}
              </Text>
            )}
          </Stack>
        </Row>
        <Stack style={{ alignItems: 'flex-end', marginLeft: 16 }}>
          <Badge variant={getComplianceVariant()} size="sm">
            {project.compliance_status}
          </Badge>
        </Stack>
      </Row>

      <Stack style={{ gap: 12, marginBottom: 16 }}>
        <Row style={{ flexWrap: 'wrap', gap: 16 }}>
          {project.location && (
            <Row style={{ alignItems: 'center', gap: 8, color: 'var(--color-color10)' }}>
              <MapPin size={14} />
              <Text
                style={{
                  fontSize: 14,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {project.location}
              </Text>
            </Row>
          )}

          {project.project_manager && (
            <Row style={{ alignItems: 'center', gap: 8, color: 'var(--color-color10)' }}>
              <Users size={14} />
              <Text
                style={{
                  fontSize: 14,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {project.project_manager}
              </Text>
            </Row>
          )}

          <Row style={{ alignItems: 'center', gap: 8, color: 'var(--color-color10)', flexBasis: '100%' }}>
            <Calendar size={14} />
            <Text style={{ fontSize: 14 }}>
              {formatDate(project.start_date)} - {formatDate(project.end_date)}
            </Text>
          </Row>
        </Row>

        {requiredCoverages.length > 0 && (
          <Stack
            style={{
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopStyle: 'solid',
              borderTopColor: 'var(--color-border)',
              gap: 8,
            }}
          >
            <Row style={{ alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
              <Shield size={14} color="currentColor" style={{ marginTop: 2 }} />
              <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-color10)' }}>
                Required Insurance:
              </Text>
            </Row>
            <Row style={{ flexWrap: 'wrap', gap: 8 }}>
              {requiredCoverages.map((coverage, index) => (
                <Badge key={index} variant="info" size="sm">
                  {coverage.name}: {formatCurrency(coverage.amount)}
                </Badge>
              ))}
            </Row>
            {project.waiver_of_subrogation_required && (
              <Stack style={{ marginTop: 8 }}>
                <Badge variant="warning" size="sm">
                  Waiver of Subrogation Required
                </Badge>
              </Stack>
            )}
          </Stack>
        )}
      </Stack>

      {participantCount !== undefined && (
        <Stack
          style={{
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopStyle: 'solid',
            borderTopColor: 'var(--color-border)',
          }}
        >
          <Row style={{ alignItems: 'center', justifyContent: 'space-between', fontSize: 14 }}>
            <Text style={{ color: 'var(--color-color10)' }}>
              {userRole === 'manager' ? 'Subcontractors' : 'Participants'}
            </Text>
            <Text style={{ fontWeight: 600, color: 'var(--color-color11)' }}>
              {participantCount}
            </Text>
          </Row>
        </Stack>
      )}

      {showActions &&
        userRole === 'manager' &&
        (onInviteUser || onCreateTask) && (
          <Stack
            style={{
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopStyle: 'solid',
              borderTopColor: 'var(--color-border)',
              marginTop: 16,
            }}
          >
            <Row style={{ gap: 8 }}>
              {onInviteUser && (
                <CoreButton
                  variant="outlined"
                  onPress={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onInviteUser(project.id);
                  }}
                  style={{ fontSize: 14, flex: 1 }}
                >
                  <Row style={{ alignItems: 'center', gap: 4 }}>
                    <UserPlus size={14} />
                    <Text>Invite User</Text>
                  </Row>
                </CoreButton>
              )}
              {onCreateTask && (
                <CoreButton
                  variant="outlined"
                  onPress={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onCreateTask(project.id);
                  }}
                  style={{ fontSize: 14, flex: 1 }}
                >
                  <Row style={{ alignItems: 'center', gap: 4 }}>
                    <ListTodo size={14} />
                    <Text>Create Task</Text>
                  </Row>
                </CoreButton>
              )}
            </Row>
          </Stack>
        )}

      {userRole === 'subcontractor' && project.notes && (
        <Stack
          style={{
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopStyle: 'solid',
            borderTopColor: 'var(--color-border)',
            marginTop: 16,
          }}
        >
          <Text style={{ fontSize: 12, color: 'var(--color-color10)' }}>
            {project.notes}
          </Text>
        </Stack>
      )}
    </Card>
  );
}
