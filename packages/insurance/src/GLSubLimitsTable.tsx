/**
 * GLSubLimitsTable - Display GL sub-limits with validation status
 * REQ-280: Insurance Coverage Detail Requirements
 * TASK-3: Create GL Sub-Limits Display Component with Validation Indicators
 *
 * Displays all General Liability sub-limits in a table format with visual
 * indicators for provisions that don't meet requirements.
 */

import { styled, YStack, XStack, Text, View, type YStackProps, Spinner } from 'tamagui'
import { Check, X, AlertCircle, AlertTriangle } from '@tamagui/lucide-icons'

/**
 * GL Sub-limit display item
 * Matches the structure from the getGLSubLimitsDisplay API endpoint
 */
export interface GLSubLimitItem {
  id: string
  name: string
  provision_type: string
  requirement: string
  current_value: number | string | boolean | null
  formatted_value: string
  is_valid: boolean
  severity: 'success' | 'warning' | 'error'
  message?: string
}

export interface GLSubLimitsTableProps extends Omit<YStackProps, 'children'> {
  /** Array of GL sub-limit items to display */
  items: GLSubLimitItem[]
  /** Title for the table */
  title?: string
  /** Whether the table is in loading state */
  isLoading?: boolean
  /** Error message to display */
  error?: string | null
  /** Callback when a row is pressed */
  onItemPress?: (item: GLSubLimitItem) => void
}

// =============================================================================
// Styled Components
// =============================================================================

const TableContainer = styled(YStack, {
  name: 'GLSubLimitsTable',
  backgroundColor: '$background',
  borderRadius: '$lg',
  borderWidth: 1,
  borderColor: '$borderColor',
  overflow: 'hidden',
})

const TableHeader = styled(XStack, {
  name: 'GLSubLimitsTableHeader',
  padding: '$3',
  backgroundColor: '$color2',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  alignItems: 'center',
  justifyContent: 'space-between',
})

const TableTitle = styled(Text, {
  name: 'GLSubLimitsTableTitle',
  fontSize: '$4',
  fontWeight: '600',
  color: '$color12',
})

const HeaderRow = styled(XStack, {
  name: 'GLSubLimitsHeaderRow',
  padding: '$3',
  backgroundColor: '$color3',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  gap: '$2',
})

const HeaderCell = styled(Text, {
  name: 'GLSubLimitsHeaderCell',
  fontSize: '$2',
  fontWeight: '600',
  color: '$color11',
  textTransform: 'uppercase',
})

const TableRow = styled(XStack, {
  name: 'GLSubLimitsTableRow',
  padding: '$3',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  gap: '$2',
  alignItems: 'center',

  variants: {
    isLast: {
      true: {
        borderBottomWidth: 0,
      },
    },
    hasError: {
      true: {
        backgroundColor: '$red2',
      },
    },
    hasWarning: {
      true: {
        backgroundColor: '$yellow2',
      },
    },
  } as const,

  hoverStyle: {
    backgroundColor: '$color2',
  },

  pressStyle: {
    backgroundColor: '$color3',
    scale: 0.995,
  },
})

const Cell = styled(View, {
  name: 'GLSubLimitsCell',
})

const ProvisionName = styled(Text, {
  name: 'GLSubLimitsProvisionName',
  fontSize: '$3',
  fontWeight: '500',
  color: '$color12',
})

const RequirementText = styled(Text, {
  name: 'GLSubLimitsRequirement',
  fontSize: '$2',
  color: '$color9',
})

const ValueText = styled(Text, {
  name: 'GLSubLimitsValue',
  fontSize: '$3',
  fontWeight: '500',
  variants: {
    status: {
      success: {
        color: '$green11',
      },
      warning: {
        color: '$yellow11',
      },
      error: {
        color: '$red11',
      },
    },
  } as const,
})

const StatusBadge = styled(XStack, {
  name: 'GLSubLimitsStatusBadge',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$full',
  alignItems: 'center',
  gap: '$1',

  variants: {
    status: {
      success: {
        backgroundColor: '$green3',
      },
      warning: {
        backgroundColor: '$yellow3',
      },
      error: {
        backgroundColor: '$red3',
      },
    },
  } as const,
})

const StatusText = styled(Text, {
  name: 'GLSubLimitsStatusText',
  fontSize: '$2',
  fontWeight: '500',
  variants: {
    status: {
      success: {
        color: '$green11',
      },
      warning: {
        color: '$yellow11',
      },
      error: {
        color: '$red11',
      },
    },
  } as const,
})

const MessageText = styled(Text, {
  name: 'GLSubLimitsMessage',
  fontSize: '$1',
  color: '$color9',
  marginTop: '$1',
})

const LoadingContainer = styled(YStack, {
  name: 'GLSubLimitsLoading',
  padding: '$6',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$2',
})

const ErrorContainer = styled(YStack, {
  name: 'GLSubLimitsError',
  padding: '$4',
  backgroundColor: '$red2',
  borderRadius: '$md',
  margin: '$3',
  gap: '$2',
})

const ErrorText = styled(Text, {
  name: 'GLSubLimitsErrorText',
  fontSize: '$3',
  color: '$red11',
})

