import { ROUTES, buildPath } from '@scf/core/constants/routes'
import {
  useOfficeListUsers,
  useOfficeDeleteUserMutation,
} from '@scf/core/utils/office-users-sdk-hooks'
import type { TableColumnVisibilityOption } from '@scaffald/ui'
import { type ColumnDef, createColumnHelper, type VisibilityState } from '@tanstack/react-table'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  Button,
  Stack,
  TableAddRecordModal,
  TableColumnVisibilityModal,
  Text,
  useThemeContext,
  useToast,
} from '@scaffald/ui'
import { Pressable } from 'react-native'
import { copyToClipboard } from '@scf/core/utils/clipboard'
import { workerLabel } from './worker-label'
import { OfficePageLayout } from './components/OfficePageLayout'
import { QuickActionsWidget } from './components/QuickActionsWidget'
import { colors } from '@scaffald/ui/tokens'

type User = {
  id: string
  first_name: string | null
  last_name: string | null
  display_name?: string | null
  username?: string | null
  /** From auth via the api (#1116); not in the SDK type yet, so optional. */
  email?: string | null
  avatar_path: string | null
  created_at: string
  updated_at: string
}

const columnHelper = createColumnHelper<User>()

function NameCell({ user }: { user: User }) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const label = workerLabel(user)
  // The email goes beneath the name, unless the email already is the label.
  const secondary = user.email && user.email !== label ? user.email : null
  return (
    <Stack gap={2} style={{ minWidth: 0, width: '100%' }}>
      <Text numberOfLines={1} style={{ color: colors.text[t].primary }}>
        {label}
      </Text>
      {secondary ? (
        <Text numberOfLines={1} style={{ color: colors.text[t].tertiary }}>
          {secondary}
        </Text>
      ) : null}
    </Stack>
  )
}

function IdCell({ id }: { id: string }) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const toast = useToast()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Copy ID ${id}`}
      onPress={async (event) => {
        // The row itself opens the editor; a copy should not.
        event?.stopPropagation?.()
        const ok = await copyToClipboard(id)
        toast.show({
          message: ok ? 'ID copied' : 'Could not copy the ID',
          variant: ok ? 'success' : 'error',
        })
      }}
    >
      <Text numberOfLines={1} style={{ color: colors.text[t].tertiary, fontFamily: 'monospace' }}>
        {id.substring(0, 8)}
      </Text>
    </Pressable>
  )
}

const createColumns = () => [
  columnHelper.display({
    id: 'name',
    header: 'Name',
    cell: (info) => <NameCell user={info.row.original} />,
    meta: {
      label: 'Name',
      hideable: false,
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
  // The id is for support and debugging, not for recognising a person: last,
  // short, and copyable.
  columnHelper.accessor('id', {
    id: 'id',
    header: 'ID',
    cell: (info) => <IdCell id={info.getValue()} />,
    meta: {
      label: 'ID',
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

  const { data, isLoading, refetch } = useOfficeListUsers()

  const deleteMutation = useOfficeDeleteUserMutation({
    onSuccess: () => {
      refetch()
    },
  })

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id)
  }

  // The api now adds `email` (#1116); the SDK type does not list it yet.
  const users = (data?.users ?? []) as User[]

  // Filter users based on search value
  const filteredUsers = users.filter((user) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return [user.first_name, user.last_name, user.display_name, user.username, user.email]
      .filter(Boolean)
      .some((value) => (value as string).toLowerCase().includes(searchLower))
  })

  const columns = createColumns()

  const handleRowEdit = (user: User) => {
    router.push(buildPath(ROUTES.OFFICE.CMS.WORKERS.EDIT, { id: user.id }))
  }

  const handleRowDelete = async (user: User) => {
    await handleDelete(user.id)
  }

  const getItemName = (user: User) => workerLabel(user)

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

  return (
    <OfficePageLayout
      resultNoun="worker"
      wrapWithOfficeLayout
      showBreadcrumb
      title="Workers"
      searchPlaceholder="Search workers by name or email…"
      searchValue={search}
      onSearchChange={setSearch}
      createButtonLabel="Create worker"
      onCreateClick={() => router.push(ROUTES.OFFICE.CMS.WORKERS.CREATE.path)}
      columns={columns as ColumnDef<User, unknown>[]}
      data={filteredUsers as User[]}
      isLoading={isLoading}
      pageSize={50}
      emptyMessage="No workers found"
      hideCreateButton
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={setColumnVisibility}
      onRowEdit={handleRowEdit}
      onRowDelete={handleRowDelete}
      getItemName={getItemName}
      itemType="worker"
      hideHeader={!showHeader}
      rightContent={
        <QuickActionsWidget
          context="list"
          resourceName="Worker"
          onCreate={() => router.push(ROUTES.OFFICE.CMS.WORKERS.CREATE.path)}
          onRefresh={() => refetch()}
          isLoading={isLoading}
        />
      }
      toolbarActions={
        <Button size="sm" variant="outline" onPress={() => setColumnModalOpen(true)}>
          Columns
        </Button>
      }
      toolbarModals={
        <>
          <TableAddRecordModal
            open={addModalOpen}
            onOpenChange={setAddModalOpen}
            title="Create worker"
            description="Quickly add a new worker. The fully featured form is coming soon, but you can jump to the dedicated page now."
            primaryActionLabel="Open full create flow"
            onPrimaryAction={() => {
              setAddModalOpen(false)
              router.push(ROUTES.OFFICE.CMS.WORKERS.CREATE.path)
            }}
          />
          <TableColumnVisibilityModal
            open={columnModalOpen}
            onOpenChange={setColumnModalOpen}
            columns={columnVisibilityOptions}
            visibility={columnVisibility}
            onVisibilityChange={(columnId, visible) =>
              setColumnVisibility((previous) => ({ ...previous, [columnId]: visible }))
            }
          />
        </>
      }
    />
  )
}
