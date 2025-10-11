import { useMemo, useState } from 'react'
import { ScrollView } from 'react-native'
import { XStack, YStack, Text, Card, Avatar, type GetThemeValueForKey } from 'tamagui'
import type { MockApplication, ApplicationStatus } from '../../mock-data/ats-mock-data'
import { CandidateDetailModal } from './CandidateDetailModal'

const STATUSES: ApplicationStatus[] = ['new', 'screen', 'interview', 'offer', 'hired', 'rejected']

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: 'New Applications',
  screen: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
}

const STATUS_COLORS: Record<ApplicationStatus, GetThemeValueForKey<'backgroundColor'>> = {
  new: '$blue9',
  screen: '$yellow9',
  interview: '$red9',
  offer: '$green9',
  hired: '$green11',
  rejected: '$red9',
}

interface ApplicationsKanbanBoardProps {
  applications: MockApplication[]
}

export const ApplicationsKanbanBoard = ({ applications }: ApplicationsKanbanBoardProps) => {
  const [selectedApplication, setSelectedApplication] = useState<MockApplication | null>(null)

  // Group applications by status
  const groupedApplications = useMemo(() => {
    return STATUSES.reduce(
      (acc, status) => {
        acc[status] = applications.filter((app) => app.status === status)
        return acc
      },
      {} as Record<ApplicationStatus, MockApplication[]>
    )
  }, [applications])

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <XStack gap="$3" pb="$4">
          {STATUSES.map((status) => (
            <StatusColumn
              key={status}
              label={STATUS_LABELS[status]}
              color={STATUS_COLORS[status]}
              applications={groupedApplications[status]}
              onSelectApplication={setSelectedApplication}
            />
          ))}
        </XStack>
      </ScrollView>

      <CandidateDetailModal
        application={selectedApplication}
        open={!!selectedApplication}
        onClose={() => setSelectedApplication(null)}
      />
    </>
  )
}

interface StatusColumnProps {
  label: string
  color: GetThemeValueForKey<'backgroundColor'>
  applications: MockApplication[]
  onSelectApplication: (application: MockApplication) => void
}

const StatusColumn = ({ label, color, applications, onSelectApplication }: StatusColumnProps) => {
  return (
    <YStack width={300} bg="$color2" rounded="$4" p="$3">
      {/* Column Header */}
      <XStack justify="space-between" items="center" mb="$3">
        <XStack gap="$2" items="center">
          <YStack width={8} height={8} rounded="$10" bg={color} />
          <Text fontWeight="600" fontSize="$4">
            {label}
          </Text>
        </XStack>
        <YStack bg="$color5" px="$2" py="$1" rounded="$2">
          <Text fontSize="$2">{applications.length}</Text>
        </YStack>
      </XStack>

      {/* Application Cards */}
      <YStack gap="$2" flex={1}>
        {applications.length === 0 ? (
          <Card p="$4" bg="gray">
            <Text fontSize="$2" text="center">
              No applications
            </Text>
          </Card>
        ) : (
          applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onPress={() => onSelectApplication(app)}
            />
          ))
        )}
      </YStack>
    </YStack>
  )
}

interface ApplicationCardProps {
  application: MockApplication
  onPress: () => void
}

const ApplicationCard = ({ application, onPress }: ApplicationCardProps) => {
  const appliedDate = new Date(application.appliedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  const scoreColor =
    application.score >= 80 ? '$green10' : application.score >= 60 ? '$blue10' : '$red10'
  const scoreBg = application.score >= 80 ? '$green3' : application.score >= 60 ? '$blue3' : '$red3'

  return (
    <Card
      p="$3"
      bg="$background"
      hoverStyle={{
        bg: 'gray',
      }}
      pressStyle={{ scale: 0.98 }}
      animation="quick"
      elevate
      onPress={onPress}
    >
      {/* Candidate Info */}
      <XStack gap="$3" items="flex-start" mb="$2">
        <Avatar circular size="$4">
          <Avatar.Image src={application.candidate.photo} />
          <Avatar.Fallback bg="$blue9">
            <Text color="white" fontWeight="600">
              {application.candidate.name.charAt(0)}
            </Text>
          </Avatar.Fallback>
        </Avatar>

        <YStack flex={1}>
          <Text fontWeight="600" fontSize="$4" numberOfLines={1}>
            {application.candidate.name}
          </Text>
          <Text fontSize="$2" numberOfLines={1} opacity={0.6}>
            {application.candidate.title}
          </Text>
        </YStack>
      </XStack>

      {/* Score and Date */}
      <XStack justify="space-between" items="center" mt="$2">
        <YStack bg={scoreBg} px="$2" py="$1" rounded="$2">
          <Text fontSize="$2" fontWeight="600" color={scoreColor}>
            Score: {application.score}
          </Text>
        </YStack>

        <Text fontSize="$1" opacity={0.6}>
          {appliedDate}
        </Text>
      </XStack>

      {/* Job Info */}
      <Text fontSize="$1" mt="$2" numberOfLines={1} opacity={0.6}>
        {application.job.title}
      </Text>
    </Card>
  )
}
