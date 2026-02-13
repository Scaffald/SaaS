import {
  Button,
  H2,
  Input,
  TableActionBar,
  type TableActionBarProps,
  TableAddRecordModal,
  type TableAddRecordModalProps,
  TableColumnVisibilityModal,
  type TableColumnVisibilityModalProps,
  Row,
  Stack,
  type BreadcrumbItemData,
} from '@scaffald/ui'
// TODO: DataTable is deprecated - migrate to @scaffald/ui Table API
// import { DataTable } from '@scf/core/components/ui/DataTable'
import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'
import { Plus } from 'lucide-react-native'
import type { ColumnDef, Updater, VisibilityState } from '@tanstack/react-table'
import type { Dispatch, ReactNode, SetStateAction } from 'react'

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
  /** View action handler (opens overlay on row click) */
  onRowView?: (row: TData) => void
  /** Edit action handler (opens overlay on row click) */
  onRowEdit?: (row: TData) => void
  /** Delete action handler (opens overlay on row click) */
  onRowDelete?: (row: TData) => Promise<void>
  /** Duplicate action handler (opens overlay on row click) */
  onRowDuplicate?: (row: TData) => Promise<void>
  /** Function to get item name from row data (for delete confirmation) */
  getItemName?: (row: TData) => string
  /** Type of item (for delete confirmation) */
  itemType?: string
  pageSize?: number
  emptyMessage?: string
  hideCreateButton?: boolean
  actionBarConfig?: OfficeActionBarConfig
  columnVisibility?: VisibilityState
  onColumnVisibilityChange?: (updater: Updater<VisibilityState>) => void
  hideHeader?: boolean
  /** When true, wraps the layout with OfficeLayout (adds tabs + right column) */
  wrapWithOfficeLayout?: boolean
  /** Slot for right column content when wrapWithOfficeLayout is true */
  rightContent?: ReactNode
  /** Breadcrumb visibility override for wrapped layout */
  showBreadcrumb?: boolean
  /** Custom breadcrumb items when wrapped */
  breadcrumbItems?: BreadcrumbItemData[]
  /** Override auto breadcrumb generation when wrapped */
  autoGenerateBreadcrumbs?: boolean
  /** Optional content rendered before the built-in header block */
  beforeContent?: ReactNode
  /** Optional content rendered after the data table */
  afterContent?: ReactNode
  /** Optional children rendered between the action bar/search and the table */
  children?: ReactNode
}

export function OfficePageLayout<TData>({
  title,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  createButtonLabel,
  onCreateClick,
  columns: _columns,
  data: _data,
  isLoading: _isLoading = false,
  onRowView: _onRowView,
  onRowEdit: _onRowEdit,
  onRowDelete: _onRowDelete,
  onRowDuplicate: _onRowDuplicate,
  getItemName: _getItemName,
  itemType: _itemType = 'item',
  pageSize: _pageSize = 50,
  emptyMessage: _emptyMessage = 'No data found',
  hideCreateButton = false,
  actionBarConfig,
  columnVisibility: _columnVisibility,
  onColumnVisibilityChange: _onColumnVisibilityChange,
  hideHeader = false,
  wrapWithOfficeLayout = false,
  rightContent,
  showBreadcrumb,
  breadcrumbItems,
  autoGenerateBreadcrumbs,
  beforeContent,
  afterContent,
  children,
}: OfficePageLayoutProps<TData>) {
  const content = (
    <Stack flex={1} padding="md" gap={16}>
      {beforeContent}
      {!hideHeader && (
        <Row justify="space-between" align="center">
          <H2>{title}</H2>
          {!actionBarConfig && !hideCreateButton && (
            <Button iconStart={Plus} onPress={onCreateClick}>
              {createButtonLabel}
            </Button>
          )}
        </Row>
      )}

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

      {children}

      {/* TODO: DataTable is deprecated - migrate to @scaffald/ui Table API
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        onRowView={onRowView}
        onRowEdit={onRowEdit}
        onRowDelete={onRowDelete}
        onRowDuplicate={onRowDuplicate}
        getItemName={getItemName}
        itemType={itemType}
        pageSize={pageSize}
        emptyMessage={emptyMessage}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={onColumnVisibilityChange}
      />
      */}

      {afterContent}
    </Stack>
  )

  if (wrapWithOfficeLayout) {
    return (
      <OfficeLayout
        leftContent={content}
        rightContent={rightContent}
        showBreadcrumb={showBreadcrumb}
        breadcrumbItems={breadcrumbItems}
        autoGenerateBreadcrumbs={autoGenerateBreadcrumbs}
        leftContainerProps={{ flex: 1 }}
      />
    )
  }

  return content
}
