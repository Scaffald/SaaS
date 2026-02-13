import { Download } from 'lucide-react-native'
import { Button, Card, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import type { MockApplication } from '../../mock-data/ats-mock-data'
import { colors } from '@scaffald/ui/tokens'

interface ApplicationDetailsTabProps {
  application: MockApplication
}

export const ApplicationDetailsTab = ({ application }: ApplicationDetailsTabProps) => {
  const { theme } = useThemeContext()

  return (
    <Stack gap={16}>
      {/* Screening Answers */}
      <Card padding="md" style={{ backgroundColor: colors.bg[theme].subtle }}>
        <Text style={{ marginBottom: 12 }}>Screening Questions</Text>
        <Stack gap={12}>
          <Row justify="space-between">
            <Text style={{ opacity: 0.7 }}>Current Location</Text>
            <Text>{application.screeningAnswers.currentLocation}</Text>
          </Row>
          <Row justify="space-between">
            <Text style={{ opacity: 0.7 }}>Willing to Relocate</Text>
            <Text>{application.screeningAnswers.willingToRelocate ? 'Yes' : 'No'}</Text>
          </Row>
          <Row justify="space-between">
            <Text style={{ opacity: 0.7 }}>Years of Experience</Text>
            <Text>{application.screeningAnswers.yearsExperience}</Text>
          </Row>
          <Row justify="space-between">
            <Text style={{ opacity: 0.7 }}>Authorized to Work</Text>
            <Text>{application.screeningAnswers.isAuthorizedToWork ? 'Yes' : 'No'}</Text>
          </Row>
          <Row justify="space-between">
            <Text style={{ opacity: 0.7 }}>Earliest Start Date</Text>
            <Text>{application.screeningAnswers.earliestStartDate}</Text>
          </Row>
        </Stack>
      </Card>

      {/* Custom Questions */}
      {application.customAnswers.length > 0 && (
        <Card padding="md" style={{ backgroundColor: colors.bg[theme].subtle }}>
          <Text style={{ marginBottom: 12 }}>Custom Questions</Text>
          <Stack gap={16}>
            {application.customAnswers.map((qa, index) => (
              <Stack key={`qa-${qa.question}-${index}`} gap={8}>
                <Text>{qa.question}</Text>
                <Text style={{ opacity: 0.8 }}>{qa.answer}</Text>
                {index < application.customAnswers.length - 1 && (
                  <Stack
                    height={1}
                    style={{ backgroundColor: colors.border[theme].subtle }}
                    marginTop={8}
                  />
                )}
              </Stack>
            ))}
          </Stack>
        </Card>
      )}

      {/* Attachments */}
      <Card padding="md" style={{ backgroundColor: colors.bg[theme].subtle }}>
        <Text style={{ marginBottom: 12 }}>Attachments</Text>
        <Stack gap={8}>
          {application.attachments.resume && (
            <Row
              justify="space-between"
              align="center"
              padding="sm"
              style={{ backgroundColor: colors.bg[theme].muted }}
              borderRadius={12}
            >
              <Stack flex={1}>
                <Text>Resume</Text>
                <Text style={{ opacity: 0.7 }}>
                  {application.attachments.resume.filename} •{' '}
                  {(application.attachments.resume.size / 1024).toFixed(0)} KB
                </Text>
              </Stack>
              <Button size="sm" variant="outline" iconStart={Download}>
                Download
              </Button>
            </Row>
          )}
          {application.attachments.coverLetter && (
            <Row
              justify="space-between"
              align="center"
              padding="sm"
              style={{ backgroundColor: colors.bg[theme].muted }}
              borderRadius={12}
            >
              <Stack flex={1}>
                <Text>Cover Letter</Text>
                <Text style={{ opacity: 0.7 }}>
                  {application.attachments.coverLetter.filename} •{' '}
                  {(application.attachments.coverLetter.size / 1024).toFixed(0)} KB
                </Text>
              </Stack>
              <Button size="sm" variant="outline" iconStart={Download}>
                Download
              </Button>
            </Row>
          )}
          {application.attachments.portfolio && (
            <Row
              justify="space-between"
              align="center"
              padding="sm"
              style={{ backgroundColor: colors.bg[theme].muted }}
              borderRadius={12}
            >
              <Stack flex={1}>
                <Text>Portfolio</Text>
                <Text style={{ opacity: 0.7 }}>
                  {application.attachments.portfolio.filename} •{' '}
                  {(application.attachments.portfolio.size / 1024).toFixed(0)} KB
                </Text>
              </Stack>
              <Button size="sm" variant="outline" iconStart={Download}>
                Download
              </Button>
            </Row>
          )}
        </Stack>
      </Card>

      {/* Stage History */}
      <Card padding="md" style={{ backgroundColor: colors.bg[theme].subtle }}>
        <Text style={{ marginBottom: 12 }}>Application Timeline</Text>
        <Stack gap={12}>
          {application.stageHistory.map((history, index) => (
            <Row key={`history-${history.changedAt}-${index}`} gap={12}>
              <Stack
                width={3}
                style={{ backgroundColor: colors.fg[theme].active }}
                borderRadius={8}
              />
              <Stack flex={1} gap={4}>
                <Text style={{ textTransform: 'capitalize' }}>{history.toStage}</Text>
                <Text style={{ opacity: 0.7 }}>
                  {history.changedBy} •{' '}
                  {new Date(history.changedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
                {history.reason && (
                  <Text style={{ opacity: 0.8, marginTop: 4 }}>
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
