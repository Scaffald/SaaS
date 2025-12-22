/**
 * FlagFilter - Flag filter component using Tamagui
 * REQ-269: Policy & Endorsement Level Flags
 */
import React, { useState, useCallback, useMemo } from 'react';
import { YStack, XStack, Text, Button, styled } from '@unicornlove/ui';
import { Chip as Badge } from '@unicornlove/ui';
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

const ToggleButton = styled(Button, {
  name: 'FilterToggleButton',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$2',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  fontSize: '$2',
  fontWeight: '500',
  borderRadius: '$3',
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: 'transparent',
  
  variants: {
    active: {
      true: {
        backgroundColor: '$background',
        shadowColor: '$shadowColor',
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        color: '$blue11',
        borderColor: '$blue6',
      },
      false: {
        color: '$color10',
        hoverStyle: {
          color: '$color11',
          backgroundColor: '$backgroundPress',
        },
      },
    },
  } as const,
});

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
    <YStack mb="$4" gap="$2">
      <Text fontSize="$2" fontWeight="500" color="$color10">
        Filter by flag level
      </Text>

      <XStack
        display="inline-flex"
        borderRadius="$3"
        backgroundColor="$backgroundHover"
        borderWidth={1}
        borderColor="$borderColor"
        padding="$1"
        gap="$1"
        role="radiogroup"
        aria-label="Filter compliance flags by level"
      >
        {filterOptions.map((option) => {
          const isSelected = selectedFilter === option;
          const count = counts[option];

          return (
            <ToggleButton
              key={option}
              type="button"
              role="radio"
              aria-checked={isSelected}
              active={isSelected}
              onPress={() => handleFilterChange(option)}
            >
              {getFilterIcon(option)}
              <Text>{getFilterLabel(option)}</Text>
              <Badge
                variant={isSelected ? 'default' : 'default'}
                size="sm"
                opacity={count === 0 ? 0.5 : 1}
              >
                {count}
              </Badge>
            </ToggleButton>
          );
        })}
      </XStack>
    </YStack>
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
    <YStack>
      <FlagFilter
        report={report}
        onFilterChange={(flags) => {
          handleFilterChange(flags);
        }}
        initialFilter={initialFilter}
      />

      {filteredFlags.length === 0 ? (
        <YStack
          backgroundColor="$green2"
          borderWidth={1}
          borderColor="$green6"
          borderRadius="$3"
          padding="$6"
          alignItems="center"
          gap="$2"
        >
          <CheckCircle size={32} color="currentColor" mb="$2" />
          <Text color="$green11" fontWeight="500">
            {getEmptyMessage()}
          </Text>
          <Text fontSize="$2" color="$green10" mt="$1">
            All requirements are met for this filter
          </Text>
        </YStack>
      ) : (
        <YStack gap="$3">
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
        </YStack>
      )}
    </YStack>
  );
};

export default FlagFilter;
