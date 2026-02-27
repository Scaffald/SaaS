import { Card, Paragraph, Text, Row, Stack } from '@scaffald/ui'
import type { TalentProfile } from '../types'

interface ProfileSummaryCardProps {
  profile: TalentProfile
  onPress: () => void
}

export function ProfileSummaryCard({ profile, onPress }: ProfileSummaryCardProps) {
  return (
    <Card
      elevate
      padding="sm"
      pressable
      onPress={onPress}
      style={{
        alignSelf: 'center',
        maxWidth: 320,
        borderWidth: 1,
        borderColor: 'var(--color-border)',
      }}
    >
      <Stack gap={8}>
        <Text color="secondary">{profile.name}</Text>

        <Row gap={8} align="center" wrap>
          <Paragraph color="secondary">{profile.experienceYears} years</Paragraph>
          <Text color="secondary">•</Text>
          <Paragraph color="secondary">${profile.hourlyRate}/hr</Paragraph>
        </Row>

        {profile.skills && profile.skills.length > 0 && (
          <Row gap={4} wrap>
            {profile.skills.slice(0, 3).map((skill) => (
              <Text
                key={skill}
                color="secondary"
                style={{
                  backgroundColor: 'var(--color-4)',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
              >
                {skill}
              </Text>
            ))}
            {profile.skills.length > 3 && (
              <Text color="secondary">+{profile.skills.length - 3} more</Text>
            )}
          </Row>
        )}
      </Stack>
    </Card>
  )
}
