import { Card, Text, Row, Stack } from '@unicornlove/beyond-ui'
import type { MockApplication } from '../../mock-data/ats-mock-data'

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
    <Stack gap="$4">
      {/* Contact Info */}
      <Card padding="$4" backgroundColor="$color2">
        <Text fontSize="$5" fontWeight="600" marginBottom="$3">
          Contact Information
        </Text>
        {isContactLocked ? (
          <Stack gap="$2">
            <Text color="$orange11" fontWeight="600">
              Contact details locked
            </Text>
            <Text color="$color11">{lockedMessage}</Text>
          </Stack>
        ) : (
          <Stack gap="$2">
            <Row justifyContent="space-between">
              <Text opacity={0.7}>Email</Text>
              <Text fontWeight="600">{resolvedEmail}</Text>
            </Row>
            <Row justifyContent="space-between">
              <Text opacity={0.7}>Phone</Text>
              <Text fontWeight="600">{resolvedPhone}</Text>
            </Row>
            <Row justifyContent="space-between">
              <Text opacity={0.7}>Location</Text>
              <Text fontWeight="600">{resolvedLocation}</Text>
            </Row>
          </Stack>
        )}
      </Card>

      {/* Skills */}
      <Card padding="$4" backgroundColor="$color2">
        <Text fontSize="$5" fontWeight="600" marginBottom="$3">
          Skills
        </Text>
        <Stack gap="$3">
          {candidate.skills.map((skill, index) => (
            <Row
              key={`skill-${skill.name}-${index}`}
              justifyContent="space-between"
              alignItems="center"
            >
              <Text fontWeight="600">{skill.name}</Text>
              <Stack
                backgroundColor={
                  skill.proficiency === 'expert'
                    ? '$green3'
                    : skill.proficiency === 'advanced'
                      ? '$blue3'
                      : skill.proficiency === 'intermediate'
                        ? '$yellow3'
                        : '$color3'
                }
                paddingHorizontal="$3"
                paddingVertical="$1"
                borderRadius="$2"
              >
                <Text
                  fontSize="$2"
                  fontWeight="600"
                  color={
                    skill.proficiency === 'expert'
                      ? '$green10'
                      : skill.proficiency === 'advanced'
                        ? '$blue10'
                        : skill.proficiency === 'intermediate'
                          ? '$yellow10'
                          : '$color10'
                  }
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
      <Card padding="$4" backgroundColor="$color2">
        <Text fontSize="$5" fontWeight="600" marginBottom="$3">
          Certifications
        </Text>
        <Stack gap="$3">
          {candidate.certifications.map((cert, index) => (
            <Stack key={`cert-${cert.name}-${index}`} gap="$1">
              <Text fontWeight="600">{cert.name}</Text>
              <Row gap="$2">
                {cert.state && (
                  <Text fontSize="$2" opacity={0.7}>
                    State: {cert.state}
                  </Text>
                )}
                {cert.issueDate && (
                  <Text fontSize="$2" opacity={0.7}>
                    Issued: {new Date(cert.issueDate).toLocaleDateString()}
                  </Text>
                )}
              </Row>
            </Stack>
          ))}
        </Stack>
      </Card>

      {/* Experience */}
      <Card padding="$4" backgroundColor="$color2">
        <Text fontSize="$5" fontWeight="600" marginBottom="$3">
          Work Experience
        </Text>
        <Stack gap="$4">
          {candidate.experience.map((exp, index) => (
            <Stack key={`exp-${exp.company}-${exp.title}-${index}`} gap="$2">
              <Text fontSize="$4" fontWeight="600">
                {exp.title}
              </Text>
              <Text fontSize="$3" opacity={0.8}>
                {exp.company}
              </Text>
              <Text fontSize="$2" opacity={0.6}>
                {exp.duration}
              </Text>
              <Text fontSize="$3" marginTop="$1">
                {exp.description}
              </Text>
              {index < candidate.experience.length - 1 && (
                <Stack height={1} backgroundColor="$color5" marginTop="$2" />
              )}
            </Stack>
          ))}
        </Stack>
      </Card>
    </Stack>
  )
}
