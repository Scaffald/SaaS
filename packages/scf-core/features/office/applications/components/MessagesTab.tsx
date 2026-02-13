import { Send } from 'lucide-react-native'
import { useState } from 'react'
import { Button, Card, Spinner, Text, TextArea, Row, Stack, useThemeContext } from '@scaffald/ui'
import {
  useApplicationMessages,
  useSendApplicationMessageMutation,
} from '@scf/core/utils/jobs-sdk-hooks'
import { useToast } from '@scaffald/ui'
import { useQueryClient } from '@tanstack/react-query'
import { colors } from '@scaffald/ui/tokens'

interface MessagesTabProps {
  applicationId: string
}

interface Message {
  id: string
  sender: 'recruiter' | 'candidate'
  senderName: string
  content: string
  sentAt: string
  isRead: boolean
}

export const MessagesTab = ({ applicationId }: MessagesTabProps) => {
  const { theme } = useThemeContext()
  const [newMessage, setNewMessage] = useState('')
  const toast = useToast()
  const queryClient = useQueryClient()

  // Fetch messages
  const { data: messagesData, isLoading, error } = useApplicationMessages(applicationId)

  // Send message mutation
  const sendMessageMutation = useSendApplicationMessageMutation({
    onSuccess: () => {
      setNewMessage('')
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: ['application', applicationId, 'messages'] })
    },
    onError: (error) => {
      toast.show({
        title: 'Error',
        message: error.message || 'Failed to send message',
        variant: 'error',
      })
    },
  })

  const handleSend = () => {
    if (!newMessage.trim()) return

    sendMessageMutation.mutate({
      applicationId,
      body: newMessage.trim(),
    })
  }

  // Transform API response to UI format
  const messages = messagesData?.data ?? []
  const transformedMessages: Message[] = messages.map((msg) => {
    // Use sender_role from SDK to determine sender type
    const sender = msg.sender_role === 'applicant' ? 'candidate' : 'recruiter'
    return {
      id: msg.id,
      sender: sender as 'candidate' | 'recruiter',
      senderName: msg.sender_name ?? 'Unknown',
      content: msg.body,
      sentAt: msg.created_at,
      isRead: false, // MVP: default to false, can implement read tracking later
    }
  })

  if (isLoading) {
    return (
      <Stack flex={1} align="center" justify="center" gap={12}>
        <Spinner size="lg" />
        <Text opacity={0.7}>Loading messages...</Text>
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack gap={12} padding="md">
        <Card padding="md" style={{ backgroundColor: colors.bg[theme].errorSubtle }}>
          <Text style={{ color: colors.text[theme].error }}>Error loading messages</Text>
          <Text style={{ color: colors.text[theme].error }} marginTop={8}>
            {error.message || 'Failed to load messages'}
          </Text>
        </Card>
      </Stack>
    )
  }

  return (
    <Stack gap={16}>
      {/* Message Thread */}
      <Stack gap={12}>
        {transformedMessages.length === 0 ? (
          <Card padding="md" style={{ backgroundColor: colors.bg[theme].subtle }}>
            <Text opacity={0.7} textAlign="center">
              No messages yet. Start the conversation below!
            </Text>
          </Card>
        ) : (
          transformedMessages.map((message) => (
            <Card
              key={message.id}
              padding="md"
              style={{
                backgroundColor:
                  message.sender === 'recruiter' ? colors.bg[theme].info : colors.bg[theme].subtle,
              }}
              alignSelf={message.sender === 'recruiter' ? 'flex-end' : 'flex-start'}
              maxWidth="80%"
            >
              <Row justify="space-between" align="center" marginBottom={8} gap={12}>
                <Text>{message.senderName}</Text>
                <Text opacity={0.7}>
                  {new Date(message.sentAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </Row>

              <Text>{message.content}</Text>

              {!message.isRead && message.sender === 'candidate' && (
                <Stack marginTop={8}>
                  <Text style={{ color: colors.text[theme].error }}>Unread</Text>
                </Stack>
              )}
            </Card>
          ))
        )}
      </Stack>

      {/* Send Message */}
      <Card padding="md" style={{ backgroundColor: colors.bg[theme].subtle }}>
        <Text marginBottom={12}>Send Message</Text>

        <TextArea
          placeholder="Type your message..."
          value={newMessage}
          onChangeText={setNewMessage}
          marginBottom={12}
        />

        <Button
          onPress={handleSend}
          disabled={!newMessage.trim() || sendMessageMutation.isPending}
          theme="info"
          iconStart={Send}
        >
          {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
        </Button>
      </Card>
    </Stack>
  )
}
