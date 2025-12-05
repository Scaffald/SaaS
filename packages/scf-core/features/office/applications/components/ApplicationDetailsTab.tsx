import { Download } from '@tamagui/lucide-icons'
import { Button, Card, Text, XStack, YStack } from '@unicornlove/ui'
import type { MockApplication } from '../../mock-data/ats-mock-data'

interface ApplicationDetailsTabProps {
  application: MockApplication
}

export const ApplicationDetailsTab = ({ application }: ApplicationDetailsTabProps) => {
  return (
    <YStack gap="$4">
      {/* Screening Answers */}
      <Card padding="$4" backgroundColor="$color2">
        <Text fontSize="$5" fontWeight="600" marginBottom="$3">
          Screening Questions
        </Text>
        <YStack gap="$3">
          <XStack justifyContent="space-between">
            <Text opacity={0.7}>Current Location</Text>
            <Text fontWeight="600">{application.screeningAnswers.currentLocation}</Text>
          </XStack>
          <XStack justifyContent="space-between">
            <Text opacity={0.7}>Willing to Relocate</Text>
            <Text fontWeight="600">
              {application.screeningAnswers.willingToRelocate ? 'Yes' : 'No'}
            </Text>
          </XStack>
          <XStack justifyContent="space-between">
            <Text opacity={0.7}>Years of Experience</Text>
            <Text fontWeight="600">{application.screeningAnswers.yearsExperience}</Text>
          </XStack>
          <XStack justifyContent="space-between">
            <Text opacity={0.7}>Authorized to Work</Text>
            <Text fontWeight="600">
              {application.screeningAnswers.isAuthorizedToWork ? 'Yes' : 'No'}
            </Text>
          </XStack>
          <XStack justifyContent="space-between">
            <Text opacity={0.7}>Earliest Start Date</Text>
            <Text fontWeight="600">{application.screeningAnswers.earliestStartDate}</Text>
          </XStack>
        </YStack>
      </Card>

      {/* Custom Questions */}
      {application.customAnswers.length > 0 && (
        <Card padding="$4" backgroundColor="$color2">
          <Text fontSize="$5" fontWeight="600" marginBottom="$3">
            Custom Questions
          </Text>
          <YStack gap="$4">
            {application.customAnswers.map((qa, index) => (
              <YStack key={`qa-${qa.question}-${index}`} gap="$2">
                <Text fontWeight="600" fontSize="$3">
                  {qa.question}
                </Text>
                <Text fontSize="$3" opacity={0.8}>
                  {qa.answer}
                </Text>
                {index < application.customAnswers.length - 1 && (
                  <YStack height={1} backgroundColor="$color5" marginTop="$2" />
                )}
              </YStack>
            ))}
          </YStack>
        </Card>
      )}

      {/* Attachments */}
      <Card padding="$4" backgroundColor="$color2">
        <Text fontSize="$5" fontWeight="600" marginBottom="$3">
          Attachments
        </Text>
        <YStack gap="$2">
          {application.attachments.resume && (
            <XStack
              justifyContent="space-between"
              alignItems="center"
              padding="$3"
              backgroundColor="$color3"
              borderRadius="$3"
            >
              <YStack flex={1}>
                <Text fontWeight="600">Resume</Text>
                <Text fontSize="$2" opacity={0.7}>
                  {application.attachments.resume.filename} •{' '}
                  {(application.attachments.resume.size / 1024).toFixed(0)} KB
                </Text>
              </YStack>
              <Button size="$3" icon={Download} chromeless>
                Download
              </Button>
            </XStack>
          )}
          {application.attachments.coverLetter && (
            <XStack
              justifyContent="space-between"
              alignItems="center"
              padding="$3"
              backgroundColor="$color3"
              borderRadius="$3"
            >
              <YStack flex={1}>
                <Text fontWeight="600">Cover Letter</Text>
                <Text fontSize="$2" opacity={0.7}>
                  {application.attachments.coverLetter.filename} •{' '}
                  {(application.attachments.coverLetter.size / 1024).toFixed(0)} KB
                </Text>
              </YStack>
              <Button size="$3" icon={Download} chromeless>
                Download
              </Button>
            </XStack>
          )}
          {application.attachments.portfolio && (
            <XStack
              justifyContent="space-between"
              alignItems="center"
              padding="$3"
              backgroundColor="$color3"
              borderRadius="$3"
            >
              <YStack flex={1}>
                <Text fontWeight="600">Portfolio</Text>
                <Text fontSize="$2" opacity={0.7}>
                  {application.attachments.portfolio.filename} •{' '}
                  {(application.attachments.portfolio.size / 1024).toFixed(0)} KB
                </Text>
              </YStack>
              <Button size="$3" icon={Download} chromeless>
                Download
              </Button>
            </XStack>
          )}
        </YStack>
      </Card>

      {/* Stage History */}
      <Card padding="$4" backgroundColor="$color2">
        <Text fontSize="$5" fontWeight="600" marginBottom="$3">
          Application Timeline
        </Text>
        <YStack gap="$3">
          {application.stageHistory.map((history, index) => (
            <XStack key={`history-${history.changedAt}-${index}`} gap="$3">
              <YStack width={3} backgroundColor="$blue9" borderRadius="$2" />
              <YStack flex={1} gap="$1">
                <Text fontWeight="600" textTransform="capitalize">
                  {history.toStage}
                </Text>
                <Text fontSize="$2" opacity={0.7}>
                  {history.changedBy} •{' '}
                  {new Date(history.changedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
                {history.reason && (
                  <Text fontSize="$2" opacity={0.8} marginTop="$1">
                    {history.reason}
                  </Text>
                )}
              </YStack>
            </XStack>
          ))}
        </YStack>
      </Card>
    </YStack>
  )
}
