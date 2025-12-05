import {
  InlineSkillSearch,
  type ParentSkill,
} from '@scf/core/features/profile/components/InlineSkillSearch'
import { api } from '@scf/core/utils/api'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Button, Card, Paragraph, Text, XStack, YStack } from '@unicornlove/ui'
import type { SkillEntry, SkillsStepData } from '../../hooks/useProfileWizard'
import { StepNavigation } from '../StepNavigation'
import type { WizardStepComponentProps } from './types'

const MIN_SKILLS = 3
const MAX_SKILLS = 5

function serializeSkills(items: SkillEntry[]): string {
  return items
    .map((item) => `${item.id}:${item.proficiency}:${item.taxonomy}`)
    .sort()
    .join('|')
}

export function SkillsStep({
  initialData,
  isSaving,
  isLastStep,
  onBack,
  onContinue,
  onSaveForLater,
  onSkip,
  onStepStateChange,
}: WizardStepComponentProps<'skills'>) {
  const [skills, setSkills] = useState<SkillEntry[]>(initialData?.skills ?? [])
  const searchResultsRef = useRef<Map<string, ParentSkill & { taxonomy: SkillEntry['taxonomy'] }>>(
    new Map()
  )

  const searchParentSkillsMutation = api.profile.skills.searchParentSkills.useMutation()
  const { data: primaryIndustryData } =
    api.profile.skillsMultiTaxonomy.getPrimaryIndustry.useQuery()

  useEffect(() => {
    if (initialData?.skills) {
      setSkills(initialData.skills)
    }
  }, [initialData])

  const baselineKey = useMemo(
    () => serializeSkills(initialData?.skills ?? []),
    [initialData?.skills]
  )
  const currentKey = useMemo(() => serializeSkills(skills), [skills])
  const isDirty = currentKey !== baselineKey
  const hasMinimumSkills = skills.length >= MIN_SKILLS

  useEffect(() => {
    const payload: SkillsStepData = {
      skills,
    }
    onStepStateChange?.({
      data: payload,
      isValid: hasMinimumSkills,
      isDirty,
    })
  }, [skills, hasMinimumSkills, isDirty, onStepStateChange])

  const handleSearchSkills = useCallback(
    async (query: string, _taxonomies: string[]) => {
      if (!query.trim()) {
        return []
      }

      const industryId = primaryIndustryData?.primary_industry_id
      if (!industryId) {
        return []
      }

      try {
        const result = await searchParentSkillsMutation.mutateAsync({
          query,
          industryId,
          limit: 25,
        })

        const parentSkills: ParentSkill[] = (result.skills || []).map(
          (skill: {
            skill_id: string
            skill_name: string
            csi_display: string | null
            csi_code: string[] | null
            child_count: number
          }): ParentSkill => {
            const mapped: ParentSkill = {
              id: skill.skill_id,
              name: skill.skill_name,
              code: skill.csi_display || skill.skill_id,
              depth: 0, // Parent skills are at depth 0
              childCount: skill.child_count,
            }
            // Default to 'onet' taxonomy for wizard (can be refined later)
            searchResultsRef.current.set(skill.skill_id, {
              ...mapped,
              taxonomy: 'onet' as SkillEntry['taxonomy'],
            })
            return mapped
          }
        )

        return parentSkills
      } catch (error) {
        console.error('Failed to search skills for wizard step', error)
        return []
      }
    },
    [primaryIndustryData, searchParentSkillsMutation]
  )

  const handleSelectSkill = useCallback(
    (skillId: string, proficiency: number, taxonomy: string) => {
      const dictionaryEntry = searchResultsRef.current.get(skillId)
      if (!dictionaryEntry) return

      const normalizedTaxonomy: SkillEntry['taxonomy'] =
        taxonomy === 'csi' || taxonomy === 'onet' ? taxonomy : (dictionaryEntry.taxonomy ?? 'onet')

      setSkills((previous) => {
        const existing = previous.find((skill) => skill.id === skillId)
        if (existing) {
          return previous.map((skill) =>
            skill.id === skillId ? { ...skill, proficiency, taxonomy: normalizedTaxonomy } : skill
          )
        }
        if (previous.length >= MAX_SKILLS) {
          return previous
        }
        return [
          ...previous,
          {
            id: skillId,
            name: dictionaryEntry.name,
            taxonomy: normalizedTaxonomy,
            proficiency,
          },
        ]
      })
    },
    []
  )

  const handleRemoveSkill = useCallback((skillId: string) => {
    setSkills((prev) => prev.filter((skill) => skill.id !== skillId))
  }, [])

  const handleContinue = useCallback(async () => {
    await onContinue({ skills })
  }, [onContinue, skills])

  const handleSaveForLater = useCallback(async () => {
    await onSaveForLater?.({ skills })
  }, [onSaveForLater, skills])

  const handleSkip = useCallback(async () => {
    await onSkip?.()
  }, [onSkip])

  const guidance = useMemo(() => {
    if (skills.length >= MIN_SKILLS) {
      return `Great! Add up to ${MAX_SKILLS} skills for stronger visibility.`
    }
    const remaining = MIN_SKILLS - skills.length
    return `Add ${remaining} more ${remaining === 1 ? 'skill' : 'skills'} to hit the recommended minimum.`
  }, [skills.length])

  const existingSkillIds = useMemo(() => skills.map((skill) => skill.id), [skills])
  const guidanceId = useId()

  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="700">
          Spotlight your strengths
        </Text>
        <Paragraph color="$color11">
          Add 3-5 core skills that best represent your expertise. Recruiters use these to match you
          with opportunities.
        </Paragraph>
      </YStack>

      <YStack gap="$3">
        <Text fontWeight="600">
          Selected Skills ({skills.length}/{MAX_SKILLS})
        </Text>
        {skills.length === 0 ? (
          <Card bordered backgroundColor="$color2">
            <Card.Header>
              <Paragraph color="$color11">
                Start by selecting your signature skills. We recommend adding at least three.
              </Paragraph>
            </Card.Header>
          </Card>
        ) : (
          <YStack gap="$2">
            {skills.map((skill) => (
              <Card key={skill.id} bordered backgroundColor="$color2">
                <Card.Header gap="$2">
                  <XStack justifyContent="space-between" alignItems="center">
                    <YStack gap="$1">
                      <Text fontWeight="600">{skill.name}</Text>
                      <Text fontSize="$2" color="$color11">
                        {skill.taxonomy.toUpperCase()} • Proficiency {skill.proficiency}/5
                      </Text>
                    </YStack>
                    <Button
                      size="$2"
                      variant="outlined"
                      onPress={() => handleRemoveSkill(skill.id)}
                      aria-label={`Remove ${skill.name}`}
                    >
                      Remove
                    </Button>
                  </XStack>
                </Card.Header>
              </Card>
            ))}
          </YStack>
        )}
        <Paragraph id={guidanceId} fontSize="$2" color="$color10" aria-live="polite">
          {guidance}
        </Paragraph>
      </YStack>

      <YStack gap="$3">
        <InlineSkillSearch
          onSearchSkills={handleSearchSkills}
          onSelectSkill={handleSelectSkill}
          existingSkillIds={existingSkillIds}
          isSearching={searchParentSkillsMutation.isPending}
        />
        {skills.length >= MAX_SKILLS && (
          <Paragraph fontSize="$2" color="$color11" aria-live="polite">
            You&apos;ve reached the maximum of {MAX_SKILLS} skills for the quick wizard. You can add
            more later from your full profile.
          </Paragraph>
        )}
      </YStack>

      <StepNavigation
        canGoBack
        canGoNext={hasMinimumSkills}
        isLastStep={isLastStep}
        isSaving={isSaving}
        onBack={onBack}
        onNext={handleContinue}
        onSkip={onSkip ? handleSkip : undefined}
        onSaveForLater={onSaveForLater ? handleSaveForLater : undefined}
        nextLabel="Next: Experience"
      />
    </YStack>
  )
}
