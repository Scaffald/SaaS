import { useEffect, useMemo, useState } from 'react'
import { Button, Input, Text, XStack, YStack, Paragraph, Tag, ScrollView } from 'tamagui'
import type { WizardStepComponentProps } from './types'
import type { SkillEntry, SkillsStepData } from '../../hooks/useProfileWizard'
import { StepNavigation } from '../StepNavigation'

const MIN_SKILLS = 3
const MAX_SKILLS = 5

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
  const [pendingSkill, setPendingSkill] = useState('')

  useEffect(() => {
    if (initialData?.skills) {
      setSkills(initialData.skills)
    }
  }, [initialData])

  const hasMinimumSkills = skills.length >= MIN_SKILLS

  useEffect(() => {
    const payload: SkillsStepData = {
      skills,
    }
    onStepStateChange?.({
      data: payload,
      isValid: hasMinimumSkills,
      isDirty: true,
    })
  }, [skills, hasMinimumSkills, onStepStateChange])

  const addSkill = () => {
    if (!pendingSkill.trim()) return
    if (skills.length >= MAX_SKILLS) return

    const newSkill: SkillEntry = {
      id: pendingSkill.trim().toLowerCase(),
      name: pendingSkill.trim(),
      taxonomy: 'onet',
      proficiency: 3,
    }
    setSkills((prev) => [...prev, newSkill])
    setPendingSkill('')
  }

  const removeSkill = (id: string) => {
    setSkills((prev) => prev.filter((skill) => skill.id !== id))
  }

  const handleContinue = async () => {
    await onContinue({ skills })
  }

  const handleSaveForLater = async () => {
    await onSaveForLater?.({ skills })
  }

  const handleSkip = async () => {
    await onSkip?.()
  }

  const guidance = useMemo(() => {
    if (skills.length >= MIN_SKILLS) {
      return `Great! Add up to ${MAX_SKILLS} skills for stronger visibility.`
    }
    const remaining = MIN_SKILLS - skills.length
    return `Add ${remaining} more ${remaining === 1 ? 'skill' : 'skills'} to hit the recommended minimum.`
  }, [skills.length])

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

      <YStack gap="$2">
        <Text fontWeight="600">Skills ({skills.length}/{MAX_SKILLS})</Text>
        <XStack gap="$2" flexWrap="wrap">
          {skills.map((skill) => (
            <Tag key={skill.id} size="$2" theme="blue" onPress={() => removeSkill(skill.id)}>
              {skill.name}
            </Tag>
          ))}
        </XStack>
        <Paragraph fontSize="$2" color="$color10">
          {guidance}
        </Paragraph>
      </YStack>

      <XStack gap="$2">
        <Input
          flex={1}
          placeholder="e.g., Electrical Troubleshooting"
          value={pendingSkill}
          onChangeText={setPendingSkill}
        />
        <Button onPress={addSkill} disabled={!pendingSkill.trim() || skills.length >= MAX_SKILLS}>
          Add
        </Button>
      </XStack>

      <ScrollView maxHeight={160} bg="$color2" p="$3" rounded="$3">
        <YStack gap="$2">
          <Text fontSize="$3" fontWeight="600" color="$color12">
            Tips for selecting skills
          </Text>
          <Paragraph fontSize="$2" color="$color11">
            Choose skills that reflect your day-to-day work. Mix technical skills (e.g., HVAC Repair) with
            soft skills (e.g., Team Leadership) for better matches. You can refine these later.
          </Paragraph>
        </YStack>
      </ScrollView>

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


