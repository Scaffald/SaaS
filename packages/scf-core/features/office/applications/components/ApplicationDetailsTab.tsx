import { Download } from 'lucide-react-native'
import { Button, Card, Text, Row, Stack } from '@unicornlove/beyond-ui'
import type { MockApplication } from '../../mock-data/ats-mock-data'

interface ApplicationDetailsTabProps {
  application: MockApplication
}

export const ApplicationDetailsTab = ({ application }: ApplicationDetailsTabProps) => {
  return (
    <Stack gap="$4">
      {/* Screening Answers */}
      <Card padding="$4" backgroundColor="$color2">
        <Text fontSize="$5" fontWeight="600" marginBottom="$3">
          Screening Questions
        </Text>
        <Stack gap="$3">
          <Row justifyContent="space-between">
            <Text opacity={0.7}>Current Location</Text>
            <Text fontWeight="600">{application.screeningAnswers.currentLocation}</Text>
          </Row>
          <Row justifyContent="space-between">
            <Text opacity={0.7}>Willing to Relocate</Text>
            <Text fontWeight="600">
              {application.screeningAnswers.willingToRelocate ? 'Yes' : 'No'}
            </Text>
          </Row>
          <Row justifyContent="space-between">
            <Text opacity={0.7}>Years of Experience</Text>
            <Text fontWeight="600">{application.screeningAnswers.yearsExperience}</Text>
          </Row>
          <Row justifyContent="space-between">
            <Text opacity={0.7}>Authorized to Work</Text>
            <Text fontWeight="600">
              {application.screeningAnswers.isAuthorizedToWork ? 'Yes' : 'No'}
            </Text>
          </Row>
          <Row justifyContent="space-between">
            <Text opacity={0.7}>Earliest Start Date</Text>
            <Text fontWeight="600">{application.screeningAnswers.earliestStartDate}</Text>
          </Row>
        </Stack>
      </Card>

      {/* Custom Questions */}
      {application.customAnswers.length > 0 && (
        <Card padding="$4" backgroundColor="$color2">
          <Text fontSize="$5" fontWeight="600" marginBottom="$3">
            Custom Questions
          </Text>
          <Stack gap="$4">
            {application.customAnswers.map((qa, index) => (
              <Stack key={`qa-${qa.question}-${index}`} gap="$2">
                <Text fontWeight="600" fontSize="$3">
                  {qa.question}
                </Text>
                <Text fontSize="$3" opacity={0.8}>
                  {qa.answer}
                </Text>
                {index < application.customAnswers.length - 1 && (
                  <Stack height={1} backgroundColor="$color5" marginTop="$2" />
                )}
              </Stack>
            ))}
          </Stack>
        </Card>
      )}

      {/* Attachments */}
      <Card padding="$4" backgroundColor="$color2">
        <Text fontSize="$5" fontWeight="600" marginBottom="$3">
          Attachments
        </Text>
        <Stack gap="$2">
          {application.attachments.resume && (
            <Row
              justifyContent="space-between"
              alignItems="center"
              padding="$3"
              backgroundColor="$color3"
              borderRadius="$3"
            >
              <Stack flex={1}>
                <Text fontWeight="600">Resume</Text>
                <Text fontSize="$2" opacity={0.7}>
                  {application.attachments.resume.filename} •{' '}
                  {(application.attachments.resume.size / 1024).toFixed(0)} KB
                </Text>
              </Stack>
              <Button size="$3" icon={Download} chromeless>
                Download
              </Button>
            </Row>
          )}
          {application.attachments.coverLetter && (
            <Row
              justifyContent="space-between"
              alignItems="center"
              padding="$3"
              backgroundColor="$color3"
              borderRadius="$3"
            >
              <Stack flex={1}>
                <Text fontWeight="600">Cover Letter</Text>
                <Text fontSize="$2" opacity={0.7}>
                  {application.attachments.coverLetter.filename} •{' '}
                  {(application.attachments.coverLetter.size / 1024).toFixed(0)} KB
                </Text>
              </Stack>
              <Button size="$3" icon={Download} chromeless>
                Download
              </Button>
            </Row>
          )}
          {application.attachments.portfolio && (
            <Row
              justifyContent="space-between"
              alignItems="center"
              padding="$3"
              backgroundColor="$color3"
              borderRadius="$3"
            >
              <Stack flex={1}>
                <Text fontWeight="600">Portfolio</Text>
                <Text fontSize="$2" opacity={0.7}>
                  {application.attachments.portfolio.filename} •{' '}
                  {(application.attachments.portfolio.size / 1024).toFixed(0)} KB
                </Text>
              </Stack>
              <Button size="$3" icon={Download} chromeless>
                Download
              </Button>
            </Row>
          )}
        </Stack>
      </Card>

      {/* Stage History */}
      <Card padding="$4" backgroundColor="$color2">
        <Text fontSize="$5" fontWeight="600" marginBottom="$3">
          Application Timeline
        </Text>
        <Stack gap="$3">
          {application.stageHistory.map((history, index) => (
            <Row key={`history-${history.changedAt}-${index}`} gap="$3">
              <Stack width={3} backgroundColor="$blue9" borderRadius="$2" />
              <Stack flex={1} gap="$1">
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
              </Stack>
            </Row>
          ))}
        </Stack>
      </Card>
    </Stack>
  )
}
