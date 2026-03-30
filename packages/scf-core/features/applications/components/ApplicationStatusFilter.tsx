import { ScrollView } from 'react-native'
import { Button, Row } from '@scaffald/ui'

export type FilterGroup = 'all' | 'active' | 'interview' | 'offers' | 'closed'

const FILTER_OPTIONS: { key: FilterGroup; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'interview', label: 'Interview' },
  { key: 'offers', label: 'Offers' },
  { key: 'closed', label: 'Closed' },
]

const FILTER_STATUSES: Record<FilterGroup, string[] | null> = {
  all: null,
  active: ['pending', 'reviewing', 'inquired'],
  interview: ['interview'],
  offers: ['offer'],
  closed: ['hired', 'rejected', 'withdrawn'],
}

export function getStatusesForFilter(filter: FilterGroup): string[] | null {
  return FILTER_STATUSES[filter]
}

interface ApplicationStatusFilterProps {
  selected: FilterGroup
  onSelect: (filter: FilterGroup) => void
}

export function ApplicationStatusFilter({ selected, onSelect }: ApplicationStatusFilterProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Row gap={8}>
        {FILTER_OPTIONS.map((option) => (
          <Button
            key={option.key}
            size="sm"
            variant={selected === option.key ? undefined : 'outline'}
            color={selected === option.key ? 'primary' : undefined}
            onPress={() => onSelect(option.key)}
          >
            {option.label}
          </Button>
        ))}
      </Row>
    </ScrollView>
  )
}
