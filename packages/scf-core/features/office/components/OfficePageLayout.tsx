import {
  Button,
  ScreenHeader,
  ListToolbar,
  Spinner,
  Table,
  Row,
  Stack,
  Text,
  type BreadcrumbItemData,
  type ListToolbarFilterChip,
} from '@scaffald/ui'
import { columnsFromTanStack } from '@scf/core/utils/table-columns'
import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'
import { Plus } from 'lucide-react-native'
import type { ColumnDef, Updater, VisibilityState } from '@tanstack/react-table'
import type { Dispatch, ReactNode, SetStateAction } from 'react'

interface OfficePageLayoutProps<TData> {
  title: string
  searchPlaceholder: string
  searchValue: string
  onSearchChange: Dispatch<SetStateAction<string>>
  /** Filter controls for the toolbar's flyout. Omit for a search-only screen. */
  filterContent?: ReactNode
  /** Drives the "· n" on the Filters & sort button. */
  activeFilterCount?: number
  /** The active filters, shown as chips under the search row. */
  filterChips?: ListToolbarFilterChip[]
  /** Clears every filter. Renders "Clear all" when present. */
  onClearFilters?: () => void
  /** What the rows are, for the count: "{n} job". Defaults to "result". */
  resultNoun?: string
  /** Irregular plural, when "{noun}s" is wrong — "universities", not "universitys". */
  resultNounPlural?: string
  /**
   * Controls that sit inline in the search row: a view toggle, a secondary
   * action. Not the page's primary action — that belongs in the header.
   */
  toolbarActions?: ReactNode
  /** Modals a screen opens from its toolbar (add record, column visibility). */
  toolbarModals?: ReactNode
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
  columns,
  data,
  isLoading = false,
  onRowView,
  onRowEdit,
  onRowDelete: _onRowDelete,
  onRowDuplicate: _onRowDuplicate,
  getItemName: _getItemName,
  itemType: _itemType = 'item',
  pageSize = 50,
  emptyMessage = 'No data found',
  hideCreateButton = false,
  columnVisibility,
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
  filterContent,
  activeFilterCount,
  filterChips,
  onClearFilters,
  resultNoun = 'result',
  resultNounPlural,
  toolbarActions,
  toolbarModals,
}: OfficePageLayoutProps<TData>) {
  // No gutter here: OfficeLayout supplies it. This used to add its own 8px on
  // top, which is why Office titles sat 8px to the right of every other
  // screen's.
  const content = (
    <Stack flex={1} gap={16}>
      {beforeContent}
      {!hideHeader && (
        /* The same header the rest of the app uses, so an Office screen and a
           worker screen open the same way. The create button sits in the
           actions slot because page-level primary actions live at header
           right, always — not inside the filter bar. */
        <ScreenHeader
          title={title}
          actions={
            !hideCreateButton ? (
              <Button iconStart={Plus} onPress={onCreateClick}>
                {createButtonLabel}
              </Button>
            ) : undefined
          }
        />
      )}

      {/* The one search row: search, a Filters & sort flyout when the screen
          has filters, and the result count at the right. Office used to have
          two of its own idioms here — a bare `Input` and a `TableActionBar`
          with its own search, add button and "Show" control. */}
      <ListToolbar
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        filterContent={filterContent}
        activeFilterCount={activeFilterCount}
        chips={filterChips}
        onClearAll={onClearFilters}
        // The count is unknown while loading — "0 users" over a spinner
        // asserts an empty list before anything is known (#623).
        resultCount={isLoading ? undefined : data.length}
        resultNoun={resultNoun}
        resultNounPlural={resultNounPlural}
        actions={toolbarActions}
      />
      {toolbarModals}

      {children}

      <Table
        columns={columnsFromTanStack(columns as ColumnDef<Record<string, unknown>, unknown>[])}
        data={data as Array<Record<string, unknown> & { id?: string }>}
        loading={isLoading}
        renderLoading={() => (
          <Stack align="center" justify="center" paddingVertical={24} gap={8}>
            <Spinner variant="ios" size="lg" />
            <Text>Loading…</Text>
          </Stack>
        )}
        pageSize={pageSize}
        emptyMessage={emptyMessage}
        columnVisibility={columnVisibility as Record<string, boolean> | undefined}
        onRowPress={
          onRowView || onRowEdit || _onRowDelete || _onRowDuplicate
            ? (row) => {
                onRowView?.(row as TData)
              }
            : undefined
        }
      />

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
