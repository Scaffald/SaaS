import { Card, Paragraph, Text, XStack, YStack } from 'tamagui'
import type { TalentProfile } from '../types'

interface ProfileSummaryCardProps {
  profile: TalentProfile
  onPress: () => void
}

export function ProfileSummaryCard({ profile, onPress }: ProfileSummaryCardProps) {
  return (
    <Card
      self="center"
      elevate
      size="$2"
      bg="$background"
      p="$3"
      gap="$2"
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
      maxW={320}
    >
      <Text fontSize="$5" fontWeight="700" color="$color12">
        {profile.name}
      </Text>

      <XStack gap="$2" items="center" flexWrap="wrap">
        <Paragraph fontSize="$2" color="$color11">
          {profile.experienceYears} years
        </Paragraph>
        <Text color="$color8">•</Text>
        <Paragraph fontSize="$2" color="$color11" fontWeight="600">
          ${profile.hourlyRate}/hr
        </Paragraph>
      </XStack>

      {profile.skills && profile.skills.length > 0 && (
        <XStack gap="$1" flexWrap="wrap">
          {profile.skills.slice(0, 3).map((skill) => (
            <Text
              key={skill}
              fontSize="$1"
              color="$color10"
              bg="$color4"
              px="$2"
              py="$1"
              rounded="$2"
            >
              {skill}
            </Text>
          ))}
          {profile.skills.length > 3 && (
            <Text fontSize="$1" color="$color10">
              +{profile.skills.length - 3} more
            </Text>
          )}
        </XStack>
      )}
    </Card>
  )
}
