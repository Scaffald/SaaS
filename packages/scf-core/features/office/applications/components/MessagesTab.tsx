import { Send } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { Button, Card, Spinner, Text, TextArea, Row, Stack } from '@unicornlove/beyond-ui'
import { api } from '@scf/core/utils/api'
import { useToast } from '@unicornlove/beyond-ui'

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
  const utils = api.useUtils()

  // Fetch messages
  const { data: messagesData, isLoading, error } = api.applications.getMessages.useQuery({
    applicationId,
  })

  // Send message mutation
  const sendMessageMutation = api.applications.sendMessage.useMutation({
    onSuccess: () => {
      setNewMessage('')
      // Invalidate and refetch messages
      utils.applications.getMessages.invalidate({ applicationId })
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
  const transformedMessages: Message[] = messagesData
    ? messagesData.messages.map((msg) => {
        // Determine if sender is recruiter or candidate
        const isCandidate = messagesData.application_user_id === msg.author_user_id
        return {
          id: msg.id,
          sender: isCandidate ? ('candidate' as const) : ('recruiter' as const),
          senderName: msg.author_name,
          content: msg.body,
          sentAt: msg.created_at,
          isRead: false, // MVP: default to false, can implement read tracking later
        }
      })
    : []

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
