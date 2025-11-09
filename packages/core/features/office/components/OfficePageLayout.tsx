import {
  YStack,
  XStack,
  DataTable,
  Input,
  Button,
  H2,
  TableActionBar,
  TableAddRecordModal,
  TableColumnVisibilityModal,
  type TableActionBarProps,
  type TableAddRecordModalProps,
  type TableColumnVisibilityModalProps,
} from '@app/ui'
import type { ColumnDef, Updater, VisibilityState } from '@tanstack/react-table'
import type { Dispatch, SetStateAction } from 'react'
import { Plus } from '@tamagui/lucide-icons'

interface OfficeActionBarConfig {
  bar: TableActionBarProps
  addModalProps?: TableAddRecordModalProps
  columnVisibilityModalProps?: TableColumnVisibilityModalProps
}

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
  hideCreateButton?: boolean
  actionBarConfig?: OfficeActionBarConfig
  columnVisibility?: VisibilityState
  onColumnVisibilityChange?: (updater: Updater<VisibilityState>) => void
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
  hideCreateButton = false,
  actionBarConfig,
  columnVisibility,
  onColumnVisibilityChange,
}: OfficePageLayoutProps<TData>) {
  return (
    <YStack flex={1} p="$4" gap="$4">
      <XStack justify="space-between" items="center">
        <H2>{title}</H2>
        {!actionBarConfig && !hideCreateButton && (
          <Button icon={Plus} onPress={onCreateClick}>
            {createButtonLabel}
          </Button>
        )}
      </XStack>

      {actionBarConfig ? (
        <>
          <TableActionBar {...actionBarConfig.bar} />
          {actionBarConfig.addModalProps ? (
            <TableAddRecordModal {...actionBarConfig.addModalProps} />
          ) : null}
          {actionBarConfig.columnVisibilityModalProps ? (
            <TableColumnVisibilityModal {...actionBarConfig.columnVisibilityModalProps} />
          ) : null}
        </>
      ) : (
        <Input placeholder={searchPlaceholder} value={searchValue} onChangeText={onSearchChange} />
      )}

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        onRowClick={onRowClick}
        pageSize={pageSize}
        emptyMessage={emptyMessage}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={onColumnVisibilityChange}
      />
    </YStack>
  )
}
