/**
 * Manage who you have blocked, for Settings.
 *
 * Both stores expect blocking to be reversible and discoverable, not a
 * one-way door buried in a report flow. Without this the only way to unblock
 * would be to contact support (#690).
 */

import { Pressable, View } from 'react-native'
import { Row, Stack, Text, useThemeContext, useToast } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useBlockedUsers, useUnblockUserMutation } from '@scf/core/utils/moderation-sdk-hooks'

export function BlockedUsersSection() {
  const { theme } = useThemeContext()
  const toast = useToast()
  const { data, isLoading } = useBlockedUsers()
  const unblock = useUnblockUserMutation()

  const muted = { color: colors.text[theme].secondary }
  const blocks = data?.data ?? []

  return (
    <Stack gap={12}>
      <Stack gap={4}>
        <Text style={{ fontSize: 17, fontWeight: '600' }}>Blocked people</Text>
        <Text style={muted}>
          Blocking works both ways — neither of you sees the other's messages or posts.
        </Text>
      </Stack>

      {isLoading ? (
        <Text style={muted}>Loading…</Text>
      ) : blocks.length === 0 ? (
        // Not an error state. Most people will never block anyone, and the
        // empty case should read as normal rather than as something missing.
        <Text style={muted}>You haven't blocked anyone.</Text>
      ) : (
        <Stack gap={2}>
          {blocks.map((block) => (
            <Row
              key={block.id}
              justify="space-between"
              align="center"
              gap={12}
              style={{ paddingVertical: 12 }}
            >
              {/*
                The API returns ids, not profiles — deliberately, since a block
                should not require loading the profile of someone you have
                asked not to see. Showing a short id is honest about that;
                joining the profile in would be nicer and is a follow-up.
              */}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontSize: 15 }}>
                  {block.blocked_id.slice(0, 8)}
                </Text>
                <Text style={{ ...muted, fontSize: 13 }}>
                  Blocked {new Date(block.created_at).toLocaleDateString()}
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  unblock.mutate(block.blocked_id, {
                    onSuccess: () =>
                      toast.show({
                        title: 'Unblocked',
                        message: 'You can see each other again.',
                        variant: 'success',
                      }),
                    onError: (error) =>
                      toast.show({
                        title: "Couldn't unblock",
                        message: error.message || 'Please try again.',
                        variant: 'error',
                      }),
                  })
                }
                accessibilityRole="button"
                accessibilityLabel="Unblock this person"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                disabled={unblock.isPending}
              >
                <Text style={{ fontSize: 15, color: colors.text[theme].primary }}>
                  Unblock
                </Text>
              </Pressable>
            </Row>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
