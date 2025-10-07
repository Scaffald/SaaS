import { YStack, XStack, Text, Input, DataTable } from '@app/ui'
import { api } from '@app/core/utils/api'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

type User = {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_path: string | null
  created_at: string
  updated_at: string
}

const columnHelper = createColumnHelper<User>()

const columns = [
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
]

export function OfficeUsersScreen() {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { data, isLoading } = api.office.listUsers.useQuery()

  return (
    <YStack flex={1} bg="$background">
      {/* Header */}
      <XStack p="$4" gap="$4" items="center" borderBottomWidth={1} bg="$borderColor">
        <Text fontSize="$8" fontWeight="bold">
          Users
        </Text>
        <Input flex={1} placeholder="Search users..." value={search} onChangeText={setSearch} />
      </XStack>

      {/* Table */}
      <DataTable
        columns={columns as ColumnDef<unknown, unknown>[]}
        data={data?.users ?? []}
        isLoading={isLoading}
        onRowClick={(user) => router.push(`/office/users/${(user as User).id}/edit`)}
        pageSize={50}
        emptyMessage="No users found"
      />
    </YStack>
  )
}
