/**
 * Career Detail Screen - Detailed occupation information with skills, abilities, and related careers.
 *
 * @see Issue #104
 */

import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  GraduationCap,
  Layers,
  Star,
  Wrench,
  Zap,
} from 'lucide-react-native'
import { ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import {
  Button,
  Card,
  H2,
  Spinner,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useOccupation, useOccupationStatus, useSaveCareerAssessmentMutation } from '@scf/core/utils/onet-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'
import { Pressable } from 'react-native'

interface CareerDetailScreenProps {
  onetCode: string
}

/** Render a skill/ability/knowledge bar */
function SkillBar({
  name,
  level,
  maxLevel = 7,
  theme,
}: {
  name: string
  level: number
  maxLevel?: number
  theme: 'light' | 'dark'
}) {
  const percent = Math.round((level / maxLevel) * 100)
  return (
    <Stack gap={4}>
      <Row justify="space-between">
        <Text style={{ color: colors.text[theme].primary, fontSize: 13 }}>{name}</Text>
        <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>
          {level.toFixed(1)}
        </Text>
      </Row>
      <Stack
        style={{
          height: 6,
          backgroundColor: colors.bg[theme].subtle,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <Stack
          style={{
            height: '100%',
            width: `${percent}%`,
            backgroundColor: percent >= 70 ? colors.success[500] : percent >= 40 ? colors.blue[500] : colors.warning[500],
            borderRadius: 3,
          }}
        />
      </Stack>
    </Stack>
  )
}

export function CareerDetailScreen({ onetCode }: CareerDetailScreenProps) {
  const { theme } = useThemeContext()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: occupationResponse, isLoading, error } = useOccupation({ onetCode })
  const { data: occupationStatus } = useOccupationStatus()
  const occupation = occupationResponse?.data

  const saveAssessment = useSaveCareerAssessmentMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'onet', 'occupation', 'status'] })
    },
  })

  const selectedCodes = (occupationStatus?.occupations ?? []).map((o) => o.onet_code)
  const isTargetCareer = selectedCodes.includes(onetCode)

  const handleToggleTarget = () => {
    const newCodes = isTargetCareer
      ? selectedCodes.filter((c) => c !== onetCode)
      : [...selectedCodes, onetCode]
    saveAssessment.mutate({ selected_occupations: newCodes })
  }

  if (isLoading) {
    return (
      <Stack flex={1} align="center" justify="center">
        <Spinner variant="ios" size="lg" />
        <Text style={{ color: colors.text[theme].secondary, marginTop: 12 }}>
          Loading occupation details...
        </Text>
      </Stack>
    )
  }

  if (error || !occupation) {
    return (
      <Stack flex={1} align="center" justify="center" gap={16}>
        <Text style={{ color: colors.text[theme].secondary }}>
          Occupation not found
        </Text>
        <Button variant="outline" onPress={() => router.back()}>
          Go Back
        </Button>
      </Stack>
    )
  }

  const skills = occupation.skills ?? []
  const abilities = occupation.abilities ?? []
  const knowledge = occupation.knowledge ?? []
  const techSkills = occupation.technology_skills ?? []
  const tasks = occupation.tasks ?? []

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <Stack gap={24} style={{ paddingBottom: 40 }}>
        {/* Back + Header */}
        <Stack gap={12}>
          <Pressable onPress={() => router.back()}>
            <Row gap={6} align="center">
              <ArrowLeft size={18} color={colors.icon[theme].default} />
              <Text style={{ color: colors.text[theme].secondary }}>Back to Explorer</Text>
            </Row>
          </Pressable>

          <Row justify="space-between" align="flex-start">
            <Stack style={{ flex: 1 }} gap={4}>
              <H2>{occupation.title}</H2>
              <Text style={{ color: colors.text[theme].tertiary, fontSize: 13 }}>
                O*NET Code: {occupation.onet_code}
              </Text>
            </Stack>
            <Button
              size="sm"
              variant={isTargetCareer ? 'filled' : 'outline'}
              color={isTargetCareer ? 'primary' : undefined}
              onPress={handleToggleTarget}
              disabled={saveAssessment.isPending}
              iconStart={Star}
            >
              {isTargetCareer ? 'Target Career' : 'Save to Goals'}
            </Button>
          </Row>
        </Stack>

        {/* Description */}
        <Card variant="glass" padding="md" style={{ backgroundColor: colors.bg[theme].subtle }}>
          <Text style={{ color: colors.text[theme].primary, lineHeight: 22 }}>
            {occupation.description}
          </Text>
        </Card>

        {/* Education & Experience */}
        {occupation.education && (
          <Stack gap={8}>
            <Row gap={6} align="center">
              <GraduationCap size={18} color={colors.icon[theme].default} />
              <Text style={{ color: colors.text[theme].primary, fontWeight: '600' }}>
                Education & Training
              </Text>
            </Row>
            <Card variant="glass" padding="md" style={{ backgroundColor: colors.bg[theme].default }}>
              <Stack gap={8}>
                <Row justify="space-between">
                  <Text style={{ color: colors.text[theme].secondary, fontSize: 13 }}>
                    Typical Education
                  </Text>
                  <Text style={{ color: colors.text[theme].primary, fontSize: 13 }}>
                    {occupation.education.typical_education}
                  </Text>
                </Row>
                <Row justify="space-between">
                  <Text style={{ color: colors.text[theme].secondary, fontSize: 13 }}>
                    Related Experience
                  </Text>
                  <Text style={{ color: colors.text[theme].primary, fontSize: 13 }}>
                    {occupation.education.related_experience}
                  </Text>
                </Row>
                <Row justify="space-between">
                  <Text style={{ color: colors.text[theme].secondary, fontSize: 13 }}>
                    On-site Training
                  </Text>
                  <Text style={{ color: colors.text[theme].primary, fontSize: 13 }}>
                    {occupation.education.on_site_training}
                  </Text>
                </Row>
              </Stack>
            </Card>
          </Stack>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <Stack gap={8}>
            <Row gap={6} align="center">
              <Wrench size={18} color={colors.icon[theme].default} />
              <Text style={{ color: colors.text[theme].primary, fontWeight: '600' }}>
                Skills ({skills.length})
              </Text>
            </Row>
            <Card variant="glass" padding="md" style={{ backgroundColor: colors.bg[theme].default }}>
              <Stack gap={10}>
                {skills.slice(0, 10).map((skill) => (
                  <SkillBar
                    key={skill.name}
                    name={skill.name}
                    level={skill.level}
                    theme={theme}
                  />
                ))}
              </Stack>
            </Card>
          </Stack>
        )}

        {/* Abilities */}
        {abilities.length > 0 && (
          <Stack gap={8}>
            <Row gap={6} align="center">
              <Zap size={18} color={colors.icon[theme].default} />
              <Text style={{ color: colors.text[theme].primary, fontWeight: '600' }}>
                Abilities ({abilities.length})
              </Text>
            </Row>
            <Card variant="glass" padding="md" style={{ backgroundColor: colors.bg[theme].default }}>
              <Stack gap={10}>
                {abilities.slice(0, 8).map((ability) => (
                  <SkillBar
                    key={ability.name}
                    name={ability.name}
                    level={ability.level}
                    theme={theme}
                  />
                ))}
              </Stack>
            </Card>
          </Stack>
        )}

        {/* Knowledge */}
        {knowledge.length > 0 && (
          <Stack gap={8}>
            <Row gap={6} align="center">
              <BookOpen size={18} color={colors.icon[theme].default} />
              <Text style={{ color: colors.text[theme].primary, fontWeight: '600' }}>
                Knowledge ({knowledge.length})
              </Text>
            </Row>
            <Card variant="glass" padding="md" style={{ backgroundColor: colors.bg[theme].default }}>
              <Stack gap={10}>
                {knowledge.slice(0, 8).map((k) => (
                  <SkillBar
                    key={k.name}
                    name={k.name}
                    level={k.level}
                    theme={theme}
                  />
                ))}
              </Stack>
            </Card>
          </Stack>
        )}

        {/* Technology Skills */}
        {techSkills.length > 0 && (
          <Stack gap={8}>
            <Row gap={6} align="center">
              <Layers size={18} color={colors.icon[theme].default} />
              <Text style={{ color: colors.text[theme].primary, fontWeight: '600' }}>
                Technology Skills
              </Text>
            </Row>
            <Row gap={6} style={{ flexWrap: 'wrap' }}>
              {techSkills.map((tech) => (
                <Stack
                  key={tech}
                  style={{
                    backgroundColor: colors.bg[theme].subtle,
                    borderRadius: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderWidth: 1,
                    borderColor: colors.border[theme].default,
                  }}
                >
                  <Text style={{ color: colors.text[theme].primary, fontSize: 12 }}>{tech}</Text>
                </Stack>
              ))}
            </Row>
          </Stack>
        )}

        {/* Tasks */}
        {tasks.length > 0 && (
          <Stack gap={8}>
            <Row gap={6} align="center">
              <Briefcase size={18} color={colors.icon[theme].default} />
              <Text style={{ color: colors.text[theme].primary, fontWeight: '600' }}>
                Common Tasks
              </Text>
            </Row>
            <Card variant="glass" padding="md" style={{ backgroundColor: colors.bg[theme].default }}>
              <Stack gap={8}>
                {tasks.slice(0, 8).map((task, idx) => (
                  <Row key={idx} gap={8} align="flex-start">
                    <Text style={{ color: colors.text[theme].tertiary, fontSize: 12, marginTop: 2 }}>
                      {idx + 1}.
                    </Text>
                    <Text style={{ color: colors.text[theme].primary, fontSize: 13, flex: 1 }}>
                      {task}
                    </Text>
                  </Row>
                ))}
              </Stack>
            </Card>
          </Stack>
        )}
      </Stack>
    </ScrollView>
  )
}
