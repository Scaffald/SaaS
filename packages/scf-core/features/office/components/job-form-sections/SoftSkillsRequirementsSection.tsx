import { useSoftSkillsByCategory } from '@scf/core/utils/reviews-sdk-hooks'
import { Button, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { useState } from 'react'
import { Label, Spinner } from '@unicornlove/beyond-ui'

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
        padding={16}
        backgroundColor="$background"
        borderRadius={16}
        borderWidth={1}
        borderColor="$borderColor"
      >
        <Text>
          Soft Skills Requirements
        </Text>
        <Stack align="center" padding={16}>
          <Spinner size="lg" color="$blue10" />
          <Text marginTop={8} color="gray">
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
        padding={16}
        backgroundColor="$background"
        borderRadius={16}
        borderWidth={1}
        borderColor="$borderColor"
      >
        <Text>
          Soft Skills Requirements
        </Text>
        <Text color="gray">
          Soft skills catalog is not available.
        </Text>
      </Stack>
    )
  }

  const selectedCount = selectedSkills.size

  return (
    <Stack
      gap={16}
      padding={16}
      backgroundColor="$background"
      borderRadius={16}
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Stack gap={8}>
        <Text>
          Soft Skills Requirements
        </Text>
        <Text color="gray">
          Select which soft skills are required for this job and set their importance level (1-5).
          Candidates will see how well their soft skills match your requirements.
        </Text>
        {selectedCount > 0 && (
          <Text color="$blue11">
            {selectedCount} {selectedCount === 1 ? 'skill' : 'skills'} selected
          </Text>
        )}
      </Stack>

      {/* Soft Skills by Category */}
      {Object.entries(softSkillsData).map(([category, skills]) => {
        if (!Array.isArray(skills) || skills.length === 0) return null

        return (
          <Stack key={category} gap={12}>
            <Text color="gray">
              {categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
            <Row gap={8} flexWrap="wrap">
              {skills.map((skill) => {
                const isSelected = selectedSkills.has(skill.id)
                const importance = selectedSkills.get(skill.id) ?? 3

                return (
                  <Stack key={skill.id} gap={8}>
                    <Button
                      size={12}
                      variant={isSelected ? 'outlined' : 'outlined'}
                      theme={isSelected ? 'blue' : undefined}
                      onPress={() => handleSkillToggle(skill.id)}
                    >
                      {skill.name}
                    </Button>
                    {isSelected && (
                      <Stack gap={4}>
                        <Label color="gray">
                          Importance:{' '}
                          {IMPORTANCE_LABELS[importance as keyof typeof IMPORTANCE_LABELS]}
                        </Label>
                        <Row gap={4}>
                          {[1, 2, 3, 4, 5].map((level) => (
                            <Button
                              key={level}
                              size={8}
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
          padding={12}
          backgroundColor="$blue2"
          borderRadius={12}
          borderWidth={1}
          borderColor="$blue7"
        >
          <Text color="$blue11">
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
                <Text key={skillId} color="$blue11">
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
