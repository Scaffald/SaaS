/**
 * CoverageTable - Display coverage details for an insurance policy
 */

import { styled, YStack, XStack, Text, View, type YStackProps } from 'tamagui'
import { Check, X, AlertCircle } from '@tamagui/lucide-icons'

export interface Coverage {
  id: string
  name: string
  description?: string
  limit?: number | string
  deductible?: number | string
  premium?: number
  included: boolean
  notes?: string
}

export interface CoverageTableProps extends Omit<YStackProps, 'children'> {
  /** Array of coverage items */
  coverages: Coverage[]
  /** Whether to show premium column */
  showPremium?: boolean
  /** Whether to show deductible column */
  showDeductible?: boolean
  /** Title for the table */
  title?: string
}

const TableContainer = styled(YStack, {
  name: 'CoverageTable',
  backgroundColor: '$background',
  borderRadius: '$lg',
  borderWidth: 1,
  borderColor: '$borderColor',
  overflow: 'hidden',
})

const TableHeader = styled(XStack, {
  name: 'CoverageTableHeader',
  padding: '$3',
  backgroundColor: '$color2',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
})

const TableTitle = styled(Text, {
  name: 'CoverageTableTitle',
  fontSize: '$4',
  fontWeight: '600',
  color: '$color12',
})

const HeaderRow = styled(XStack, {
  name: 'CoverageHeaderRow',
  padding: '$3',
  backgroundColor: '$color3',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  gap: '$2',
})

const HeaderCell = styled(Text, {
  name: 'CoverageHeaderCell',
  fontSize: '$2',
  fontWeight: '600',
  color: '$color11',
  textTransform: 'uppercase',
})

const TableRow = styled(XStack, {
  name: 'CoverageTableRow',
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
  } as const,

  hoverStyle: {
    backgroundColor: '$color2',
  },
})

const Cell = styled(View, {
  name: 'CoverageCell',
})

const CoverageName = styled(Text, {
  name: 'CoverageName',
  fontSize: '$3',
  fontWeight: '500',
  color: '$color12',
})

const CoverageDescription = styled(Text, {
  name: 'CoverageDescription',
  fontSize: '$2',
  color: '$color9',
  marginTop: '$1',
})

const CellValue = styled(Text, {
  name: 'CoverageCellValue',
  fontSize: '$3',
  color: '$color11',
})

const IncludedBadge = styled(XStack, {
  name: 'IncludedBadge',
  width: 24,
  height: 24,
  borderRadius: '$full',
  alignItems: 'center',
  justifyContent: 'center',

  variants: {
    included: {
      true: {
        backgroundColor: '$green3',
      },
      false: {
        backgroundColor: '$red3',
      },
    },
  } as const,
})

const NotesText = styled(Text, {
  name: 'CoverageNotes',
  fontSize: '$2',
  color: '$yellow11',
  fontStyle: 'italic',
})

function formatCurrency(amount: number | string): string {
  if (typeof amount === 'string') return amount
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function CoverageTable({
  coverages,
  showPremium = false,
  showDeductible = true,
  title,
  ...props
}: CoverageTableProps) {
  return (
    <TableContainer {...props}>
      {title && (
        <TableHeader>
          <TableTitle>{title}</TableTitle>
        </TableHeader>
      )}

      <HeaderRow>
        <Cell flex={3}>
          <HeaderCell>Coverage</HeaderCell>
        </Cell>
        <Cell flex={2}>
          <HeaderCell>Limit</HeaderCell>
        </Cell>
        {showDeductible && (
          <Cell flex={1}>
            <HeaderCell>Deductible</HeaderCell>
          </Cell>
        )}
        {showPremium && (
          <Cell flex={1}>
            <HeaderCell>Premium</HeaderCell>
          </Cell>
        )}
        <Cell width={60} alignItems="center">
          <HeaderCell>Status</HeaderCell>
        </Cell>
      </HeaderRow>

      {coverages.map((coverage, index) => (
        <TableRow key={coverage.id} isLast={index === coverages.length - 1}>
          <Cell flex={3}>
            <YStack>
              <CoverageName>{coverage.name}</CoverageName>
              {coverage.description && (
                <CoverageDescription>{coverage.description}</CoverageDescription>
              )}
              {coverage.notes && (
                <XStack alignItems="center" gap="$1" marginTop="$1">
                  <AlertCircle size={12} color="$yellow11" />
                  <NotesText>{coverage.notes}</NotesText>
                </XStack>
              )}
            </YStack>
          </Cell>
          <Cell flex={2}>
            <CellValue>
              {coverage.limit !== undefined ? formatCurrency(coverage.limit) : '-'}
            </CellValue>
          </Cell>
          {showDeductible && (
            <Cell flex={1}>
              <CellValue>
                {coverage.deductible !== undefined ? formatCurrency(coverage.deductible) : '-'}
              </CellValue>
            </Cell>
          )}
          {showPremium && (
            <Cell flex={1}>
              <CellValue>
                {coverage.premium !== undefined ? formatCurrency(coverage.premium) : '-'}
              </CellValue>
            </Cell>
          )}
          <Cell width={60} alignItems="center">
            <IncludedBadge included={coverage.included}>
              {coverage.included ? (
                <Check size={14} color="$green11" />
              ) : (
                <X size={14} color="$red11" />
              )}
            </IncludedBadge>
          </Cell>
        </TableRow>
      ))}
    </TableContainer>
  )
}
