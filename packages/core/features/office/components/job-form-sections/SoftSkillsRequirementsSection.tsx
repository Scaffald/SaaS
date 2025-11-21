import { api } from '@app/core/utils/api'
import { Button, Text, XStack, YStack } from '@app/ui'
import { useState } from 'react'
import { Label, Spinner } from 'tamagui'

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
  const { data: softSkillsData, isLoading } = api.reviews.getSoftSkillsByCategory.useQuery()

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
    const requirements: SoftSkillRequirement[] = Array.from(skills.entries()).map(([skill_id, importance]) => ({
      skill_id,
      importance,
    }))
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
      <YStack gap="$4" p="$4" bg="$background" rounded="$4" borderWidth={1} borderColor="$borderColor">
        <Text fontSize="$6" fontWeight="600">
          Soft Skills Requirements
        </Text>
        <YStack items="center" p="$4">
          <Spinner size="large" color="$blue10" />
          <Text mt="$2" color="$color11">
            Loading soft skills catalog...
          </Text>
        </YStack>
      </YStack>
    )
  }

  if (!softSkillsData || Object.keys(softSkillsData).length === 0) {
    return (
      <YStack gap="$4" p="$4" bg="$background" rounded="$4" borderWidth={1} borderColor="$borderColor">
        <Text fontSize="$6" fontWeight="600">
          Soft Skills Requirements
        </Text>
        <Text fontSize="$3" color="$color11">
          Soft skills catalog is not available.
        </Text>
      </YStack>
    )
  }

  const selectedCount = selectedSkills.size

  return (
    <YStack gap="$4" p="$4" bg="$background" rounded="$4" borderWidth={1} borderColor="$borderColor">
      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="600">
          Soft Skills Requirements
        </Text>
        <Text fontSize="$2" color="$color10">
          Select which soft skills are required for this job and set their importance level (1-5).
          Candidates will see how well their soft skills match your requirements.
        </Text>
        {selectedCount > 0 && (
          <Text fontSize="$3" color="$blue11" fontWeight="600">
            {selectedCount} {selectedCount === 1 ? 'skill' : 'skills'} selected
          </Text>
        )}
      </YStack>

      {/* Soft Skills by Category */}
      {Object.entries(softSkillsData).map(([category, skills]) => {
        if (!Array.isArray(skills) || skills.length === 0) return null

        return (
          <YStack key={category} gap="$3">
            <Text fontSize="$4" fontWeight="600" color="$color12">
              {categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
            <XStack gap="$2" flexWrap="wrap">
              {skills.map((skill) => {
                const isSelected = selectedSkills.has(skill.id)
                const importance = selectedSkills.get(skill.id) ?? 3

                return (
                  <YStack key={skill.id} gap="$2">
                    <Button
                      size="$3"
                      variant={isSelected ? 'outlined' : 'outlined'}
                      theme={isSelected ? 'blue' : undefined}
                      onPress={() => handleSkillToggle(skill.id)}
                    >
                      {skill.name}
                    </Button>
                    {isSelected && (
                      <YStack gap="$1">
                        <Label fontSize="$2" color="$color11">
                          Importance: {IMPORTANCE_LABELS[importance as keyof typeof IMPORTANCE_LABELS]}
                        </Label>
                        <XStack gap="$1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <Button
                              key={level}
                              size="$2"
                              variant={importance === level ? 'outlined' : 'outlined'}
                              theme={importance === level ? 'blue' : undefined}
                              onPress={() => handleImportanceChange(skill.id, level)}
                            >
                              {level}
                            </Button>
                          ))}
                        </XStack>
                      </YStack>
                    )}
                  </YStack>
                )
              })}
            </XStack>
          </YStack>
        )
      })}

      {/* Preview Section */}
      {selectedCount > 0 && (
        <YStack gap="$2" p="$3" bg="$blue2" rounded="$3" borderWidth={1} borderColor="$blue7">
          <Text fontSize="$4" fontWeight="600" color="$blue11">
            Preview: How candidates will see this
          </Text>
          <YStack gap="$1">
            {Array.from(selectedSkills.entries()).map(([skillId, importance]) => {
              const skill = Object.values(softSkillsData)
                .flat()
                .find((s) => s.id === skillId)
              if (!skill) return null

              const importanceLabel = IMPORTANCE_LABELS[importance as keyof typeof IMPORTANCE_LABELS]
              return (
                <Text key={skillId} fontSize="$3" color="$blue11">
                  • {skill.name} ({importanceLabel} - {importance}/5)
                </Text>
              )
            })}
          </YStack>
        </YStack>
      )}
    </YStack>
  )
}

