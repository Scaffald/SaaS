import { YStack, XStack, Text, Card } from 'tamagui'
import type { MockApplication } from '../../mock-data/ats-mock-data'

interface CandidateProfileTabProps {
  candidate: MockApplication['candidate']
}

export const CandidateProfileTab = ({ candidate }: CandidateProfileTabProps) => {
  return (
    <YStack gap="$4">
      {/* Contact Info */}
      <Card p="$4" bg="$color2">
        <Text fontSize="$5" fontWeight="600" mb="$3">
          Contact Information
        </Text>
        <YStack gap="$2">
          <XStack justify="space-between">
            <Text opacity={0.7}>Email</Text>
            <Text fontWeight="600">{candidate.email}</Text>
          </XStack>
          <XStack justify="space-between">
            <Text opacity={0.7}>Phone</Text>
            <Text fontWeight="600">{candidate.phone}</Text>
          </XStack>
          <XStack justify="space-between">
            <Text opacity={0.7}>Location</Text>
            <Text fontWeight="600">{candidate.location}</Text>
          </XStack>
        </YStack>
      </Card>

      {/* Skills */}
      <Card p="$4" bg="$color2">
        <Text fontSize="$5" fontWeight="600" mb="$3">
          Skills
        </Text>
        <YStack gap="$3">
          {candidate.skills.map((skill, index) => (
            <XStack key={`skill-${skill.name}-${index}`} justify="space-between" items="center">
              <Text fontWeight="600">{skill.name}</Text>
              <YStack
                bg={
                  skill.proficiency === 'expert'
                    ? '$green3'
                    : skill.proficiency === 'advanced'
                      ? '$blue3'
                      : skill.proficiency === 'intermediate'
                        ? '$yellow3'
                        : '$color3'
                }
                px="$3"
                py="$1"
                rounded="$2"
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
              </YStack>
            </XStack>
          ))}
        </YStack>
      </Card>

      {/* Certifications */}
      <Card p="$4" bg="$color2">
        <Text fontSize="$5" fontWeight="600" mb="$3">
          Certifications
        </Text>
        <YStack gap="$3">
          {candidate.certifications.map((cert, index) => (
            <YStack key={`cert-${cert.name}-${index}`} gap="$1">
              <Text fontWeight="600">{cert.name}</Text>
              <XStack gap="$2">
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
              </XStack>
            </YStack>
          ))}
        </YStack>
      </Card>

      {/* Experience */}
      <Card p="$4" bg="$color2">
        <Text fontSize="$5" fontWeight="600" mb="$3">
          Work Experience
        </Text>
        <YStack gap="$4">
          {candidate.experience.map((exp, index) => (
            <YStack key={`exp-${exp.company}-${exp.title}-${index}`} gap="$2">
              <Text fontSize="$4" fontWeight="600">
                {exp.title}
              </Text>
              <Text fontSize="$3" opacity={0.8}>
                {exp.company}
              </Text>
              <Text fontSize="$2" opacity={0.6}>
                {exp.duration}
              </Text>
              <Text fontSize="$3" mt="$1">
                {exp.description}
              </Text>
              {index < candidate.experience.length - 1 && (
                <YStack height={1} bg="$color5" mt="$2" />
              )}
            </YStack>
          ))}
        </YStack>
      </Card>
    </YStack>
  )
}
