import { Award } from 'lucide-react-native'
import { Card, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
      <Stack gap={16} padding="lg">
        <Row gap={8} align="center">
          <Award size={24} color="$blue10" />
          <Text color="$gray11">Skills & Proficiency</Text>
        </Row>

        <Stack gap={12}>
          {skills.map((skill) => (
            <Stack key={skill.id} gap={8}>
              <Row justify="space-between" align="center">
                <Stack flex={1}>
                  <Text color="$gray11">
                    {typeof skill.label === 'string' && skill.label.length > 0
                      ? skill.label
                      : skill.displayCode
                        ? `${skill.displayCode} · ${skill.name}`
                        : skill.name}
                  </Text>
                  {typeof skill.yearsExperience === 'number' && (
                    <Text color="$gray11">{skill.yearsExperience} years experience</Text>
                  )}
                </Stack>
                <Text color="$blue11">{skill.proficiency}%</Text>
              </Row>
              <Row height={8} backgroundColor="$color3" borderRadius={8} overflow="hidden">
                <Row width={`${skill.proficiency}%`} backgroundColor="$blue10" />
              </Row>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Card>
  )
}
