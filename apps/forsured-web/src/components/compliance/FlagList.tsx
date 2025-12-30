/**
 * REQ-269: Policy & Endorsement Level Flags
 * FlagList component displays multiple compliance flags grouped by level
 */

import { CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { YStack, XStack, Text, H3, Card } from '@unicornlove/ui';
import { FlagBadge, getEntityTypeLabel } from './FlagBadge';
import { FlagComplianceIssue } from '../../lib/compliance/evaluator';
import { FlaggableEntityType, FlagSeverity } from '../../types';

export interface FlagListProps {
  flags: FlagComplianceIssue[];
  groupByLevel?: boolean;
  groupBySeverity?: boolean;
  showDescription?: boolean;
  emptyMessage?: string;
  compact?: boolean;
}

/**
 * Group flags by entity type
 */
function groupFlagsByLevel(
  flags: FlagComplianceIssue[]
): Record<FlaggableEntityType, FlagComplianceIssue[]> {
  return {
    policy: flags.filter((f) => f.entityType === 'policy'),
    provision: flags.filter((f) => f.entityType === 'provision'),
    endorsement: flags.filter((f) => f.entityType === 'endorsement'),
  };
}

/**
 * Group flags by severity
 */
function groupFlagsBySeverity(
  flags: FlagComplianceIssue[]
): Record<FlagSeverity, FlagComplianceIssue[]> {
  return {
    critical: flags.filter((f) => f.severity === 'critical'),
    warning: flags.filter((f) => f.severity === 'warning'),
    info: flags.filter((f) => f.severity === 'info'),
  };
}

/**
 * Get severity icon
 */
function getSeverityIcon(severity: FlagSeverity) {
  switch (severity) {
    case 'critical':
      return <AlertTriangle color="$red10" size={18} />;
    case 'warning':
      return <AlertCircle color="$yellow10" size={18} />;
    case 'info':
      return <Info color="$blue10" size={18} />;
  }
}

/**
 * Get severity header color
 */
function getSeverityHeaderColor(severity: FlagSeverity) {
  switch (severity) {
    case 'critical':
      return '$red11';
    case 'warning':
      return '$yellow11';
    case 'info':
      return '$blue11';
  }
}

/**
 * FlagList component
 * Displays a list of compliance flags, optionally grouped by level or severity
 */
export const FlagList = ({
  flags,
  groupByLevel = false,
  groupBySeverity = false,
  showDescription = true,
  emptyMessage = 'No compliance flags',
  compact = false,
}: FlagListProps) => {
  // Show empty state if no flags
  if (flags.length === 0) {
    return (
      <Card
        backgroundColor="$green2"
        borderColor="$green6"
        borderRadius="$4"
        padding="$6"
        alignItems="center"
      >
        <CheckCircle color="$green10" size={32} mb="$2" />
        <Text color="$green11" fontWeight="500" mb="$1">
          {emptyMessage}
        </Text>
        <Text color="$green10" fontSize="$2" mt="$1">
          All compliance requirements are met
        </Text>
      </Card>
    );
  }

  // Group by level (policy, provision, endorsement)
  if (groupByLevel) {
    const grouped = groupFlagsByLevel(flags);

    return (
      <YStack gap="$6">
        {/* Policy Flags */}
        {grouped.policy.length > 0 && (
          <FlagSection
            title="Policy-Level Flags"
            flags={grouped.policy}
            showDescription={showDescription}
            compact={compact}
          />
        )}

        {/* Provision Flags */}
        {grouped.provision.length > 0 && (
          <FlagSection
            title="Provision-Level Flags"
            flags={grouped.provision}
            showDescription={showDescription}
            compact={compact}
          />
        )}

        {/* Endorsement Flags */}
        {grouped.endorsement.length > 0 && (
          <FlagSection
            title="Endorsement-Level Flags"
            flags={grouped.endorsement}
            showDescription={showDescription}
            compact={compact}
          />
        )}
      </YStack>
    );
  }

  // Group by severity (critical, warning, info)
  if (groupBySeverity) {
    const grouped = groupFlagsBySeverity(flags);

    return (
      <YStack gap="$6">
        {/* Critical Flags */}
        {grouped.critical.length > 0 && (
          <YStack>
            <XStack alignItems="center" gap="$2" mb="$3">
              {getSeverityIcon('critical')}
              <H3 fontSize="$6" fontWeight="600" color={getSeverityHeaderColor('critical')}>
                Critical Issues ({grouped.critical.length})
              </H3>
            </XStack>
            <YStack gap="$3">
              {grouped.critical.map((flag) => (
                <FlagBadge
                  key={flag.flagId}
                  entityType={flag.entityType}
                  severity={flag.severity}
                  flagType={flag.flagType}
                  title={flag.title}
                  description={flag.description}
                  showDescription={showDescription}
                  compact={compact}
                />
              ))}
            </YStack>
          </YStack>
        )}

        {/* Warning Flags */}
        {grouped.warning.length > 0 && (
          <YStack>
            <XStack alignItems="center" gap="$2" mb="$3">
              {getSeverityIcon('warning')}
              <H3 fontSize="$6" fontWeight="600" color={getSeverityHeaderColor('warning')}>
                Warnings ({grouped.warning.length})
              </H3>
            </XStack>
            <YStack gap="$3">
              {grouped.warning.map((flag) => (
                <FlagBadge
                  key={flag.flagId}
                  entityType={flag.entityType}
                  severity={flag.severity}
                  flagType={flag.flagType}
                  title={flag.title}
                  description={flag.description}
                  showDescription={showDescription}
                  compact={compact}
                />
              ))}
            </YStack>
          </YStack>
        )}

        {/* Info Flags */}
        {grouped.info.length > 0 && (
          <YStack>
            <XStack alignItems="center" gap="$2" mb="$3">
              {getSeverityIcon('info')}
              <H3 fontSize="$6" fontWeight="600" color={getSeverityHeaderColor('info')}>
                Information ({grouped.info.length})
              </H3>
            </XStack>
            <YStack gap="$3">
              {grouped.info.map((flag) => (
                <FlagBadge
                  key={flag.flagId}
                  entityType={flag.entityType}
                  severity={flag.severity}
                  flagType={flag.flagType}
                  title={flag.title}
                  description={flag.description}
                  showDescription={showDescription}
                  compact={compact}
                />
              ))}
            </YStack>
          </YStack>
        )}
      </YStack>
    );
  }

  // Default: flat list
  return (
    <YStack gap="$3">
      {flags.map((flag) => (
        <FlagBadge
          key={flag.flagId}
          entityType={flag.entityType}
          severity={flag.severity}
          flagType={flag.flagType}
          title={flag.title}
          description={flag.description}
          showDescription={showDescription}
          compact={compact}
        />
      ))}
    </YStack>
  );
};

/**
 * Section component for grouped flags
 */
interface FlagSectionProps {
  title: string;
  flags: FlagComplianceIssue[];
  showDescription?: boolean;
  compact?: boolean;
}

const FlagSection = ({
  title,
  flags,
  showDescription = true,
  compact = false,
}: FlagSectionProps) => {
  return (
    <YStack>
      <H3 fontSize="$6" fontWeight="600" color="$color12" mb="$3">
        {title} ({flags.length})
      </H3>
      <YStack gap="$3">
        {flags.map((flag) => (
          <FlagBadge
            key={flag.flagId}
            entityType={flag.entityType}
            severity={flag.severity}
            flagType={flag.flagType}
            title={flag.title}
            description={flag.description}
            showDescription={showDescription}
            compact={compact}
          />
        ))}
      </YStack>
    </YStack>
  );
};

export default FlagList;
