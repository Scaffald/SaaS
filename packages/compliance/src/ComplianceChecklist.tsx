/**
 * ComplianceChecklist - Checklist for tracking compliance requirements
 */

import { styled, YStack, XStack, Text, type YStackProps } from 'tamagui'
import {
  CheckCircle,
  Circle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileText,
} from '@tamagui/lucide-icons'
import { useState } from 'react'

export type ChecklistItemStatus = 'completed' | 'pending' | 'in-progress' | 'overdue' | 'not-applicable'

export interface ChecklistItem {
  id: string
  /** Title of the item */
  title: string
  /** Description */
  description?: string
  /** Status */
  status: ChecklistItemStatus
  /** Due date */
  dueDate?: string
  /** Completed date */
  completedDate?: string
  /** Assignee name */
  assignee?: string
  /** Category/section */
  category?: string
  /** Required for compliance */
  required?: boolean
  /** Related document or link */
  documentUrl?: string
}

export interface ComplianceChecklistProps extends Omit<YStackProps, 'children'> {
  /** Array of checklist items */
  items: ChecklistItem[]
  /** Title for the checklist */
  title?: string
  /** Whether to group by category */
  groupByCategory?: boolean
  /** Callback when item status changes */
  onStatusChange?: (itemId: string, newStatus: ChecklistItemStatus) => void
  /** Callback when item is clicked */
  onItemPress?: (item: ChecklistItem) => void
}

const statusConfig: Record<
  ChecklistItemStatus,
  { label: string; bgColor: string; textColor: string; icon: typeof CheckCircle }
> = {
  completed: {
    label: 'Completed',
    bgColor: '$green3',
    textColor: '$green11',
    icon: CheckCircle,
  },
  pending: {
    label: 'Pending',
    bgColor: '$gray3',
    textColor: '$gray11',
    icon: Circle,
  },
  'in-progress': {
    label: 'In Progress',
    bgColor: '$blue3',
    textColor: '$blue11',
    icon: Clock,
  },
  overdue: {
    label: 'Overdue',
    bgColor: '$red3',
    textColor: '$red11',
    icon: AlertTriangle,
  },
  'not-applicable': {
    label: 'N/A',
    bgColor: '$gray3',
    textColor: '$gray9',
    icon: Circle,
  },
}

const ChecklistContainer = styled(YStack, {
  name: 'ComplianceChecklist',
  backgroundColor: '$background',
  borderRadius: '$lg',
  borderWidth: 1,
  borderColor: '$borderColor',
  overflow: 'hidden',
})

const ChecklistHeader = styled(XStack, {
  name: 'ComplianceChecklistHeader',
  padding: '$3',
  backgroundColor: '$color2',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  alignItems: 'center',
  justifyContent: 'space-between',
})

const ChecklistTitle = styled(Text, {
  name: 'ComplianceChecklistTitle',
  fontSize: '$4',
  fontWeight: '600',
  color: '$color12',
})

const ProgressText = styled(Text, {
  name: 'ChecklistProgressText',
  fontSize: '$2',
  color: '$color9',
})

const CategoryHeader = styled(XStack, {
  name: 'ChecklistCategoryHeader',
  padding: '$3',
  backgroundColor: '$color3',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  alignItems: 'center',
  gap: '$2',
  cursor: 'pointer',

  hoverStyle: {
    backgroundColor: '$color4',
  },
})

const CategoryTitle = styled(Text, {
  name: 'ChecklistCategoryTitle',
  fontSize: '$3',
  fontWeight: '600',
  color: '$color11',
  flex: 1,
})

const CategoryCount = styled(Text, {
  name: 'ChecklistCategoryCount',
  fontSize: '$2',
  color: '$color9',
})

const ChecklistItem = styled(XStack, {
  name: 'ChecklistItem',
  padding: '$3',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  gap: '$3',
  alignItems: 'flex-start',

  variants: {
    isLast: {
      true: {
        borderBottomWidth: 0,
      },
    },
  } as const,

  hoverStyle: {
    backgroundColor: '$color2',
  },
})

const StatusIndicator = styled(XStack, {
  name: 'ChecklistStatusIndicator',
  width: 28,
  height: 28,
  borderRadius: '$full',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',

  pressStyle: {
    scale: 0.95,
  },
})

const ItemContent = styled(YStack, {
  name: 'ChecklistItemContent',
  flex: 1,
  gap: '$1',
})

const ItemHeader = styled(XStack, {
  name: 'ChecklistItemHeader',
  alignItems: 'center',
  gap: '$2',
})

const ItemTitle = styled(Text, {
  name: 'ChecklistItemTitle',
  fontSize: '$3',
  fontWeight: '500',
  color: '$color12',
  flex: 1,

  variants: {
    completed: {
      true: {
        textDecorationLine: 'line-through',
        color: '$color9',
      },
    },
  } as const,
})

const RequiredBadge = styled(Text, {
  name: 'ChecklistRequiredBadge',
  fontSize: '$1',
  color: '$red11',
  fontWeight: '600',
})

const ItemDescription = styled(Text, {
  name: 'ChecklistItemDescription',
  fontSize: '$2',
  color: '$color9',
})

const ItemMeta = styled(XStack, {
  name: 'ChecklistItemMeta',
  gap: '$3',
  marginTop: '$1',
  flexWrap: 'wrap',
})

const MetaItem = styled(XStack, {
  name: 'ChecklistMetaItem',
  alignItems: 'center',
  gap: '$1',
})

const MetaText = styled(Text, {
  name: 'ChecklistMetaText',
  fontSize: '$2',
  color: '$color9',
})

