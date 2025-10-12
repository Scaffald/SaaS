import { YStack, DataTable } from '@app/ui'
import type { ColumnDef } from '@tanstack/react-table'

interface OfficePageLayoutProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  isLoading?: boolean
  onRowClick?: (row: TData) => void
  pageSize?: number
  emptyMessage?: string
}

export function OfficePageLayout<TData>({
  columns,
  data,
  isLoading = false,
  onRowClick,
  pageSize = 50,
  emptyMessage = 'No data found',
}: OfficePageLayoutProps<TData>) {
  return (
    <YStack flex={1} bg="$background">
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
