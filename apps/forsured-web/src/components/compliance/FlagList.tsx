/**
 * REQ-269: Policy & Endorsement Level Flags
 * FlagList component displays multiple compliance flags grouped by level
 */

import React from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
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
      return <AlertTriangle className="text-danger-600\" size={18} />;
    case 'warning':
      return <AlertCircle className="text-warning-600" size={18} />;
    case 'info':
      return <Info className="text-info-600" size={18} />;
  }
}

/**
 * Get severity header classes
 */
function getSeverityHeaderClasses(severity: FlagSeverity): string {
  switch (severity) {
    case 'critical':
      return 'text-danger-700';
    case 'warning':
      return 'text-warning-700';
    case 'info':
      return 'text-info-700';
  }
}

/**
 * FlagList component
 * Displays a list of compliance flags, optionally grouped by level or severity
 */
export const FlagList: React.FC<FlagListProps> = ({
  flags,
  groupByLevel = false,
  groupBySeverity = false,
  showDescription = true,
  emptyMessage = 'No compliance flags',
  compact = false,
}) => {
  // Show empty state if no flags
  if (flags.length === 0) {
    return (
      <div className="bg-success-50 border border-success-200 rounded-lg p-6 text-center">
        <CheckCircle className="mx-auto text-success-600 mb-2" size={32} />
        <p className="text-success-800 font-medium">{emptyMessage}</p>
        <p className="text-success-600 text-sm mt-1">
          All compliance requirements are met
        </p>
      </div>
    );
  }

  // Group by level (policy, provision, endorsement)
  if (groupByLevel) {
    const grouped = groupFlagsByLevel(flags);

    return (
      <div className="space-y-6">
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
      </div>
    );
  }

  // Group by severity (critical, warning, info)
  if (groupBySeverity) {
    const grouped = groupFlagsBySeverity(flags);

    return (
      <div className="space-y-6">
        {/* Critical Flags */}
        {grouped.critical.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              {getSeverityIcon('critical')}
              <h3 className={`text-lg font-semibold ${getSeverityHeaderClasses('critical')}`}>
                Critical Issues ({grouped.critical.length})
              </h3>
            </div>
            <div className="space-y-3">
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
            </div>
          </div>
        )}

        {/* Warning Flags */}
        {grouped.warning.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              {getSeverityIcon('warning')}
              <h3 className={`text-lg font-semibold ${getSeverityHeaderClasses('warning')}`}>
                Warnings ({grouped.warning.length})
              </h3>
            </div>
            <div className="space-y-3">
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
            </div>
          </div>
        )}

        {/* Info Flags */}
        {grouped.info.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              {getSeverityIcon('info')}
              <h3 className={`text-lg font-semibold ${getSeverityHeaderClasses('info')}`}>
                Information ({grouped.info.length})
              </h3>
            </div>
            <div className="space-y-3">
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
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default: flat list
  return (
    <div className="space-y-3">
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
    </div>
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

const FlagSection: React.FC<FlagSectionProps> = ({
  title,
  flags,
  showDescription = true,
  compact = false,
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-text-primary mb-3">
        {title} ({flags.length})
      </h3>
      <div className="space-y-3">
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
      </div>
    </div>
  );
};

export default FlagList;
