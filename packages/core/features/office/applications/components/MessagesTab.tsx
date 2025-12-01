import { Send } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { Button, Card, Text, TextArea, XStack, YStack } from '@unicornlove/ui'
import type { MockApplication } from '../../mock-data/ats-mock-data'

interface MessagesTabProps {
  messages: MockApplication['messages']
  applicationId: string
}

export const MessagesTab = ({ messages, applicationId }: MessagesTabProps) => {
  const [newMessage, setNewMessage] = useState('')

  const handleSend = () => {
    console.log('Send message:', { applicationId, message: newMessage })
    // TODO: Call API to send message
    setNewMessage('')
  }

  return (
    <YStack gap="$4">
      {/* Message Thread */}
      <YStack gap="$3">
        {messages.length === 0 ? (
          <Card padding="$4" backgroundColor="$color2">
            <Text fontSize="$3" opacity={0.7} textAlign="center">
              No messages yet. Start the conversation below!
            </Text>
          </Card>
        ) : (
          messages.map((message) => (
            <Card
              key={message.id}
              padding="$4"
              backgroundColor={message.sender === 'recruiter' ? '$blue3' : '$color2'}
              alignSelf={message.sender === 'recruiter' ? 'flex-end' : 'flex-start'}
              maxWidth="80%"
            >
              <XStack justifyContent="space-between" alignItems="center" marginBottom="$2" gap="$3">
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
              </XStack>

              <Text fontSize="$3">{message.content}</Text>

              {!message.isRead && message.sender === 'candidate' && (
                <YStack marginTop="$2">
                  <Text fontSize="$2" color="$red10" fontWeight="600">
                    Unread
                  </Text>
                </YStack>
              )}
            </Card>
          ))
        )}
      </YStack>

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

        <Button onPress={handleSend} disabled={!newMessage.trim()} theme="info" icon={Send}>
          Send Message
        </Button>
      </Card>
    </YStack>
  )
}
