import { useSoftSkillsByCategory } from '@scf/core/utils/reviews-sdk-hooks'
import { Button, Text, Row, Stack, useThemeContext } from '@unicornlove/beyond-ui'
import { useState } from 'react'
import { Label, Spinner } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'

interface SoftSkillsRequirementsSectionProps {
  requiredSoftSkills?: Array<{ skill_id: string; importance: number }> | null
  onUpdate: (data: {
    required_soft_skills?: Array<{ skill_id: string; importance: number }> | null
  }) => void
}

interface SoftSkillRequirement {
  skill_id: string
  importance: number
}

const IMPORTANCE_LABELS = {
  1: 'Nice to Have',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Critical',
} as const

export function SoftSkillsRequirementsSection({
  requiredSoftSkills,
  onUpdate,
}: SoftSkillsRequirementsSectionProps) {
  const { theme } = useThemeContext()
  const { data: softSkillsData, isLoading } = useSoftSkillsByCategory()

  const [selectedSkills, setSelectedSkills] = useState<Map<string, number>>(() => {
    const map = new Map<string, number>()
    if (requiredSoftSkills && Array.isArray(requiredSoftSkills)) {
      for (const req of requiredSoftSkills) {
        map.set(req.skill_id, req.importance)
      }
    }
    return map
  })

  const handleSkillToggle = (skillId: string) => {
    const newSelected = new Map(selectedSkills)
    if (newSelected.has(skillId)) {
      newSelected.delete(skillId)
    } else {
      newSelected.set(skillId, 3) // Default to medium importance
    }
    setSelectedSkills(newSelected)
    updateRequirements(newSelected)
  }

  const handleImportanceChange = (skillId: string, importance: number) => {
    const newSelected = new Map(selectedSkills)
    newSelected.set(skillId, importance)
    setSelectedSkills(newSelected)
    updateRequirements(newSelected)
  }

  const updateRequirements = (skills: Map<string, number>) => {
    const requirements: SoftSkillRequirement[] = Array.from(skills.entries()).map(
      ([skill_id, importance]) => ({
        skill_id,
        importance,
      })
    )
    onUpdate({
      required_soft_skills: requirements.length > 0 ? requirements : null,
    })
  }

  const categoryLabels: Record<string, string> = {
    reliability: 'Reliability',
    collaboration: 'Collaboration',
    professionalism: 'Professionalism',
    technical: 'Technical',
  }

  if (isLoading) {
    return (
      <Stack
        gap={16}
        padding="md"
        style={{ backgroundColor: colors.bg[theme].default }}
        borderRadius={16}
        borderWidth={1}
        borderColor={colors.border[theme].default}
      >
        <Text>Soft Skills Requirements</Text>
        <Stack align="center" padding="md">
          <Spinner size="lg" style={{ color: colors.text[theme].info }} />
          <Text marginTop={8} style={{ color: colors.text[theme].secondary }}>
            Loading soft skills catalog...
          </Text>
        </Stack>
      </Stack>
    )
  }

  if (!softSkillsData || Object.keys(softSkillsData).length === 0) {
    return (
      <Stack
        gap={16}
        padding="md"
        style={{ backgroundColor: colors.bg[theme].default }}
        borderRadius={16}
        borderWidth={1}
        borderColor={colors.border[theme].default}
      >
        <Text>Soft Skills Requirements</Text>
        <Text style={{ color: colors.text[theme].secondary }}>
          Soft skills catalog is not available.
        </Text>
      </Stack>
    )
  }

  const selectedCount = selectedSkills.size

  return (
    <Stack
      gap={16}
      padding="md"
      style={{ backgroundColor: colors.bg[theme].default }}
      borderRadius={16}
      borderWidth={1}
      borderColor={colors.border[theme].default}
    >
      <Stack gap={8}>
        <Text>Soft Skills Requirements</Text>
        <Text style={{ color: colors.text[theme].secondary }}>
          Select which soft skills are required for this job and set their importance level (1-5).
          Candidates will see how well their soft skills match your requirements.
        </Text>
        {selectedCount > 0 && (
          <Text style={{ color: colors.text[theme].info }}>
            {selectedCount} {selectedCount === 1 ? 'skill' : 'skills'} selected
          </Text>
        )}
      </Stack>

      {/* Soft Skills by Category */}
      {Object.entries(softSkillsData).map(([category, skills]) => {
        if (!Array.isArray(skills) || skills.length === 0) return null

        return (
          <Stack key={category} gap={12}>
            <Text style={{ color: colors.text[theme].secondary }}>
              {categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
            <Row gap={8} flexWrap="wrap">
              {skills.map((skill) => {
                const isSelected = selectedSkills.has(skill.id)
                const importance = selectedSkills.get(skill.id) ?? 3

                return (
                  <Stack key={skill.id} gap={8}>
                    <Button
                      size="sm"
                      variant={isSelected ? 'outlined' : 'outlined'}
                      theme={isSelected ? 'blue' : undefined}
                      onPress={() => handleSkillToggle(skill.id)}
                    >
                      {skill.name}
                    </Button>
                    {isSelected && (
                      <Stack gap={4}>
                        <Label style={{ color: colors.text[theme].secondary }}>
                          Importance:{' '}
                          {IMPORTANCE_LABELS[importance as keyof typeof IMPORTANCE_LABELS]}
                        </Label>
                        <Row gap={4}>
                          {[1, 2, 3, 4, 5].map((level) => (
                            <Button
                              key={level}
                              size="xs"
                              variant={importance === level ? 'outlined' : 'outlined'}
                              theme={importance === level ? 'blue' : undefined}
                              onPress={() => handleImportanceChange(skill.id, level)}
                            >
                              {level}
                            </Button>
                          ))}
                        </Row>
                      </Stack>
                    )}
                  </Stack>
                )
              })}
            </Row>
          </Stack>
        )
      })}

      {/* Preview Section */}
      {selectedCount > 0 && (
        <Stack
          gap={8}
          padding="sm"
          style={{ backgroundColor: colors.bg[theme].info }}
          borderRadius={12}
          borderWidth={1}
          borderColor={colors.border[theme].info}
        >
          <Text style={{ color: colors.text[theme].info }}>
            Preview: How candidates will see this
          </Text>
          <Stack gap={4}>
            {Array.from(selectedSkills.entries()).map(([skillId, importance]) => {
              type SoftSkill = {
                id?: string
                name?: string
                category?: string
                [key: string]: unknown
              }
              const skill = (Object.values(softSkillsData) as Array<SoftSkill[]>)
                .flat()
                .find((s) => (s as SoftSkill).id === skillId)
              if (!skill) return null

              const importanceLabel =
                IMPORTANCE_LABELS[importance as keyof typeof IMPORTANCE_LABELS]
              return (
                <Text key={skillId} style={{ color: colors.text[theme].info }}>
                  • {skill.name} ({importanceLabel} - {importance}/5)
                </Text>
              )
            })}
          </Stack>
        </Stack>
      )}
    </Stack>
  )
}
