import { api } from '@app/core/utils/api'
import { DataTable } from '@app/ui'
import type { ColumnDef } from '@tanstack/react-table'
import { useToastController } from '@tamagui/toast'
import { Download, Trash2 } from '@tamagui/lucide-icons'
import { useMemo, useState } from 'react'
import { Avatar, Button, Input, Spinner, Text, XStack, YStack } from 'tamagui'

type Connection = NonNullable<
  ReturnType<typeof api.connections.getConnections.useQuery>['data']
>[number]

export function ConnectionsList() {
  const [searchTerm, setSearchTerm] = useState('')
  const utils = api.useUtils()
  const toast = useToastController()

  const { data: connections, isLoading } = api.connections.getConnections.useQuery()

  const removeConnectionMutation = api.connections.removeConnection.useMutation({
    onSuccess: () => {
      utils.connections.getConnections.invalidate()
      toast.show('Success', {
        message: 'Connection removed',
      })
    },
    onError: (error) => {
      toast.show('Error', {
        message: error.message || 'Failed to remove connection',
      })
    },
  })

  const filteredConnections = useMemo(() => {
    if (!connections) return []
    if (!searchTerm.trim()) return connections

    const search = searchTerm.toLowerCase()
    return connections.filter((conn: Connection) => {
      const user = conn.requester_user_id === conn.user?.id ? conn.addressee_user : conn.user
      const name = user?.display_name || user?.username || ''
      return name.toLowerCase().includes(search)
    })
  }, [connections, searchTerm])

  const handleRemove = async (connectionId: string) => {
    if (confirm('Are you sure you want to remove this connection?')) {
      await removeConnectionMutation.mutateAsync({ connectionId })
    }
  }

  const handleExportCSV = () => {
    if (!connections || connections.length === 0) {
      toast.show('Error', {
        message: 'No connections to export',
      })
      return
    }

    const headers = ['Name', 'Email', 'Industry', 'Connected Since']
    const rows = connections.map((conn: Connection) => {
      const user = conn.requester_user_id === conn.user?.id ? conn.addressee_user : conn.user
      const name = user?.display_name || user?.username || ''
      const email = user?.email || ''
      const industry = user?.industry?.name || ''
      const date = conn.created_at ? new Date(conn.created_at).toLocaleDateString() : ''

      return [name, email, industry, date]
    })

    const csvContent = [headers, ...rows].map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(',')).join('\n')
    
    // Web-only CSV export
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `connections-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.show('Success', {
        message: 'Connections exported successfully',
      })
    } else {
      toast.show('Error', {
        message: 'CSV export is only available on web',
      })
    }
  }

  const columns = useMemo<ColumnDef<Connection>[]>(
    () => [
      {
        accessorKey: 'user',
        header: 'User',
        cell: ({ row }) => {
          const conn = row.original
          const user = conn.requester_user_id === conn.user?.id ? conn.addressee_user : conn.user
          const name = user?.display_name || user?.username || 'Unknown'
          const avatar = user?.avatar_url

          return (
            <XStack items="center" gap="$2">
              <Avatar circular size={32}>
                {avatar ? (
                  <Avatar.Image source={{ uri: avatar }} />
                ) : (
                  <Avatar.Fallback bg="$blue4">
                    <Text fontSize="$3" fontWeight="600" color="$blue10">
                      {name.charAt(0).toUpperCase()}
                    </Text>
                  </Avatar.Fallback>
                )}
              </Avatar>
              <Text fontSize="$3" fontWeight="500">
                {name}
              </Text>
            </XStack>
          )
        },
      },
      {
        accessorKey: 'industry',
        header: 'Industry',
        cell: ({ row }) => {
          const conn = row.original
          const user = conn.requester_user_id === conn.user?.id ? conn.addressee_user : conn.user
          return <Text fontSize="$3">{user?.industry?.name || '-'}</Text>
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Connected Since',
        cell: ({ row }) => {
          const date = row.original.created_at
          return (
            <Text fontSize="$3" color="$color10">
              {date ? new Date(date).toLocaleDateString() : '-'}
            </Text>
          )
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const conn = row.original
          return (
            <Button
              size="$2"
              variant="outlined"
              icon={Trash2}
              onPress={() => handleRemove(conn.id)}
              disabled={removeConnectionMutation.isPending}
            >
              Remove
            </Button>
          )
        },
      },
    ],
    [removeConnectionMutation.isPending]
  )

  if (isLoading) {
    return (
      <YStack items="center" justify="center" py="$6" gap="$2">
        <Spinner size="large" />
        <Text color="$color11">Loading connections…</Text>
      </YStack>
    )
  }

  return (
    <YStack gap="$4">
      <XStack justify="space-between" items="center" gap="$2">
        <Input
          flex={1}
          placeholder="Search connections..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          size="$4"
        />
        {filteredConnections.length > 0 && (
          <Button size="$3" variant="outlined" icon={Download} onPress={handleExportCSV}>
            Export CSV
          </Button>
        )}
      </XStack>

      {filteredConnections.length === 0 ? (
        <YStack
          gap="$3"
          borderWidth={1}
          borderColor="$borderColor"
          rounded="$4"
          p="$4"
          bg="$color2"
          items="center"
          justify="center"
          style={{ minHeight: 300 }}
        >
          <Text fontWeight="600">No connections yet</Text>
          <Text color="$color11" style={{ textAlign: 'center' }}>
            {searchTerm
              ? 'No connections match your search.'
              : 'You haven\'t connected with anyone yet. Send connection requests to build your network.'}
          </Text>
        </YStack>
      ) : (
        <DataTable
          columns={columns}
          data={filteredConnections}
          pageSize={20}
          emptyMessage="No connections found"
        />
      )}
    </YStack>
  )
}
