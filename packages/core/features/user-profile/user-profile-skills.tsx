import { YStack, XStack, Text, Card } from 'tamagui'
import { Award } from '@tamagui/lucide-icons'

interface Skill {
  id: string
  name: string
  proficiency: number
  displayCode?: string | null
  taxonomy?: 'csi' | 'onet'
  yearsExperience?: number | null
  verified?: boolean
  label?: string | null
}

interface UserProfileSkillsProps {
  skills: Skill[]
}

export function UserProfileSkills({ skills }: UserProfileSkillsProps) {
  return (
    <Card elevate bordered>
      <YStack gap="$4" p="$5">
        <XStack gap="$2" items="center">
          <Award size={24} color="$blue10" />
          <Text fontSize="$7" fontWeight="700" color="$color12">
            Skills & Proficiency
          </Text>
        </XStack>

        <YStack gap="$3">
          {skills.map((skill) => (
            <YStack key={skill.id} gap="$2">
              <XStack justify="space-between" items="center">
                <YStack flex={1}>
                  <Text fontSize="$5" fontWeight="600" color="$color12">
                    {typeof skill.label === 'string' && skill.label.length > 0
                      ? skill.label
                      : skill.displayCode
                        ? `${skill.displayCode} · ${skill.name}`
                        : skill.name}
                  </Text>
                  {typeof skill.yearsExperience === 'number' && (
                    <Text fontSize="$3" color="$color10">
                      {skill.yearsExperience} years experience
                    </Text>
                  )}
                </YStack>
                <Text fontSize="$4" fontWeight="700" color="$blue11">
                  {skill.proficiency}%
                </Text>
              </XStack>
              <XStack height={8} bg="$color3" rounded="$2" overflow="hidden">
                <XStack width={`${skill.proficiency}%`} bg="$blue10" />
              </XStack>
            </YStack>
          ))}
        </YStack>
      </YStack>
    </Card>
  )
}
