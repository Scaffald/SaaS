import { YStack, XStack, Text, Input, DataTable, Button } from '@app/ui'
import { Card } from 'tamagui'
import { api } from '@app/core/utils/api'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { Briefcase, Users } from '@tamagui/lucide-icons'

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
      {/* Quick Actions */}
      <XStack p="$4" gap="$4">
        <Card
          flex={1}
          p="$4"
          pressStyle={{ scale: 0.98 }}
          onPress={() => router.push('/office/jobs')}
        >
          <YStack gap="$2">
            <XStack items="center" gap="$2">
              <Briefcase size={20} />
              <Text fontSize="$6" fontWeight="600">
                Job Postings
              </Text>
            </XStack>
            <Text fontSize="$3" color="$color11">
              Manage job listings and applications
            </Text>
          </YStack>
        </Card>
        <Card flex={1} p="$4" bg="$color3">
          <YStack gap="$2">
            <XStack items="center" gap="$2">
              <Users size={20} />
              <Text fontSize="$6" fontWeight="600">
                User Management
              </Text>
            </XStack>
            <Text fontSize="$3" color="$color11">
              View and manage platform users
            </Text>
          </YStack>
        </Card>
      </XStack>

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
        onRowClick={(user) => router.push(`/office/user/${(user as User).id}`)}
        pageSize={50}
        emptyMessage="No users found"
      />
    </YStack>
  )
}
