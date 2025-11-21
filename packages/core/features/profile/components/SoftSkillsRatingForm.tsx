import { api } from '@app/core/utils/api'
import { ROUTES } from '@app/core/constants/routes'
import {
  Heading,
  LoadingState,
  ResponsiveModal,
  SaveStatusIndicator,
  UIButton,
} from '@app/ui'
import { CheckCircle2 } from '@tamagui/lucide-icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Button, Card, Separator, Slider, Spinner, Text, XStack, YStack } from 'tamagui'
import { softSkillsUpdateSchema } from '@app/schemas/profile/soft-skills.schema'
import { SoftSkillsCategoryTabs, type SoftSkillCategory } from './SoftSkillsCategoryTabs'
import type { SoftSkillsUpdateInput } from '@app/schemas/profile/soft-skills.schema'

type SoftSkillsFormData = SoftSkillsUpdateInput

interface SoftSkillWithRating {
  id: string
  name: string
  category: SoftSkillCategory
  description: string | null
  orderIndex: number
  rating: number | null
}

const SOFT_SKILL_LEVELS = [
  { value: 1, label: 'Learning' },
  { value: 2, label: 'Developing' },
  { value: 3, label: 'Proficient' },
  { value: 4, label: 'Advanced' },
  { value: 5, label: 'Expert' },
] as const

/**
 * SoftSkillsRatingForm component
 *
 * Main assessment interface where users rate all 25 soft skills across 4 categories
 * with real-time mini radar charts, auto-save, and validation.
 */
