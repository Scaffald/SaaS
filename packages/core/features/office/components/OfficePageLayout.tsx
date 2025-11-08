import { YStack, XStack, DataTable, Input, Button, H2 } from '@app/ui'
import type { ColumnDef } from '@tanstack/react-table'
import type { Dispatch, SetStateAction } from 'react'
import { Plus } from '@tamagui/lucide-icons'

interface OfficePageLayoutProps<TData> {
  title: string
  searchPlaceholder: string
  searchValue: string
  onSearchChange: Dispatch<SetStateAction<string>>
  createButtonLabel: string
  onCreateClick: () => void
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  isLoading?: boolean
  onRowClick?: (row: TData) => void
  pageSize?: number
  emptyMessage?: string
}

export function OfficePageLayout<TData>({
  title,
  searchPlaceholder,
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
}: OfficePageLayoutProps<TData>) {
  return (
    <YStack flex={1} p="$4" gap="$4">
      <XStack justify="space-between" items="center">
        <H2>{title}</H2>
        <Button icon={Plus} onPress={onCreateClick}>
          {createButtonLabel}
        </Button>
      </XStack>

      <Input placeholder={searchPlaceholder} value={searchValue} onChangeText={onSearchChange} />

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
