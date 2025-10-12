import { api } from '@app/core/utils/api'
import { ROUTES, RouteBuilder } from '@app/core/constants/routes'
import { useRouter } from 'expo-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { Button, XStack } from 'tamagui'
import { Pencil } from '@tamagui/lucide-icons'
import { OfficePageLayout } from './components/OfficePageLayout'
import { DeleteButton } from './components/DeleteButton'

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
    header: 'First Name',
    cell: (info) => info.getValue() || '-',
  }),
  columnHelper.accessor('last_name', {
    header: 'Last Name',
    cell: (info) => info.getValue() || '-',
  }),
  columnHelper.accessor('id', {
    header: 'User ID',
    cell: (info) => `${info.getValue().substring(0, 8)}...`,
  }),
  columnHelper.accessor('created_at', {
    header: 'Created',
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
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

interface OfficeUsersListProps {
  searchValue?: string
}

export function OfficeUsersList({ searchValue = '' }: OfficeUsersListProps) {
  const router = useRouter()

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
    if (!searchValue) return true
    const searchLower = searchValue.toLowerCase()
    const firstName = user.first_name?.toLowerCase() || ''
    const lastName = user.last_name?.toLowerCase() || ''
    return firstName.includes(searchLower) || lastName.includes(searchLower)
  })

  const columns = createColumns(router, handleDelete)

  return (
    <OfficePageLayout
      columns={columns as ColumnDef<User, unknown>[]}
      data={filteredUsers}
      isLoading={isLoading}
      pageSize={50}
      emptyMessage="No users found"
    />
  )
}

// Export props for header configuration
export const officeUsersHeaderConfig = {
  searchPlaceholder: 'Search users...',
  createButtonLabel: 'Create User',
  createRoute: ROUTES.OFFICE_USERS_CREATE.path,
}