export const SoftSkillsRatingForm: FC = () => {
  const router = useRouter()
  const toast = useToastController()
  const [activeCategory, setActiveCategory] = useState<SoftSkillCategory>('reliability')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  )
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastAutoSaveRef = useRef<SoftSkillsFormData | null>(null)

  // Fetch soft skills data
  const { data, isLoading, error, refetch } = api.profile.skills.getSoftSkills.useQuery(
    undefined,
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    },
  )

  // Prepare form data structure
  const formSkills = useMemo<SoftSkillWithRating[]>(() => {
    if (!data) return []

    return data.skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      description: skill.description,
      orderIndex: skill.orderIndex,
      rating: skill.rating ?? null,
    }))
  }, [data])

  // Prepare default values for form - sort by category and order
  const defaultValues = useMemo<SoftSkillsFormData>(() => {
    const sortedSkills = [...formSkills].sort((a, b) => {
      const categoryOrder: Record<SoftSkillCategory, number> = {
        reliability: 0,
        collaboration: 1,
        professionalism: 2,
        technical: 3,
      }
      const categoryDiff = categoryOrder[a.category] - categoryOrder[b.category]
      if (categoryDiff !== 0) return categoryDiff
      return a.orderIndex - b.orderIndex
    })

    const skills = sortedSkills.map((skill) => ({
      skill_id: skill.id,
      rating: skill.rating ?? 1, // Default to 1 if not rated
    }))

    return { skills }
  }, [formSkills])

  // Initialize form
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isDirty },
  } = useForm<SoftSkillsFormData>({
    resolver: zodResolver(softSkillsUpdateSchema),
    defaultValues,
    mode: 'onChange',
  })

  // Watch all ratings for auto-save
  const watchedRatings = watch('skills')

  // Reset form when data loads
  useEffect(() => {
    if (data && formSkills.length === 25) {
      reset(defaultValues)
      lastAutoSaveRef.current = defaultValues
    }
  }, [data, formSkills.length, defaultValues, reset])

  // Update mutation
  const updateMutation = api.profile.skills.updateSoftSkills.useMutation({
    onSuccess: () => {
      setAutoSaveStatus('saved')
      setLastSavedAt(new Date())
      void refetch()
      lastAutoSaveRef.current = { skills: watchedRatings }
    },
    onError: (error) => {
      setAutoSaveStatus('error')
      console.error('Auto-save failed:', error)
    },
  })

  // Auto-save effect (30 second interval)
  useEffect(() => {
    if (!isDirty || updateMutation.isPending) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
        autoSaveTimeoutRef.current = null
      }
      return
    }

    // Check if ratings actually changed
    const currentData = { skills: watchedRatings }
    const lastSaved = lastAutoSaveRef.current

    if (lastSaved && JSON.stringify(currentData) === JSON.stringify(lastSaved)) {
      return // No changes to save
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Set auto-save timeout (30 seconds)
    autoSaveTimeoutRef.current = setTimeout(() => {
      const currentRatings = watch('skills')
      if (JSON.stringify(currentRatings) !== JSON.stringify(lastAutoSaveRef.current?.skills)) {
        setAutoSaveStatus('saving')
        updateMutation.mutate({ skills: currentRatings })
      }
    }, 30000) as unknown as NodeJS.Timeout

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [watchedRatings, isDirty, updateMutation, watch])

  // Filter skills by active category
  const categorySkills = useMemo(() => {
    return formSkills
      .filter((skill) => skill.category === activeCategory)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  }, [formSkills, activeCategory])


  // Check if all skills are rated
  const allSkillsRated = useMemo(() => {
    return watchedRatings.length === 25 && watchedRatings.every((r) => r.rating > 0)
  }, [watchedRatings])

  // Submit handler
  const onSubmit = useCallback(
    async (formData: SoftSkillsFormData) => {
      try {
        await updateMutation.mutateAsync(formData)
        setShowSuccessModal(true)
        setAutoSaveStatus('saved')
        setLastSavedAt(new Date())
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to save assessment. Please try again.'
        toast.show('Error', {
          message,
        })
      }
    },
    [updateMutation, toast],
  )

  // Handle success modal close
  const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false)
    router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)
  }, [router])

  if (isLoading) {
    return <LoadingState message="Loading soft skills assessment..." />
  }

  if (error) {
    return (
      <YStack gap="$4" items="center" py="$8">
        <Text color="$red10">Failed to load assessment</Text>
        <Text color="$color11" fontSize="$2">
          {error.message}
        </Text>
        <UIButton variant="primary" size="$2" onPress={() => void refetch()}>
          Retry
        </UIButton>
      </YStack>
    )
  }

  if (formSkills.length === 0) {
    return (
      <YStack gap="$4" items="center" py="$8">
        <Text color="$color11">No soft skills available</Text>
        <Text color="$color10" fontSize="$2">
          Please contact support if this issue persists.
        </Text>
      </YStack>
    )
  }

  return (
    <YStack gap="$4">
      {/* Header */}
      <XStack justify="space-between" items="center">
        <Heading variant="h3">Rate Your Soft Skills</Heading>
        <SaveStatusIndicator
          status={autoSaveStatus}
          lastSavedAt={lastSavedAt?.toISOString()}
          error={autoSaveStatus === 'error' ? 'Failed to auto-save' : undefined}
        />
      </XStack>

      <Text fontSize="$3" color="$color11">
        Rate each soft skill from 1-5 based on your proficiency level. Changes are automatically
        saved every 30 seconds.
      </Text>

      <Separator />

      {/* Category Tabs */}
      <SoftSkillsCategoryTabs activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

      <Separator />

      {/* Skills List for Active Category */}
      <YStack gap="$4">
        {categorySkills.length === 0 ? (
          <YStack gap="$2" items="center" py="$8">
            <Text color="$color11">No skills in this category</Text>
          </YStack>
        ) : (
          categorySkills.map((skill) => {
            const skillRatingIndex = watchedRatings.findIndex((r) => r.skill_id === skill.id)
            const defaultRating = skillRatingIndex >= 0 ? watchedRatings[skillRatingIndex]?.rating ?? 1 : 1

            if (skillRatingIndex < 0) {
              return null
            }

            return (
              <Card key={skill.id} bordered p="$4" bg="$background">
                <YStack gap="$3">
                  <YStack gap="$1">
                    <Text fontSize="$5" fontWeight="600" color="$color12">
                      {skill.name}
                    </Text>
                    {skill.description && (
                      <Text fontSize="$3" color="$color11">
                        {skill.description}
                      </Text>
                    )}
                  </YStack>

                  <Controller
                    control={control}
                    name={`skills.${skillRatingIndex}.rating`}
                    rules={{
                      required: true,
                      min: 1,
                      max: 5,
                    }}
                    render={({ field: { onChange, value } }) => {
                      const sliderValue = typeof value === 'number' ? value : defaultRating

                      return (
                        <YStack gap="$2">
                          <Slider
                            value={[sliderValue]}
                            onValueChange={(newValue) => onChange(newValue[0])}
                            min={1}
                            max={5}
                            step={1}
                            size="$3"
                            mt="$4"
                            mb="$2"
                          >
                            <Slider.Track bg="$color4" height={6} rounded="$pill">
                              <Slider.TrackActive bg="$blue9" rounded="$pill" />
                            </Slider.Track>
                            <Slider.Thumb
                              index={0}
                              circular
                              size="$1"
                              bg="$blue9"
                              borderWidth={2}
                              borderColor="$blue11"
                            />
                          </Slider>

                          <XStack justify="space-between" gap="$2" flexWrap="wrap">
                            {SOFT_SKILL_LEVELS.map((level) => (
                              <YStack
                                key={level.value}
                                flex={1}
                                minWidth={64}
                                items="center"
                                opacity={sliderValue === level.value ? 1 : 0.6}
                              >
                                <Text fontSize="$2" fontWeight="700" color="$color12">
                                  {level.value}
                                </Text>
                                <Text fontSize="$2" textAlign="center" color="$color11">
                                  {level.label}
                                </Text>
                              </YStack>
                            ))}
                          </XStack>
                        </YStack>
                      )
                    }}
                  />
                </YStack>
              </Card>
            )
          })
        )}
      </YStack>

      <Separator />

      {/* Submit Button */}
      <XStack justify="flex-end" pt="$2">
        <UIButton
          variant="primary"
          size="$4"
          onPress={handleSubmit(onSubmit)}
          disabled={!allSkillsRated || updateMutation.isPending}
          icon={updateMutation.isPending ? undefined : CheckCircle2}
          iconAfter={updateMutation.isPending ? <Spinner size="small" /> : undefined}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Assessment'}
        </UIButton>
      </XStack>

      {/* Success Modal */}
      <ResponsiveModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        title="Assessment Complete!"
        size="medium"
        showCloseButton={true}
      >
        <YStack gap="$4" p="$4" items="center">
          <YStack
            width={80}
            height={80}
            rounded="$12"
            bg="$green2"
            borderWidth={2}
            borderColor="$green9"
            items="center"
            justify="center"
          >
            <CheckCircle2 size={48} color="$green10" />
          </YStack>

          <YStack gap="$2" items="center">
            <Text fontSize="$6" fontWeight="700" color="$color12" ta="center">
              Soft Skills Assessment Complete!
            </Text>
            <Text fontSize="$4" color="$color11" ta="center">
              Your assessment has been saved successfully. Your ratings will be used to improve job
              matching and showcase your strengths.
            </Text>
          </YStack>

          <XStack gap="$3" pt="$2">
            <Button variant="outlined" onPress={handleSuccessModalClose}>
              View Profile
            </Button>
            <UIButton
              variant="primary"
              onPress={() => {
                setShowSuccessModal(false)
                router.push(ROUTES.DASHBOARD.DISCOVER.path)
              }}
            >
              Find Matching Jobs
            </UIButton>
          </XStack>
        </YStack>
      </ResponsiveModal>
    </YStack>
  )
}