const DueText = styled(Text, {
  name: 'ChecklistDueText',
  fontSize: '$2',

  variants: {
    overdue: {
      true: {
        color: '$red11',
        fontWeight: '500',
      },
      false: {
        color: '$color9',
      },
    },
  } as const,
})

const DocumentLink = styled(XStack, {
  name: 'ChecklistDocumentLink',
  alignItems: 'center',
  gap: '$1',
  cursor: 'pointer',

  hoverStyle: {
    opacity: 0.7,
  },
})

const DocumentText = styled(Text, {
  name: 'ChecklistDocumentText',
  fontSize: '$2',
  color: '$blue10',
})

const EmptyState = styled(YStack, {
  name: 'ChecklistEmptyState',
  padding: '$6',
  alignItems: 'center',
  gap: '$2',
})

const EmptyText = styled(Text, {
  name: 'ChecklistEmptyText',
  fontSize: '$3',
  color: '$color9',
})

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date()
}

function groupItemsByCategory(items: ChecklistItem[]): Map<string, ChecklistItem[]> {
  const grouped = new Map<string, ChecklistItem[]>()
  items.forEach((item) => {
    const category = item.category || 'General'
    if (!grouped.has(category)) {
      grouped.set(category, [])
    }
    grouped.get(category)!.push(item)
  })
  return grouped
}

function CategorySection({
  category,
  items,
  onStatusChange,
  onItemPress,
}: {
  category: string
  items: ChecklistItem[]
  onStatusChange?: (itemId: string, newStatus: ChecklistItemStatus) => void
  onItemPress?: (item: ChecklistItem) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const completedCount = items.filter((i) => i.status === 'completed').length

  return (
    <YStack>
      <CategoryHeader onPress={() => setExpanded(!expanded)}>
        {expanded ? <ChevronDown size={16} color="$color9" /> : <ChevronRight size={16} color="$color9" />}
        <CategoryTitle>{category}</CategoryTitle>
        <CategoryCount>
          {completedCount}/{items.length}
        </CategoryCount>
      </CategoryHeader>
      {expanded &&
        items.map((item, index) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            isLast={index === items.length - 1}
            onStatusChange={onStatusChange}
            onItemPress={onItemPress}
          />
        ))}
    </YStack>
  )
}

function ChecklistItemRow({
  item,
  isLast,
  onStatusChange,
  onItemPress,
}: {
  item: ChecklistItem
  isLast: boolean
  onStatusChange?: (itemId: string, newStatus: ChecklistItemStatus) => void
  onItemPress?: (item: ChecklistItem) => void
}) {
  const config = statusConfig[item.status]
  const StatusIcon = config.icon
  const overdue = Boolean(item.dueDate && item.status !== 'completed' && isOverdue(item.dueDate))

  const handleStatusToggle = () => {
    if (onStatusChange) {
      const newStatus = item.status === 'completed' ? 'pending' : 'completed'
      onStatusChange(item.id, newStatus)
    }
  }

  return (
    <ChecklistItem isLast={isLast}>
      <StatusIndicator backgroundColor={config.bgColor} onPress={handleStatusToggle}>
        <StatusIcon size={16} color={config.textColor} />
      </StatusIndicator>

      <ItemContent onPress={() => onItemPress?.(item)}>
        <ItemHeader>
          <ItemTitle completed={item.status === 'completed'}>{item.title}</ItemTitle>
          {item.required && <RequiredBadge>Required</RequiredBadge>}
        </ItemHeader>

        {item.description && <ItemDescription>{item.description}</ItemDescription>}

        <ItemMeta>
          {item.dueDate && item.status !== 'completed' && (
            <MetaItem>
              <Clock size={12} color={overdue ? '$red11' : '$color9'} />
              <DueText overdue={overdue}>Due: {formatDate(item.dueDate)}</DueText>
            </MetaItem>
          )}
          {item.completedDate && item.status === 'completed' && (
            <MetaItem>
              <CheckCircle size={12} color="$green11" />
              <MetaText>Completed: {formatDate(item.completedDate)}</MetaText>
            </MetaItem>
          )}
          {item.assignee && (
            <MetaItem>
              <MetaText>Assignee: {item.assignee}</MetaText>
            </MetaItem>
          )}
          {item.documentUrl && (
            <DocumentLink>
              <FileText size={12} color="$blue10" />
              <DocumentText>View Document</DocumentText>
            </DocumentLink>
          )}
        </ItemMeta>
      </ItemContent>
    </ChecklistItem>
  )
}

export function ComplianceChecklist({
  items,
  title = 'Compliance Checklist',
  groupByCategory = false,
  onStatusChange,
  onItemPress,
  ...props
}: ComplianceChecklistProps) {
  const completedCount = items.filter((i) => i.status === 'completed').length
  const totalRequired = items.filter((i) => i.required !== false).length

  return (
    <ChecklistContainer {...props}>
      <ChecklistHeader>
        <ChecklistTitle>{title}</ChecklistTitle>
        <ProgressText>
          {completedCount}/{totalRequired} completed
        </ProgressText>
      </ChecklistHeader>

      {items.length === 0 ? (
        <EmptyState>
          <CheckCircle size={32} color="$color7" />
          <EmptyText>No checklist items</EmptyText>
        </EmptyState>
      ) : groupByCategory ? (
        Array.from(groupItemsByCategory(items).entries()).map(([category, categoryItems]) => (
          <CategorySection
            key={category}
            category={category}
            items={categoryItems}
            onStatusChange={onStatusChange}
            onItemPress={onItemPress}
          />
        ))
      ) : (
        items.map((item, index) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            isLast={index === items.length - 1}
            onStatusChange={onStatusChange}
            onItemPress={onItemPress}
          />
        ))
      )}
    </ChecklistContainer>
  )
}
