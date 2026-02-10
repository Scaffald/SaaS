import { Send } from 'lucide-react-native'
import { useState } from 'react'
import { Button, Card, Spinner, Text, TextArea, Row, Stack } from '@unicornlove/beyond-ui'
import { useApplicationMessages, useSendApplicationMessageMutation } from '@scf/core/utils/jobs-sdk-hooks'
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
      <Stack flex={1} alignItems="center" justifyContent="center" gap="$3">
        <Spinner size="large" />
        <Text fontSize="$3" opacity={0.7}>
          Loading messages...
        </Text>
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack gap="$3" padding="$4">
        <Card padding="$4" backgroundColor="$red3">
          <Text fontSize="$3" color="$red10" fontWeight="600">
            Error loading messages
          </Text>
          <Text fontSize="$2" color="$red10" marginTop="$2">
            {error.message || 'Failed to load messages'}
          </Text>
        </Card>
      </Stack>
    )
  }

  return (
    <Stack gap="$4">
      {/* Message Thread */}
      <Stack gap="$3">
        {transformedMessages.length === 0 ? (
          <Card padding="$4" backgroundColor="$color2">
            <Text fontSize="$3" opacity={0.7} textAlign="center">
              No messages yet. Start the conversation below!
            </Text>
          </Card>
        ) : (
          transformedMessages.map((message) => (
            <Card
              key={message.id}
              padding="$4"
              backgroundColor={message.sender === 'recruiter' ? '$blue3' : '$color2'}
              alignSelf={message.sender === 'recruiter' ? 'flex-end' : 'flex-start'}
              maxWidth="80%"
            >
              <Row justifyContent="space-between" alignItems="center" marginBottom="$2" gap="$3">
                <Text fontWeight="600" fontSize="$3">
                  {message.senderName}
                </Text>
                <Text fontSize="$1" opacity={0.7}>
                  {new Date(message.sentAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </Row>

              <Text fontSize="$3">{message.content}</Text>

              {!message.isRead && message.sender === 'candidate' && (
                <Stack marginTop="$2">
                  <Text fontSize="$2" color="$red10" fontWeight="600">
                    Unread
                  </Text>
                </Stack>
              )}
            </Card>
          ))
        )}
      </Stack>

      {/* Send Message */}
      <Card padding="$4" backgroundColor="$color2">
        <Text fontSize="$5" fontWeight="600" marginBottom="$3">
          Send Message
        </Text>

        <TextArea
          placeholder="Type your message..."
          value={newMessage}
          onChangeText={setNewMessage}
          numberOfLines={4}
          marginBottom="$3"
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
