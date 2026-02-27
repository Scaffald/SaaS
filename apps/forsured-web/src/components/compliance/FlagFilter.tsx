/**
 * FlagFilter - Flag filter component using Beyond UI
 * Policy & Endorsement Level Flags
 */
import React, { useState, useCallback, useMemo } from 'react';
import { Stack, Row, Text, Button } from '@scaffald/ui';
import { Chip as Badge } from '@scaffald/ui';
import { FileText, Layers, ScrollText, Filter, CheckCircle } from 'lucide-react';
import { FlaggableEntityType } from '../../types';
import { FlagComplianceIssue, FlagComplianceReport } from '../../lib/compliance/evaluator';
import FlagBadge from './FlagBadge';

export type FilterOption = 'all' | FlaggableEntityType;

export interface FlagFilterProps {
  report: FlagComplianceReport;
  onFilterChange: (filteredFlags: FlagComplianceIssue[]) => void;
  initialFilter?: FilterOption;
}

function getFilterIcon(option: FilterOption) {
  const size = 16;
  switch (option) {
    case 'all':
      return <Filter size={size} />;
    case 'policy':
      return <FileText size={size} />;
    case 'provision':
      return <Layers size={size} />;
    case 'endorsement':
      return <ScrollText size={size} />;
  }
}

function getFilterLabel(option: FilterOption): string {
  switch (option) {
    case 'all':
      return 'All Flags';
    case 'policy':
      return 'Policy Flags';
    case 'provision':
      return 'Provision Flags';
    case 'endorsement':
      return 'Endorsement Flags';
  }
}

function getToggleButtonStyles(isActive: boolean): React.CSSProperties {
  const baseStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 'var(--space-2)',
    paddingLeft: 'var(--space-3)',
    paddingRight: 'var(--space-3)',
    paddingTop: 'var(--space-2)',
    paddingBottom: 'var(--space-2)',
    fontSize: 'var(--font-size-2)',
    fontWeight: 500,
    borderRadius: 'var(--radius-3)',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'transparent',
    cursor: 'pointer',
  };

  if (isActive) {
    return {
      ...baseStyles,
      backgroundColor: 'var(--color-background)',
      boxShadow: '0 2px 4px var(--color-shadow)',
      color: 'var(--color-blue-11)',
      borderColor: 'var(--color-blue-6)',
    };
  }

  return {
    ...baseStyles,
    color: 'var(--color-10)',
  };
}

export const FlagFilter: React.FC<FlagFilterProps> = ({
  report,
  onFilterChange,
  initialFilter = 'all',
}) => {
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>(initialFilter);

  const counts = useMemo(
    () => ({
      all: report.summary.totalFlags,
      policy: report.summary.byLevel.policy,
      provision: report.summary.byLevel.provision,
      endorsement: report.summary.byLevel.endorsement,
    }),
    [report]
  );

  const filterFlags = useCallback(
    (filter: FilterOption): FlagComplianceIssue[] => {
      switch (filter) {
        case 'all':
          return [
            ...report.policyFlags,
            ...report.provisionFlags,
            ...report.endorsementFlags,
          ];
        case 'policy':
          return report.policyFlags;
        case 'provision':
          return report.provisionFlags;
        case 'endorsement':
          return report.endorsementFlags;
      }
    },
    [report]
  );

  const handleFilterChange = useCallback(
    (filter: FilterOption) => {
      setSelectedFilter(filter);
      onFilterChange(filterFlags(filter));
    },
    [filterFlags, onFilterChange]
  );

  const filterOptions: FilterOption[] = ['all', 'policy', 'provision', 'endorsement'];

  return (
    <Stack style={{ marginBottom: 'var(--space-4)', gap: 'var(--space-2)' }}>
      <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-10)' }}>
        Filter by flag level
      </Text>

      <Row
        style={{
          display: 'inline-flex',
          borderRadius: 'var(--radius-3)',
          backgroundColor: 'var(--color-background-hover)',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: 'var(--color-border)',
          padding: 4,
          gap: 4,
        }}
        role="radiogroup"
        aria-label="Filter compliance flags by level"
      >
        {filterOptions.map((option) => {
          const isSelected = selectedFilter === option;
          const count = counts[option];

          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isSelected}
              style={getToggleButtonStyles(isSelected)}
              onClick={() => handleFilterChange(option)}
            >
              {getFilterIcon(option)}
              <Text>{getFilterLabel(option)}</Text>
              <Badge
                variant="default"
                size="$2"
                style={{ opacity: count === 0 ? 0.5 : 1 }}
              >
                {count}
              </Badge>
            </button>
          );
        })}
      </Row>
    </Stack>
  );
};

export interface FilterableFlagListProps {
  report: FlagComplianceReport;
  initialFilter?: FilterOption;
  showDescription?: boolean;
  emptyMessage?: string;
}

export const FilterableFlagList: React.FC<FilterableFlagListProps> = ({
  report,
  initialFilter = 'all',
  showDescription = true,
  emptyMessage,
}) => {
  const getAllFlags = useCallback(
    (filter: FilterOption = 'all'): FlagComplianceIssue[] => {
      switch (filter) {
        case 'all':
          return [
            ...report.policyFlags,
            ...report.provisionFlags,
            ...report.endorsementFlags,
          ];
        case 'policy':
          return report.policyFlags;
        case 'provision':
          return report.provisionFlags;
        case 'endorsement':
          return report.endorsementFlags;
      }
    },
    [report]
  );

  const [filteredFlags, setFilteredFlags] = useState<FlagComplianceIssue[]>(
    getAllFlags(initialFilter)
  );
  const [currentFilter, setCurrentFilter] = useState<FilterOption>(initialFilter);

  const handleFilterChange = useCallback(
    (flags: FlagComplianceIssue[]) => {
      setFilteredFlags(flags);
    },
    []
  );

  const getEmptyMessage = (): string => {
    if (emptyMessage) return emptyMessage;

    switch (currentFilter) {
      case 'all':
        return 'No compliance flags';
      case 'policy':
        return 'No policy-level flags';
      case 'provision':
        return 'No provision-level flags';
      case 'endorsement':
        return 'No endorsement-level flags';
    }
  };

  return (
    <Stack>
      <FlagFilter
        report={report}
        onFilterChange={(flags) => {
          handleFilterChange(flags);
        }}
        initialFilter={initialFilter}
      />

      {filteredFlags.length === 0 ? (
        <Stack
          style={{
            backgroundColor: 'var(--color-green-2)',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: 'var(--color-green-6)',
            borderRadius: 'var(--radius-3)',
            padding: 'var(--space-6)',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <CheckCircle size={32} style={{ color: 'currentColor', marginBottom: 8 }} />
          <Text style={{ color: 'var(--color-green-11)', fontWeight: 500 }}>
            {getEmptyMessage()}
          </Text>
          <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-green-10)', marginTop: 4 }}>
            All requirements are met for this filter
          </Text>
        </Stack>
      ) : (
        <Stack style={{ gap: 'var(--space-3)' }}>
          {filteredFlags.map((flag) => (
            <FlagBadge
              key={flag.flagId}
              entityType={flag.entityType}
              severity={flag.severity}
              flagType={flag.flagType}
              title={flag.title}
              description={flag.description}
              showDescription={showDescription}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
};

export default FlagFilter;
