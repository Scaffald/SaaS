import { useConnections, useRemoveConnectionMutation } from '@scf/core/utils/engagement-sdk-hooks'
import { DataTable } from '@scf/core/components/ui'
import type { ColumnDef } from '@tanstack/react-table'
import { useToast } from '@unicornlove/beyond-ui'
import { Download, Trash2 } from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import { Avatar, Button, Input, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { useQueryClient } from '@tanstack/react-query'

interface ConnectionData {
  id: string
  requester_id: string
  addressee_id: string
  status: string
  created_at: string
  updated_at: string
  requester?: {
    id: string
    first_name: string
    last_name: string
    avatar_url?: string
  }
  addressee?: {
    id: string
    first_name: string
    last_name: string
    avatar_url?: string
  }
}

type Connection = ConnectionData

export function ConnectionsList() {
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()
  const toast = useToast()

  const { data: connectionsResponse, isLoading } = useConnections()
  const connections = connectionsResponse?.data

  const removeConnectionMutation = useRemoveConnectionMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', 'list'] })
      toast.show({
        title: 'Success',
        message: 'Connection removed',
        variant: 'success',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show({
        title: 'Error',
        message: error.message || 'Failed to remove connection',
        variant: 'error',
      })
    },
  })

  const filteredConnections = useMemo(() => {
    if (!connections) return []
    if (!searchTerm.trim()) return connections

    const search = searchTerm.toLowerCase()
    return connections.filter((conn: Connection) => {
      const requesterName =
        `${conn.requester?.first_name || ''} ${conn.requester?.last_name || ''}`.trim()
      const addresseeName =
        `${conn.addressee?.first_name || ''} ${conn.addressee?.last_name || ''}`.trim()
      const name = requesterName || addresseeName
      return name.toLowerCase().includes(search)
    })
  }, [connections, searchTerm])

  const handleRemove = useCallback(
    async (connectionId: string) => {
      if (confirm('Are you sure you want to remove this connection?')) {
        await removeConnectionMutation.mutateAsync(connectionId)
      }
    },
    [removeConnectionMutation]
  )

  const handleExportCSV = () => {
    if (!connections || connections.length === 0) {
      toast.show({
        title: 'Error',
        message: 'No connections to export',
        variant: 'error',
      })
      return
    }

    const headers = ['Name', 'Connected Since']
    const rows = connections.map((conn: Connection) => {
      const requesterName =
        `${conn.requester?.first_name || ''} ${conn.requester?.last_name || ''}`.trim()
      const addresseeName =
        `${conn.addressee?.first_name || ''} ${conn.addressee?.last_name || ''}`.trim()
      const name = requesterName || addresseeName || 'Unknown'
      const date = conn.created_at ? new Date(conn.created_at).toLocaleDateString() : ''

      return [name, date]
    })

    const csvContent = [headers, ...rows]
      .map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(','))
      .join('\n')

    // Web-only CSV export
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `connections-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.show({
        title: 'Success',
        message: 'Connections exported successfully',
        variant: 'success',
      })
    } else {
      toast.show({
        title: 'Error',
        message: 'CSV export is only available on web',
        variant: 'error',
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
          const requesterName =
            `${conn.requester?.first_name || ''} ${conn.requester?.last_name || ''}`.trim()
          const addresseeName =
            `${conn.addressee?.first_name || ''} ${conn.addressee?.last_name || ''}`.trim()
          const name = requesterName || addresseeName || 'Unknown'
          const avatar = conn.requester?.avatar_url || conn.addressee?.avatar_url

          return (
            <Row align="center" gap={8}>
              <Avatar circular size={32}>
                {avatar ? (
                  <Avatar.Image source={{ uri: avatar }} />
                ) : (
                  <Avatar.Fallback backgroundColor="$blue4">
                    <Text color="$blue10">{name.charAt(0).toUpperCase()}</Text>
                  </Avatar.Fallback>
                )}
              </Avatar>
              <Text>{name}</Text>
            </Row>
          )
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Connected Since',
        cell: ({ row }) => {
          const date = row.original.created_at
          return <Text color="gray">{date ? new Date(date).toLocaleDateString() : '-'}</Text>
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const conn = row.original
          return (
            <Button
              size={8}
              variant="outline"
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
    [removeConnectionMutation.isPending, handleRemove]
  )

  if (isLoading) {
    return (
      <Stack align="center" justify="center" paddingVertical={24} gap={8}>
        <Spinner size="lg" />
        <Text color="gray">Loading connections…</Text>
      </Stack>
    )
  }

  return (
    <Stack gap={16}>
      <Row justify="space-between" align="center" gap={8}>
        <Input
          flex={1}
          placeholder="Search connections..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          size={16}
        />
        {filteredConnections.length > 0 && (
          <Button size={12} variant="outline" icon={Download} onPress={handleExportCSV}>
            Export CSV
          </Button>
        )}
      </Row>

      {filteredConnections.length === 0 ? (
        <Stack
          gap={12}
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius={16}
          padding={16}
          backgroundColor="$color2"
          align="center"
          justify="center"
          style={{ minHeight: 300 }}
        >
          <Text>No connections yet</Text>
          <Text color="gray" style={{ textAlign: 'center' }}>
            {searchTerm
              ? 'No connections match your search.'
              : "You haven't connected with anyone yet. Send connection requests to build your network."}
          </Text>
        </Stack>
      ) : (
        <DataTable
          columns={columns}
          data={filteredConnections}
          pageSize={20}
          emptyMessage="No connections found"
        />
      )}
    </Stack>
  )
}
