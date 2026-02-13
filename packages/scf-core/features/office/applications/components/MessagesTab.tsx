import { Send } from 'lucide-react-native'
import { useState } from 'react'
import { Button, Card, Spinner, Text, TextArea, Row, Stack } from '@unicornlove/beyond-ui'
import {
  useApplicationMessages,
  useSendApplicationMessageMutation,
} from '@scf/core/utils/jobs-sdk-hooks'
import { useToast } from '@unicornlove/beyond-ui'
import { useQueryClient } from '@tanstack/react-query'

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
      <Stack gap={12} padding={16}>
        <Card padding={16} backgroundColor="$red3">
          <Text color="$red10">Error loading messages</Text>
          <Text color="$red10" marginTop={8}>
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
          <Card padding={16} backgroundColor="$color2">
            <Text opacity={0.7} textAlign="center">
              No messages yet. Start the conversation below!
            </Text>
          </Card>
        ) : (
          transformedMessages.map((message) => (
            <Card
              key={message.id}
              padding={16}
              backgroundColor={message.sender === 'recruiter' ? '$blue3' : '$color2'}
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
                  <Text color="$red10">Unread</Text>
                </Stack>
              )}
            </Card>
          ))
        )}
      </Stack>

      {/* Send Message */}
      <Card padding={16} backgroundColor="$color2">
        <Text marginBottom={12}>Send Message</Text>

        <TextArea
          placeholder="Type your message..."
          value={newMessage}
          onChangeText={setNewMessage}
          numberOfLines={4}
          marginBottom={12}
        />

        <Button
          onPress={handleSend}
          disabled={!newMessage.trim() || sendMessageMutation.isPending}
          theme="info"
          icon={Send}
        >
          {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
        </Button>
      </Card>
    </Stack>
  )
}
