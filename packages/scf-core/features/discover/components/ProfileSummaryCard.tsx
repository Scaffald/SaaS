import { Card, Paragraph, Text, Row } from '@scaffald/ui'
import type { TalentProfile } from '../types'

interface ProfileSummaryCardProps {
  profile: TalentProfile
  onPress: () => void
}

export function ProfileSummaryCard({ profile, onPress }: ProfileSummaryCardProps) {
  return (
    <Card
      alignSelf="center"
      elevate
      size="sm"
      backgroundColor="$background"
      padding="sm"
      gap={8}
      pressStyle={{ scale: 0.98, opacity: 0.9 }}
      onPress={onPress}
      cursor="pointer"
      animation="quick"
      borderWidth={1}
      borderColor="$borderColor"
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 4 }}
      shadowOpacity={0.15}
      shadowRadius={12}
      maxWidth={320}
    >
      <Text color="$gray11">{profile.name}</Text>

      <Row gap={8} align="center" flexWrap="wrap">
        <Paragraph color="$gray11">{profile.experienceYears} years</Paragraph>
        <Text color="$gray11">•</Text>
        <Paragraph color="$gray11">${profile.hourlyRate}/hr</Paragraph>
      </Row>

      {profile.skills && profile.skills.length > 0 && (
        <Row gap={4} flexWrap="wrap">
          {profile.skills.slice(0, 3).map((skill) => (
            <Text
              key={skill}
              color="$gray11"
              backgroundColor="$color4"
              paddingHorizontal={8}
              paddingVertical={4}
              borderRadius={8}
            >
              {skill}
            </Text>
          ))}
          {profile.skills.length > 3 && (
            <Text color="$gray11">+{profile.skills.length - 3} more</Text>
          )}
        </Row>
      )}
    </Card>
  )
}
