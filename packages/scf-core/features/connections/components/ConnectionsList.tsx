import { useConnections, useRemoveConnectionMutation } from '@scf/core/utils/engagement-sdk-hooks'
import type { Connection } from '@scaffald/sdk/resources/connections'
import { useToast, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Download, Trash2 } from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import { Avatar, Button, Input, SkeletonList, Text, Row, Stack } from '@scaffald/ui'
import { useQueryClient } from '@tanstack/react-query'

export function ConnectionsList() {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
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

  if (isLoading) {
    return <SkeletonList count={4} variant="profile" />
  }

  return (
    <Stack gap={16}>
      <Row justify="space-between" align="center" gap={8}>
        <Input
          style={{ flex: 1 }}
          placeholder="Search connections..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {filteredConnections.length > 0 && (
          <Button size="sm" variant="outline" iconStart={Download} onPress={handleExportCSV}>
            Export CSV
          </Button>
        )}
      </Row>

      {filteredConnections.length === 0 ? (
        <Stack
          gap={12}
          borderWidth={1}
          borderColor={colors.border[t].default}
          borderRadius={16}
          padding="md"
          backgroundColor={colors.bg[t].muted}
          align="center"
          justify="center"
          style={{ minHeight: 300 }}
        >
          <Text>No connections yet</Text>
          <Text style={{ color: colors.text[t].secondary, textAlign: 'center' }}>
            {searchTerm
              ? 'No connections match your search.'
              : "You haven't connected with anyone yet. Send connection requests to build your network."}
          </Text>
        </Stack>
      ) : (
        <Stack
          gap={0}
          style={{
            borderWidth: 1,
            borderColor: colors.border[t].default,
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: colors.bg[t].default,
          }}
        >
          {filteredConnections.map((conn: Connection, idx: number) => {
            const requesterName =
              `${conn.requester?.first_name || ''} ${conn.requester?.last_name || ''}`.trim()
            const addresseeName =
              `${conn.addressee?.first_name || ''} ${conn.addressee?.last_name || ''}`.trim()
            const name = requesterName || addresseeName || 'Unknown'
            const avatar = conn.requester?.avatar_url || conn.addressee?.avatar_url
            const date = conn.created_at ? new Date(conn.created_at).toLocaleDateString() : '-'
            const isLast = idx === filteredConnections.length - 1

            return (
              <Row
                key={conn.id}
                align="center"
                gap={12}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: colors.border[t].subtle,
                }}
              >
                <Avatar
                  size={40}
                  src={avatar ? { uri: avatar } : undefined}
                  initials={!avatar ? name.charAt(0).toUpperCase() : undefined}
                  color="info"
                />
                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text[t].primary }} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.text[t].secondary }} numberOfLines={1}>
                    Connected {date}
                  </Text>
                </Stack>
                <Button
                  size="sm"
                  variant="outline"
                  iconStart={Trash2}
                  onPress={() => handleRemove(conn.id)}
                  disabled={removeConnectionMutation.isPending}
                >
                  Remove
                </Button>
              </Row>
            )
          })}
        </Stack>
      )}
    </Stack>
  )
}
