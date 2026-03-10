import { Send } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { Button, Card, Spinner, Text, TextArea, Row, Stack, useThemeContext } from '@scaffald/ui'
import {
  useApplicationMessages,
  useSendApplicationMessageMutation,
} from '@scf/core/utils/jobs-sdk-hooks'
import { useToast } from '@scaffald/ui'
import { useQueryClient } from '@tanstack/react-query'
import { colors } from '@scaffald/ui/tokens'
import type { ApplicationStatus } from '../../mock-data/ats-mock-data'
import { MessageTemplateSelector } from './MessageTemplateSelector'
import { MessageTemplatesManager } from './MessageTemplatesManager'
import type { MessageTemplate } from './message-templates'
import { applyTemplateVariables } from './message-templates'
import { useMessageTemplates } from '../hooks/useMessageTemplates'

interface MessagesTabProps {
  applicationId: string
  /** Current pipeline stage for template filtering */
  applicationStatus?: ApplicationStatus
  /** Candidate name for template variable substitution */
  candidateName?: string
  /** Job title for template variable substitution */
  jobTitle?: string
  /** Company name for template variable substitution */
  companyName?: string
}

interface Message {
  id: string
  sender: 'recruiter' | 'candidate'
  senderName: string
  content: string
  sentAt: string
  isRead: boolean
}

export const MessagesTab = ({
  applicationId,
  applicationStatus = 'new',
  candidateName = '',
  jobTitle = '',
  companyName = '',
}: MessagesTabProps) => {
  const { theme } = useThemeContext()
  const [newMessage, setNewMessage] = useState('')
  const [showTemplateManager, setShowTemplateManager] = useState(false)
  const toast = useToast()
  const queryClient = useQueryClient()

  // Template management
  const {
    templates: allTemplates,
    getTemplatesForStage,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    incrementUsage,
  } = useMessageTemplates()

  const stageTemplates = getTemplatesForStage(applicationStatus)

  const handleTemplateSelect = useCallback(
    (template: MessageTemplate) => {
      const filled = applyTemplateVariables(template.body, {
        '{{candidateName}}': candidateName || 'Candidate',
        '{{jobTitle}}': jobTitle || 'Position',
        '{{companyName}}': companyName || 'Company',
        '{{recruiterName}}': 'Recruiter',
        '{{stageName}}': applicationStatus,
      })
      setNewMessage(filled)
      incrementUsage(template.id)
    },
    [candidateName, jobTitle, companyName, applicationStatus, incrementUsage]
  )

  // Fetch messages
  const { data: messagesData, isLoading, error } = useApplicationMessages(applicationId)

  // Send message mutation
  const sendMessageMutation = useSendApplicationMessageMutation()

  const handleSend = () => {
    if (!newMessage.trim()) return

    sendMessageMutation.mutate(
      {
        applicationId,
        body: newMessage.trim(),
      },
      {
        onSuccess: () => {
          setNewMessage('')
          queryClient.invalidateQueries({ queryKey: ['application', applicationId, 'messages'] })
        },
        onError: (err: Error) => {
          toast.show({
            title: 'Error',
            message: err.message || 'Failed to send message',
            variant: 'error',
          })
        },
      }
    )
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
        <Text style={{ opacity: 0.7 }}>Loading messages...</Text>
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack gap={12} padding="md">
        <Card padding="md" style={{ backgroundColor: theme === "light" ? colors.error[50] : colors.error[900] }}>
          <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>Error loading messages</Text>
          <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300], marginTop: 8 }}>
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
            <Text style={{ opacity: 0.7, textAlign: 'center' }}>
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
                  message.sender === 'recruiter' ? theme === "light" ? colors.blue[50] : colors.blue[900] : colors.bg[theme].subtle,
                alignSelf: message.sender === 'recruiter' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
              }}
            >
              <Row justify="space-between" align="center" gap={12} style={{ marginBottom: 8 }}>
                <Text>{message.senderName}</Text>
                <Text style={{ opacity: 0.7 }}>
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
                <Stack style={{ marginTop: 8 }}>
                  <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>Unread</Text>
                </Stack>
              )}
            </Card>
          ))
        )}
      </Stack>

      {/* Template Manager (full screen overlay) */}
      {showTemplateManager && (
        <Card padding="md" style={{ backgroundColor: colors.bg[theme].subtle, minHeight: 400 }}>
          <MessageTemplatesManager
            templates={allTemplates}
            onCreate={createTemplate}
            onUpdate={updateTemplate}
            onDelete={deleteTemplate}
            onClose={() => setShowTemplateManager(false)}
          />
        </Card>
      )}

      {/* Send Message */}
      <Card padding="md" style={{ backgroundColor: colors.bg[theme].subtle }}>
        <Text style={{ marginBottom: 12 }}>Send Message</Text>

        {/* Template Selector */}
        <Stack style={{ marginBottom: 12 }}>
          <MessageTemplateSelector
            stage={applicationStatus}
            templates={stageTemplates}
            onSelect={handleTemplateSelect}
            onManageTemplates={() => setShowTemplateManager(true)}
          />
        </Stack>

        <TextArea
          placeholder="Type your message..."
          value={newMessage}
          onChangeText={setNewMessage}
          style={{ marginBottom: 12 }}
        />

        <Button
          color="primary"
          onPress={handleSend}
          disabled={!newMessage.trim() || sendMessageMutation.isPending}
          iconStart={Send}
        >
          {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
        </Button>
      </Card>
    </Stack>
  )
}
