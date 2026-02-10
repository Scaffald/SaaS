/**
 * ComplianceChecklist - Checklist for tracking compliance requirements
 * Beyond UI Component Library
 */

import { Stack, Row, Text } from '@unicornlove/beyond-ui'
import { colors, spacing, borderRadius } from '@unicornlove/beyond-ui/tokens'
import type { StackProps } from '@unicornlove/beyond-ui'
import {
  CheckCircle,
  Circle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileText,
} from 'lucide-react-native'
import { useState } from 'react'
import { Pressable } from 'react-native'
import type { ComponentType } from 'react'

export type ChecklistItemStatus = 'completed' | 'pending' | 'in-progress' | 'overdue' | 'not-applicable'

export interface ChecklistItem {
  id: string
  title: string
  description?: string
  status: ChecklistItemStatus
  dueDate?: string
  completedDate?: string
  assignee?: string
  category?: string
  required?: boolean
  documentUrl?: string
}

export interface ComplianceChecklistProps extends Omit<StackProps, 'children'> {
  items: ChecklistItem[]
  title?: string
  groupByCategory?: boolean
  onStatusChange?: (itemId: string, newStatus: ChecklistItemStatus) => void
  onItemPress?: (item: ChecklistItem) => void
}

const statusConfig: Record<
  ChecklistItemStatus,
  { label: string; bgColor: string; textColor: string; icon: ComponentType<{ size: number; color: string }> }
> = {
  completed: {
    label: 'Completed',
    bgColor: colors.green[100],
    textColor: colors.green[700],
    icon: CheckCircle,
  },
  pending: {
    label: 'Pending',
    bgColor: colors.gray[100],
    textColor: colors.gray[700],
    icon: Circle,
  },
  'in-progress': {
    label: 'In Progress',
    bgColor: colors.blue[100],
    textColor: colors.blue[700],
    icon: Clock,
  },
  overdue: {
    label: 'Overdue',
    bgColor: colors.error[100],
    textColor: colors.error[700],
    icon: AlertTriangle,
  },
  'not-applicable': {
    label: 'N/A',
    bgColor: colors.gray[100],
    textColor: colors.gray[500],
    icon: Circle,
  },
}

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
    <Stack>
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={{
          flexDirection: 'row',
          padding: spacing[4],
          backgroundColor: colors.gray[100],
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light.default,
          alignItems: 'center',
          gap: spacing[2],
        }}
      >
        {expanded ? (
          <ChevronDown size={16} color={colors.gray[500]} />
        ) : (
          <ChevronRight size={16} color={colors.gray[500]} />
        )}
        <Text size="sm" weight="semibold" style={{ flex: 1, color: colors.gray[700] }}>
          {category}
        </Text>
        <Text size="xs" style={{ color: colors.gray[500] }}>
          {completedCount}/{items.length}
        </Text>
      </Pressable>
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
    </Stack>
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
    <Row
      padding={spacing[4]}
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border.light.default,
      }}
      gap={spacing[4]}
      align="flex-start"
    >
      <Pressable
        onPress={handleStatusToggle}
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: config.bgColor,
        }}
      >
        <StatusIcon size={16} color={config.textColor} />
      </Pressable>

      <Pressable onPress={() => onItemPress?.(item)} style={{ flex: 1 }}>
        <Stack gap={spacing[2]}>
          <Row align="center" gap={spacing[2]}>
            <Text
              size="sm"
              weight="medium"
              style={{
                flex: 1,
                color: colors.gray[900],
                textDecorationLine: item.status === 'completed' ? 'line-through' : undefined,
              }}
            >
              {item.title}
            </Text>
            {item.required && (
              <Text size="xs" weight="semibold" style={{ color: colors.error[700] }}>
                Required
              </Text>
            )}
          </Row>

          {item.description && (
            <Text size="xs" style={{ color: colors.gray[500] }}>
              {item.description}
            </Text>
          )}

          <Row gap={spacing[4]} wrap style={{ marginTop: spacing[2] }}>
            {item.dueDate && item.status !== 'completed' && (
              <Row align="center" gap={spacing[2]}>
                <Clock size={12} color={overdue ? colors.error[700] : colors.gray[500]} />
                <Text
                  size="xs"
                  style={{
                    color: overdue ? colors.error[700] : colors.gray[500],
                    fontWeight: overdue ? '500' : '400',
                  }}
                >
                  Due: {formatDate(item.dueDate)}
                </Text>
              </Row>
            )}
            {item.completedDate && item.status === 'completed' && (
              <Row align="center" gap={spacing[2]}>
                <CheckCircle size={12} color={colors.green[700]} />
                <Text size="xs" style={{ color: colors.gray[500] }}>
                  Completed: {formatDate(item.completedDate)}
                </Text>
              </Row>
            )}
            {item.assignee && (
              <Text size="xs" style={{ color: colors.gray[500] }}>
                Assignee: {item.assignee}
              </Text>
            )}
            {item.documentUrl && (
              <Row align="center" gap={spacing[2]}>
                <FileText size={12} color={colors.blue[600]} />
                <Text size="xs" style={{ color: colors.blue[600] }}>
                  View Document
                </Text>
              </Row>
            )}
          </Row>
        </Stack>
      </Pressable>
    </Row>
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
    <Stack
      style={{
        backgroundColor: colors.bg.light.default,
        borderRadius: borderRadius.l,
        borderWidth: 1,
        borderColor: colors.border.light.default,
        overflow: 'hidden',
      }}
      {...props}
    >
      <Row
        padding={spacing[4]}
        style={{
          backgroundColor: colors.gray[50],
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light.default,
        }}
        align="center"
        justify="space-between"
      >
        <Text size="sm" weight="semibold" style={{ color: colors.gray[900] }}>
          {title}
        </Text>
        <Text size="xs" style={{ color: colors.gray[500] }}>
          {completedCount}/{totalRequired} completed
        </Text>
      </Row>

      {items.length === 0 ? (
        <Stack padding={spacing[6]} align="center" gap={spacing[2]}>
          <CheckCircle size={32} color={colors.gray[400]} />
          <Text size="sm" style={{ color: colors.gray[500] }}>
            No checklist items
          </Text>
        </Stack>
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
    </Stack>
  )
}
