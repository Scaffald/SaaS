/**
 * Worker-side message thread for a job application (v1.12.0 / SC-135).
 * The employer side lives in features/office/.../MessagesTab (with recruiter
 * templates); this is the lean applicant view. Shares the SDK hooks + the
 * application_messages endpoints.
 */
import { useCallback, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { Send } from 'lucide-react-native'
import {
  Button,
  Spinner,
  Stack,
  Text,
  TextArea,
  useThemeContext,
  useToast,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useQueryClient } from '@tanstack/react-query'
import {
  useApplicationMessages,
  useSendApplicationMessageMutation,
} from '@scf/core/utils/jobs-sdk-hooks'

export interface WorkerMessagesScreenProps {
  applicationId: string
}

export function WorkerMessagesScreen({ applicationId }: WorkerMessagesScreenProps) {
  const { theme } = useThemeContext()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')

  const { data, isLoading, error } = useApplicationMessages(applicationId)
  const send = useSendApplicationMessageMutation()

  const messages = data?.data ?? []

  const onSend = useCallback(() => {
    const body = draft.trim()
    if (!body) return
    send.mutate(
      { applicationId, body },
      {
        onSuccess: () => {
          setDraft('')
          queryClient.invalidateQueries({ queryKey: ['application', applicationId, 'messages'] })
        },
        onError: (err: Error) =>
          toast.show({ title: 'Error', message: err.message || 'Failed to send', variant: 'error' }),
      },
    )
  }, [draft, send, applicationId, queryClient, toast])

  if (isLoading) {
    return (
      <Stack align="center" justify="center" gap={12} style={{ paddingVertical: 48 }}>
        <Spinner size="lg" />
        <Text style={{ color: colors.text[theme].secondary }}>Loading messages…</Text>
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack gap={6} style={{ padding: 24 }}>
        <Text weight="semibold" style={{ color: colors.text[theme].primary }}>
          Couldn't load messages
        </Text>
        <Text size="sm" style={{ color: colors.text[theme].secondary }}>
          {error.message || 'Please try again.'}
        </Text>
      </Stack>
    )
  }

  return (
    <Stack gap={12} style={{ padding: 16, flex: 1 }} testID="worker-messages">
      <ScrollView contentContainerStyle={{ paddingBottom: 12, gap: 10 }} showsVerticalScrollIndicator={false}>
        {messages.length === 0 ? (
          <Stack align="center" gap={6} style={{ paddingVertical: 40 }}>
            <Text size="sm" style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
              No messages yet. Send a note to the hiring team about your application.
            </Text>
          </Stack>
        ) : (
          messages.map((msg) => {
            const mine = msg.sender_role === 'applicant'
            return (
              <View
                key={msg.id}
                style={{
                  alignSelf: mine ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  backgroundColor: mine ? colors.primary[500] : colors.bg[theme].subtle,
                  borderRadius: 14,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                }}
              >
                <Text style={{ color: mine ? '#fff' : colors.text[theme].primary, fontSize: 14 }}>
                  {msg.body}
                </Text>
                <Text
                  style={{
                    color: mine ? 'rgba(255,255,255,0.7)' : colors.text[theme].tertiary,
                    fontSize: 11,
                    marginTop: 4,
                  }}
                >
                  {new Date(msg.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )
          })
        )}
      </ScrollView>

      <Stack gap={8}>
        <TextArea placeholder="Type a message…" value={draft} onChangeText={setDraft} />
        <Button
          color="primary"
          onPress={onSend}
          disabled={!draft.trim() || send.isPending}
          iconStart={Send}
        >
          {send.isPending ? 'Sending…' : 'Send'}
        </Button>
      </Stack>
    </Stack>
  )
}
