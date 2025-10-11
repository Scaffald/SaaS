import { YStack, XStack, Text, Input, Button, DataTable } from '@app/ui'
import { Plus } from '@tamagui/lucide-icons'
import type { ReactNode } from 'react'
import type { ColumnDef } from '@tanstack/react-table'

interface OfficePageLayoutProps<TData> {
  title: string
  searchPlaceholder?: string
  searchValue: string
  onSearchChange: (value: string) => void
  createButtonLabel?: string
  onCreateClick?: () => void
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  isLoading?: boolean
  onRowClick?: (row: TData) => void
  pageSize?: number
  emptyMessage?: string
  headerActions?: ReactNode
}

export function OfficePageLayout<TData>({
  title,
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  createButtonLabel,
  onCreateClick,
  columns,
  data,
  isLoading = false,
  onRowClick,
  pageSize = 50,
  emptyMessage = 'No data found',
  headerActions,
}: OfficePageLayoutProps<TData>) {
  return (
    <YStack flex={1} bg="$background">
      {/* Header */}
      <XStack p="$4" gap="$4" items="center" borderBottomWidth={1} borderBottomColor="$borderColor">
        <Text fontSize="$8" fontWeight="bold">
          {title}
        </Text>
        <Input
          flex={1}
          placeholder={searchPlaceholder}
          value={searchValue}
          onChangeText={onSearchChange}
        />
        {headerActions}
        {createButtonLabel && onCreateClick && (
          <Button icon={Plus} onPress={onCreateClick} themeInverse>
            {createButtonLabel}
          </Button>
        )}
      </XStack>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        onRowClick={onRowClick}
        pageSize={pageSize}
        emptyMessage={emptyMessage}
      />
    </YStack>
  )
}