const RedFlagBanner = styled(XStack, {
  name: 'GLSubLimitsRedFlagBanner',
  padding: '$2',
  backgroundColor: '$red3',
  alignItems: 'center',
  gap: '$2',
})

const RedFlagText = styled(Text, {
  name: 'GLSubLimitsRedFlagText',
  fontSize: '$2',
  fontWeight: '500',
  color: '$red11',
})

// =============================================================================
// Helper Functions
// =============================================================================

function getStatusIcon(severity: 'success' | 'warning' | 'error') {
  switch (severity) {
    case 'success':
      return <Check size={12} color="$green11" />
    case 'warning':
      return <AlertTriangle size={12} color="$yellow11" />
    case 'error':
      return <X size={12} color="$red11" />
  }
}

function getStatusLabel(severity: 'success' | 'warning' | 'error') {
  switch (severity) {
    case 'success':
      return 'OK'
    case 'warning':
      return 'Warning'
    case 'error':
      return 'Failed'
  }
}

// =============================================================================
// Component
// =============================================================================

export function GLSubLimitsTable({
  items,
  title = 'General Liability Coverage Details',
  isLoading = false,
  error = null,
  onItemPress,
  ...props
}: GLSubLimitsTableProps) {
  // Count items with errors for red flag banner
  const errorCount = items.filter((item) => item.severity === 'error').length
  const hasRedFlags = errorCount > 0

  // Loading state
  if (isLoading) {
    return (
      <TableContainer {...props}>
        {title && (
          <TableHeader>
            <TableTitle>{title}</TableTitle>
          </TableHeader>
        )}
        <LoadingContainer>
          <Spinner size="large" color="$color11" />
          <Text color="$color9">Loading coverage details...</Text>
        </LoadingContainer>
      </TableContainer>
    )
  }

  // Error state
  if (error) {
    return (
      <TableContainer {...props}>
        {title && (
          <TableHeader>
            <TableTitle>{title}</TableTitle>
          </TableHeader>
        )}
        <ErrorContainer>
          <XStack alignItems="center" gap="$2">
            <AlertCircle size={16} color="$red11" />
            <ErrorText>Failed to load coverage details</ErrorText>
          </XStack>
          <Text fontSize="$2" color="$red9">
            {error}
          </Text>
        </ErrorContainer>
      </TableContainer>
    )
  }

  // Empty state
  if (items.length === 0) {
    return (
      <TableContainer {...props}>
        {title && (
          <TableHeader>
            <TableTitle>{title}</TableTitle>
          </TableHeader>
        )}
        <YStack padding="$4" alignItems="center">
          <Text color="$color9">No coverage provisions found</Text>
        </YStack>
      </TableContainer>
    )
  }

  return (
    <TableContainer {...props}>
      {title && (
        <TableHeader>
          <TableTitle>{title}</TableTitle>
          {hasRedFlags && (
            <XStack
              backgroundColor="$red3"
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius="$full"
              alignItems="center"
              gap="$1"
            >
              <AlertCircle size={12} color="$red11" />
              <Text fontSize="$2" fontWeight="600" color="$red11">
                {errorCount} Issue{errorCount > 1 ? 's' : ''}
              </Text>
            </XStack>
          )}
        </TableHeader>
      )}

      {hasRedFlags && (
        <RedFlagBanner>
          <AlertTriangle size={14} color="$red11" />
          <RedFlagText>
            {errorCount} provision{errorCount > 1 ? 's do' : ' does'} not meet minimum requirements
          </RedFlagText>
        </RedFlagBanner>
      )}

      <HeaderRow>
        <Cell flex={2.5}>
          <HeaderCell>Coverage Type</HeaderCell>
        </Cell>
        <Cell flex={1.5}>
          <HeaderCell>Requirement</HeaderCell>
        </Cell>
        <Cell flex={1.5}>
          <HeaderCell>Current Value</HeaderCell>
        </Cell>
        <Cell width={90} alignItems="center">
          <HeaderCell>Status</HeaderCell>
        </Cell>
      </HeaderRow>

      {items.map((item, index) => (
        <TableRow
          key={item.id}
          isLast={index === items.length - 1}
          hasError={item.severity === 'error'}
          hasWarning={item.severity === 'warning'}
          onPress={onItemPress ? () => onItemPress(item) : undefined}
          cursor={onItemPress ? 'pointer' : undefined}
        >
          <Cell flex={2.5}>
            <YStack>
              <ProvisionName>{item.name}</ProvisionName>
              {item.message && item.severity !== 'success' && (
                <MessageText>{item.message}</MessageText>
              )}
            </YStack>
          </Cell>
          <Cell flex={1.5}>
            <RequirementText>{item.requirement}</RequirementText>
          </Cell>
          <Cell flex={1.5}>
            <ValueText status={item.severity}>{item.formatted_value}</ValueText>
          </Cell>
          <Cell width={90} alignItems="center">
            <StatusBadge status={item.severity}>
              {getStatusIcon(item.severity)}
              <StatusText status={item.severity}>{getStatusLabel(item.severity)}</StatusText>
            </StatusBadge>
          </Cell>
        </TableRow>
      ))}
    </TableContainer>
  )
}
