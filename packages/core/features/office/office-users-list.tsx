import { api } from '@app/core/utils/api'
import { ROUTES, RouteBuilder } from '@app/core/constants/routes'
import { useMemo, useState } from 'react'
import { useRouter } from 'expo-router'
import { createColumnHelper, type ColumnDef, type VisibilityState } from '@tanstack/react-table'
import { Button, Paragraph, XStack, YStack } from 'tamagui'
import { Pencil } from '@tamagui/lucide-icons'
import { OfficePageLayout } from './components/OfficePageLayout'
import { DeleteButton } from './components/DeleteButton'
import type { TableColumnVisibilityOption } from '@app/ui'

type User = {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_path: string | null
  created_at: string
  updated_at: string
}

const columnHelper = createColumnHelper<User>()

const createColumns = (
  router: ReturnType<typeof useRouter>,
  onDelete: (id: string) => Promise<void>
) => [
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
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    meta: {
      label: 'Actions',
      hideable: false,
    },
    cell: (info) => {
      const user = info.row.original
      const displayName =
        `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.id.substring(0, 8)
      return (
        <XStack gap="$2">
          <Button
            size="$2"
            variant="outlined"
            icon={Pencil}
            onPress={() => router.push(RouteBuilder.officeUsersEdit(user.id))}
          >
            Edit
          </Button>
          <DeleteButton itemName={displayName} itemType="user" onDelete={() => onDelete(user.id)} />
        </XStack>
      )
    },
  }),
]

export function OfficeUsersList() {
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

  const columns = createColumns(router, handleDelete)

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
      title="Users"
      searchPlaceholder="Search users..."
      searchValue={search}
      onSearchChange={setSearch}
      createButtonLabel="Create User"
      onCreateClick={() => router.push(ROUTES.OFFICE_USERS_CREATE.path)}
      columns={columns as ColumnDef<User, unknown>[]}
      data={filteredUsers}
      isLoading={isLoading}
      pageSize={50}
      emptyMessage="No users found"
      hideCreateButton
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={setColumnVisibility}
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
            router.push(ROUTES.OFFICE_USERS_CREATE.path)
          },
          children: (
            <YStack gap="$3">
              <Paragraph size="$4" color="$color11">
                This modal will collect user details in an upcoming iteration. Until then, use the
                primary action below to launch the full create page.
              </Paragraph>
            </YStack>
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
