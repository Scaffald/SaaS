import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import type { TableColumnVisibilityOption } from '@unicornlove/beyond-ui'
import { type ColumnDef, createColumnHelper, type VisibilityState } from '@tanstack/react-table'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Paragraph, Stack } from '@unicornlove/beyond-ui'
import { OfficePageLayout } from './components/OfficePageLayout'
import { QuickActionsWidget } from './components/QuickActionsWidget'

type User = {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_path: string | null
  created_at: string
  updated_at: string
}

const columnHelper = createColumnHelper<User>()

const createColumns = () => [
  columnHelper.accessor('first_name', {
    id: 'first_name',
    header: 'First Name',
    cell: (info) => info.getValue() || '-',
    meta: {
      label: 'First Name',
      hideable: true,
    },
  }),
  columnHelper.accessor('last_name', {
    id: 'last_name',
    header: 'Last Name',
    cell: (info) => info.getValue() || '-',
    meta: {
      label: 'Last Name',
      hideable: true,
    },
  }),
  columnHelper.accessor('id', {
    id: 'id',
    header: 'User ID',
    cell: (info) => `${info.getValue().substring(0, 8)}...`,
    meta: {
      label: 'User ID',
      hideable: true,
    },
  }),
  columnHelper.accessor('created_at', {
    id: 'created_at',
    header: 'Created',
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    meta: {
      label: 'Created',
      hideable: true,
    },
  }),
  // Actions column removed - using RowActionOverlay instead
]

export interface OfficeUsersListProps {
  showHeader?: boolean
}

export function OfficeUsersList({ showHeader = true }: OfficeUsersListProps = {}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [columnModalOpen, setColumnModalOpen] = useState(false)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const { data, isLoading, refetch } = api.office.listUsers.useQuery()

  const deleteMutation = api.office.deleteUser.useMutation({
    onSuccess: () => {
      refetch()
    },
  })

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync({ id })
  }

  const users = data?.users ?? []

  // Filter users based on search value
  const filteredUsers = users.filter((user: User) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    const firstName = user.first_name?.toLowerCase() || ''
    const lastName = user.last_name?.toLowerCase() || ''
    return firstName.includes(searchLower) || lastName.includes(searchLower)
  })

  const columns = createColumns()

  const handleRowEdit = (user: User) => {
    router.push(buildPath(ROUTES.OFFICE.CMS.WORKERS.EDIT, { id: user.id }))
  }

  const handleRowDelete = async (user: User) => {
    await handleDelete(user.id)
  }

  const getItemName = (user: User) => {
    const displayName =
      `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.id.substring(0, 8)
    return displayName
  }

  const columnVisibilityOptions = useMemo<TableColumnVisibilityOption[]>(() => {
    return columns
      .map((column) => {
        const columnId =
          column.id ??
          (typeof (column as { accessorKey?: string }).accessorKey === 'string'
            ? (column as { accessorKey?: string }).accessorKey
            : undefined)
        if (!columnId) {
          return null
        }

        const meta = column.meta as { label?: string; hideable?: boolean } | undefined
        if (meta?.hideable === false) {
          return null
        }

        const label =
          meta?.label ||
          (typeof column.header === 'string' ? column.header : String(columnId).toUpperCase())

        return {
          id: String(columnId),
          label,
        }
      })
      .filter((option): option is TableColumnVisibilityOption => option !== null)
  }, [columns])

  const handleColumnVisibilityChange = (columnId: string, visible: boolean) => {
    setColumnVisibility((prev) => {
      const next = { ...prev }
      if (visible) {
        delete next[columnId]
      } else {
        next[columnId] = false
      }
      return next
    })
  }

  return (
    <OfficePageLayout
      wrapWithOfficeLayout
      showBreadcrumb
      title="Users"
      searchPlaceholder="Search users..."
      searchValue={search}
      onSearchChange={setSearch}
      createButtonLabel="Create User"
      onCreateClick={() => router.push(ROUTES.OFFICE.CMS.WORKERS.CREATE.path)}
      columns={columns as ColumnDef<User, unknown>[]}
      data={filteredUsers}
      isLoading={isLoading}
      pageSize={50}
      emptyMessage="No users found"
      hideCreateButton
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={setColumnVisibility}
      onRowEdit={handleRowEdit}
      onRowDelete={handleRowDelete}
      getItemName={getItemName}
      itemType="user"
      hideHeader={!showHeader}
      rightContent={
        <QuickActionsWidget
          context="list"
          resourceName="User"
          onCreate={() => router.push(ROUTES.OFFICE.CMS.WORKERS.CREATE.path)}
          onRefresh={() => refetch()}
          isLoading={isLoading}
        />
      }
      actionBarConfig={{
        bar: {
          addLabel: 'Add',
          onAddPress: () => setAddModalOpen(true),
          showLabel: 'Show',
          onShowPress: () => setColumnModalOpen(true),
          searchValue: search,
          onSearchChange: setSearch,
          searchPlaceholder: 'Search users...',
          helperText: 'List all the filterable items.',
        },
        addModalProps: {
          open: addModalOpen,
          onOpenChange: setAddModalOpen,
          title: 'Create User',
          description:
            'Quickly add a new office user. The fully featured form is coming soon, but you can jump to the dedicated page now.',
          primaryActionLabel: 'Open full create flow',
          onPrimaryAction: () => {
            setAddModalOpen(false)
            router.push(ROUTES.OFFICE.CMS.WORKERS.CREATE.path)
          },
          children: (
            <Stack gap={12}>
              <Paragraph size={16} color="gray">
                This modal will collect user details in an upcoming iteration. Until then, use the
                primary action below to launch the full create page.
              </Paragraph>
            </Stack>
          ),
        },
        columnVisibilityModalProps: {
          open: columnModalOpen,
          onOpenChange: setColumnModalOpen,
          columns: columnVisibilityOptions,
          visibility: columnVisibility,
          onVisibilityChange: handleColumnVisibilityChange,
          minimumVisibleColumns: 2,
        },
      }}
    />
  )
}
