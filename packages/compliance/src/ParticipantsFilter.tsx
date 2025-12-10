/**
 * ParticipantsFilter - Filter buttons for compliance status
 * REQ-281: Participants Tab Compliance View - TASK-3
 */

import { styled, XStack, Text, type XStackProps } from 'tamagui';
import type { ComplianceStatus } from './ParticipantsTable';

export type FilterOption = 'all' | ComplianceStatus;

export interface ParticipantsFilterProps extends Omit<XStackProps, 'children'> {
  /** Currently active filter */
  activeFilter: FilterOption;
  /** Callback when filter changes */
  onFilterChange: (filter: FilterOption) => void;
  /** Counts for each status (optional) */
  counts?: {
    all?: number;
    compliant?: number;
    pending?: number;
    'at-risk'?: number;
    'non-compliant'?: number;
  };
}

const filterOptions: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'compliant', label: 'Compliant' },
  { value: 'pending', label: 'Pending' },
  { value: 'at-risk', label: 'At Risk' },
  { value: 'non-compliant', label: 'Non-Compliant' },
];

const FilterContainer = styled(XStack, {
  name: 'ParticipantsFilter',
  gap: '$2',
  flexWrap: 'wrap',
});

const FilterButton = styled(XStack, {
  name: 'ParticipantsFilterButton',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  borderRadius: '$full',
  alignItems: 'center',
  gap: '$1',
  cursor: 'pointer',
  backgroundColor: '$color3',
  borderWidth: 1,
  borderColor: '$color6',

  variants: {
    active: {
      true: {
        backgroundColor: '$blue3',
        borderColor: '$blue8',
      },
    },
    status: {
      compliant: {},
      pending: {},
      'at-risk': {},
      'non-compliant': {},
      all: {},
    },
  } as const,

  hoverStyle: {
    backgroundColor: '$color4',
  },

  pressStyle: {
    backgroundColor: '$color5',
  },
});

const FilterLabel = styled(Text, {
  name: 'ParticipantsFilterLabel',
  fontSize: '$2',
  fontWeight: '500',

  variants: {
    active: {
      true: {
        color: '$blue11',
      },
      false: {
        color: '$color11',
      },
    },
  } as const,
});

const CountBadge = styled(XStack, {
  name: 'ParticipantsFilterCount',
  paddingHorizontal: '$1',
  paddingVertical: 1,
  borderRadius: '$full',
  minWidth: 20,
  alignItems: 'center',
  justifyContent: 'center',

  variants: {
    active: {
      true: {
        backgroundColor: '$blue5',
      },
      false: {
        backgroundColor: '$color5',
      },
    },
  } as const,
});

const CountText = styled(Text, {
  name: 'ParticipantsFilterCountText',
  fontSize: '$1',
  fontWeight: '600',

  variants: {
    active: {
      true: {
        color: '$blue11',
      },
      false: {
        color: '$color9',
      },
    },
  } as const,
});

export function ParticipantsFilter({
  activeFilter,
  onFilterChange,
  counts,
  ...props
}: ParticipantsFilterProps) {
  return (
    <FilterContainer {...props}>
      {filterOptions.map((option) => {
        const isActive = activeFilter === option.value;
        const count = counts?.[option.value];

        return (
          <FilterButton
            key={option.value}
            active={isActive}
            status={option.value}
            onPress={() => onFilterChange(option.value)}
          >
            <FilterLabel active={isActive}>{option.label}</FilterLabel>
            {count !== undefined && (
              <CountBadge active={isActive}>
                <CountText active={isActive}>{count}</CountText>
              </CountBadge>
            )}
          </FilterButton>
        );
      })}
    </FilterContainer>
  );
}
