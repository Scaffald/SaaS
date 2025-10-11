import { useState } from 'react'
import { ScrollView } from 'react-native'
import { Sheet, XStack, YStack, Text, Button, Avatar, Tabs } from 'tamagui'
import { X } from '@tamagui/lucide-icons'
import type { MockApplication } from '../../mock-data/ats-mock-data'
import { CandidateProfileTab } from './CandidateProfileTab'
import { ApplicationDetailsTab } from './ApplicationDetailsTab'
import { NotesTab } from './NotesTab'
import { MessagesTab } from './MessagesTab'

interface CandidateDetailModalProps {
  application: MockApplication | null
  open: boolean
  onClose: () => void
}

export const CandidateDetailModal = ({ application, open, onClose }: CandidateDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'application' | 'notes' | 'messages'>(
    'profile'
  )

  if (!application) return null

  const scoreColor =
    application.score >= 80 ? '$green10' : application.score >= 60 ? '$blue10' : '$red10'
  const scoreBg = application.score >= 80 ? '$green3' : application.score >= 60 ? '$blue3' : '$red3'

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={(isOpen: boolean) => {
        if (!isOpen) onClose()
      }}
      dismissOnSnapToBottom
      snapPointsMode="fit"
    >
      <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
      <Sheet.Frame p="$4" bg="$background">
        <Sheet.Handle />

        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap="$4" pb="$8">
            {/* Header */}
            <XStack justify="space-between" items="center">
              <XStack gap="$3" items="center" flex={1}>
                <Avatar circular size="$6">
                  <Avatar.Image src={application.candidate.photo} />
                  <Avatar.Fallback bg="$blue9">
                    <Text color="white" fontWeight="600" fontSize="$6">
                      {application.candidate.name.charAt(0)}
                    </Text>
                  </Avatar.Fallback>
                </Avatar>

                <YStack flex={1}>
                  <Text fontSize="$6" fontWeight="700">
                    {application.candidate.name}
                  </Text>
                  <Text fontSize="$4" opacity={0.7}>
                    {application.candidate.title}
                  </Text>
                  <Text fontSize="$2" opacity={0.6} mt="$1">
                    {application.candidate.location}
                  </Text>
                </YStack>
              </XStack>

              <Button size="$3" circular icon={X} chromeless onPress={onClose} />
            </XStack>

            {/* Score Badge */}
            <YStack bg={scoreBg} px="$4" py="$3" rounded="$4" items="center">
              <Text fontSize="$8" fontWeight="700" color={scoreColor}>
                {application.score}
              </Text>
              <Text fontSize="$3" fontWeight="600" opacity={0.8}>
                Application Score
              </Text>
            </YStack>

            {/* Quick Actions */}
            <XStack gap="$2">
              <Button theme="green" flex={1} size="$4">
                Advance to Interview
              </Button>
              <Button theme="red" flex={1} size="$4">
                Reject
              </Button>
            </XStack>
            <Button flex={1} size="$4">
              Send Message
            </Button>

            {/* Application Meta */}
            <XStack gap="$4" flexWrap="wrap">
              <YStack flex={1} width={150}>
                <Text fontSize="$2" opacity={0.6}>
                  Applied
                </Text>
                <Text fontSize="$3" fontWeight="600">
                  {new Date(application.appliedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </YStack>
              <YStack flex={1} width={150}>
                <Text fontSize="$2" opacity={0.6}>
                  Job
                </Text>
                <Text fontSize="$3" fontWeight="600">
                  {application.job.title}
                </Text>
              </YStack>
              <YStack flex={1} width={150}>
                <Text fontSize="$2" opacity={0.6}>
                  Experience
                </Text>
                <Text fontSize="$3" fontWeight="600">
                  {application.candidate.yearsExperience} years
                </Text>
              </YStack>
            </XStack>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as typeof activeTab)}
              orientation="horizontal"
              flexDirection="column"
              flex={1}
            >
              <Tabs.List gap="$2" bg="$color2" p="$1" rounded="$3">
                <Tabs.Tab value="profile" flex={1}>
                  <Text fontSize="$3" fontWeight="600">
                    Profile
                  </Text>
                </Tabs.Tab>
                <Tabs.Tab value="application" flex={1}>
                  <Text fontSize="$3" fontWeight="600">
                    Application
                  </Text>
                </Tabs.Tab>
                <Tabs.Tab value="notes" flex={1}>
                  <Text fontSize="$3" fontWeight="600">
                    Notes ({application.notes.length})
                  </Text>
                </Tabs.Tab>
                <Tabs.Tab value="messages" flex={1}>
                  <Text fontSize="$3" fontWeight="600">
                    Messages ({application.messages.length})
                  </Text>
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Content value="profile" pt="$4">
                <CandidateProfileTab candidate={application.candidate} />
              </Tabs.Content>

              <Tabs.Content value="application" pt="$4">
                <ApplicationDetailsTab application={application} />
              </Tabs.Content>

              <Tabs.Content value="notes" pt="$4">
                <NotesTab notes={application.notes} applicationId={application.id} />
              </Tabs.Content>

              <Tabs.Content value="messages" pt="$4">
                <MessagesTab messages={application.messages} applicationId={application.id} />
              </Tabs.Content>
            </Tabs>
          </YStack>
        </ScrollView>
      </Sheet.Frame>
    </Sheet>
  )
}
