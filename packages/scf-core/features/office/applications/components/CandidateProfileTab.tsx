import { Card, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import type { MockApplication } from '../../mock-data/ats-mock-data'
import { colors } from '@scaffald/ui/tokens'

interface CandidateProfileTabProps {
  candidate: MockApplication['candidate']
  contactInfo?: {
    email?: string | null
    phone?: string | null
    location?: string | null
    employment_city?: string | null
    employment_state?: string | null
    employment_zip?: string | null
  }
  isContactLocked?: boolean
  lockReason?: string
}

export const CandidateProfileTab = ({
  candidate,
  contactInfo,
  isContactLocked = false,
  lockReason,
}: CandidateProfileTabProps) => {
  const { theme } = useThemeContext()
  const resolvedEmail = contactInfo?.email ?? candidate.email
  const resolvedPhone = contactInfo?.phone ?? candidate.phone
  const contactLocationFromProfile = [contactInfo?.employment_city, contactInfo?.employment_state]
    .filter(Boolean)
    .join(', ')
  const resolvedLocation =
    contactInfo?.location ?? (contactLocationFromProfile || candidate.location)

  const lockedMessage =
    lockReason ?? 'Pay the upfront success fee to unlock email and phone details.'

  return (
    <Stack gap={16}>
      {/* Contact Info */}
      <Card padding="md" style={{ backgroundColor: colors.bg[theme].subtle }}>
        <Text marginBottom={12}>Contact Information</Text>
        {isContactLocked ? (
          <Stack gap={8}>
            <Text style={{ color: theme === "light" ? colors.yellow[700] : colors.yellow[300] }}>Contact details locked</Text>
            <Text style={{ color: colors.text[theme].secondary }}>{lockedMessage}</Text>
          </Stack>
        ) : (
          <Stack gap={8}>
            <Row justify="space-between">
              <Text opacity={0.7}>Email</Text>
              <Text>{resolvedEmail}</Text>
            </Row>
            <Row justify="space-between">
              <Text opacity={0.7}>Phone</Text>
              <Text>{resolvedPhone}</Text>
            </Row>
            <Row justify="space-between">
              <Text opacity={0.7}>Location</Text>
              <Text>{resolvedLocation}</Text>
            </Row>
          </Stack>
        )}
      </Card>

      {/* Skills */}
      <Card padding="md" style={{ backgroundColor: colors.bg[theme].subtle }}>
        <Text marginBottom={12}>Skills</Text>
        <Stack gap={12}>
          {candidate.skills.map((skill, index) => (
            <Row key={`skill-${skill.name}-${index}`} justify="space-between" align="center">
              <Text>{skill.name}</Text>
              <Stack
                style={{
                  backgroundColor:
                    skill.proficiency === 'expert'
                      ? theme === "light" ? colors.green[50] : colors.green[900]Subtle
                      : skill.proficiency === 'advanced'
                        ? theme === "light" ? colors.blue[50] : colors.blue[900]
                        : skill.proficiency === 'intermediate'
                          ? theme === "light" ? colors.yellow[50] : colors.yellow[900]Subtle
                          : colors.bg[theme].muted,
                }}
                paddingHorizontal={12}
                paddingVertical={4}
                borderRadius={8}
              >
                <Text
                  style={{
                    color:
                      skill.proficiency === 'expert'
                        ? theme === "light" ? colors.green[700] : colors.green[300]
                        : skill.proficiency === 'advanced'
                          ? theme === "light" ? colors.blue[700] : colors.blue[300]
                          : skill.proficiency === 'intermediate'
                            ? theme === "light" ? colors.yellow[700] : colors.yellow[300]
                            : colors.text[theme].tertiary,
                  }}
                  textTransform="capitalize"
                >
                  {skill.proficiency}
                </Text>
              </Stack>
            </Row>
          ))}
        </Stack>
      </Card>

      {/* Certifications */}
      <Card padding="md" style={{ backgroundColor: colors.bg[theme].subtle }}>
        <Text marginBottom={12}>Certifications</Text>
        <Stack gap={12}>
          {candidate.certifications.map((cert, index) => (
            <Stack key={`cert-${cert.name}-${index}`} gap={4}>
              <Text>{cert.name}</Text>
              <Row gap={8}>
                {cert.state && <Text opacity={0.7}>State: {cert.state}</Text>}
                {cert.issueDate && (
                  <Text opacity={0.7}>Issued: {new Date(cert.issueDate).toLocaleDateString()}</Text>
                )}
              </Row>
            </Stack>
          ))}
        </Stack>
      </Card>

      {/* Experience */}
      <Card padding="md" style={{ backgroundColor: colors.bg[theme].subtle }}>
        <Text marginBottom={12}>Work Experience</Text>
        <Stack gap={16}>
          {candidate.experience.map((exp, index) => (
            <Stack key={`exp-${exp.company}-${exp.title}-${index}`} gap={8}>
              <Text>{exp.title}</Text>
              <Text opacity={0.8}>{exp.company}</Text>
              <Text opacity={0.6}>{exp.duration}</Text>
              <Text marginTop={4}>{exp.description}</Text>
              {index < candidate.experience.length - 1 && (
                <Stack
                  height={1}
                  style={{ backgroundColor: colors.bg[theme].inactive }}
                  marginTop={8}
                />
              )}
            </Stack>
          ))}
        </Stack>
      </Card>
    </Stack>
  )
}
