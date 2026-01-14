/**
 * REQ-269: Policy & Endorsement Level Flags
 * FlagList component displays multiple compliance flags grouped by level
 */

import { CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Stack, Row, Text, Card } from '@unicornlove/beyond-ui';
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
      return <AlertTriangle style={{ color: 'var(--color-red-10)' }} size={18} />;
    case 'warning':
      return <AlertCircle style={{ color: 'var(--color-yellow-10)' }} size={18} />;
    case 'info':
      return <Info style={{ color: 'var(--color-blue-10)' }} size={18} />;
  }
}

/**
 * Get severity header color
 */
function getSeverityHeaderColor(severity: FlagSeverity): React.CSSProperties {
  switch (severity) {
    case 'critical':
      return { color: 'var(--color-red-11)' };
    case 'warning':
      return { color: 'var(--color-yellow-11)' };
    case 'info':
      return { color: 'var(--color-blue-11)' };
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
        style={{
          backgroundColor: 'var(--color-green-2)',
          borderColor: 'var(--color-green-6)',
          borderRadius: 'var(--radius-4)',
          padding: 'var(--space-6)',
          alignItems: 'center',
        }}
      >
        <CheckCircle style={{ color: 'var(--color-green-10)', marginBottom: 8 }} size={32} />
        <Text style={{ color: 'var(--color-green-11)', fontWeight: 500, marginBottom: 4 }}>
          {emptyMessage}
        </Text>
        <Text style={{ color: 'var(--color-green-10)', fontSize: 'var(--font-size-2)', marginTop: 4 }}>
          All compliance requirements are met
        </Text>
      </Card>
    );
  }

  // Group by level (policy, provision, endorsement)
  if (groupByLevel) {
    const grouped = groupFlagsByLevel(flags);

    return (
      <Stack style={{ gap: 'var(--space-6)' }}>
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
      </Stack>
    );
  }

  // Group by severity (critical, warning, info)
  if (groupBySeverity) {
    const grouped = groupFlagsBySeverity(flags);

    return (
      <Stack style={{ gap: 'var(--space-6)' }}>
        {/* Critical Flags */}
        {grouped.critical.length > 0 && (
          <Stack>
            <Row style={{ alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              {getSeverityIcon('critical')}
              <h3 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, margin: 0, ...getSeverityHeaderColor('critical') }}>
                Critical Issues ({grouped.critical.length})
              </h3>
            </Row>
            <Stack style={{ gap: 'var(--space-3)' }}>
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
            </Stack>
          </Stack>
        )}

        {/* Warning Flags */}
        {grouped.warning.length > 0 && (
          <Stack>
            <Row style={{ alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              {getSeverityIcon('warning')}
              <h3 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, margin: 0, ...getSeverityHeaderColor('warning') }}>
                Warnings ({grouped.warning.length})
              </h3>
            </Row>
            <Stack style={{ gap: 'var(--space-3)' }}>
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
            </Stack>
          </Stack>
        )}

        {/* Info Flags */}
        {grouped.info.length > 0 && (
          <Stack>
            <Row style={{ alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              {getSeverityIcon('info')}
              <h3 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, margin: 0, ...getSeverityHeaderColor('info') }}>
                Information ({grouped.info.length})
              </h3>
            </Row>
            <Stack style={{ gap: 'var(--space-3)' }}>
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
            </Stack>
          </Stack>
        )}
      </Stack>
    );
  }

  // Default: flat list
  return (
    <Stack style={{ gap: 'var(--space-3)' }}>
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
    </Stack>
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
    <Stack>
      <h3 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-12)', marginBottom: 'var(--space-3)', margin: 0 }}>
        {title} ({flags.length})
      </h3>
      <Stack style={{ gap: 'var(--space-3)' }}>
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
      </Stack>
    </Stack>
  );
};

export default FlagList;
