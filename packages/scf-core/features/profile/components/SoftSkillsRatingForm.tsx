import {
  useSoftSkills,
  useUpdateSoftSkillsMutation,
} from '@scf/core/utils/profile-skills-sdk-hooks'
import { ROUTES } from '@scf/core/constants/routes'
import { Heading, LoadingState, ResponsiveModal, SaveStatusIndicator, useThemeContext } from '@scaffald/ui'
import { CheckCircle2 } from 'lucide-react-native'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { useToast } from '@scaffald/ui'
import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Button, Card, Separator, Slider, Text, Row, Stack } from '@scaffald/ui'
import { softSkillsUpdateSchema, type SoftSkillsUpdateInput } from '@scf/schemas/profile'
import { SoftSkillsCategoryTabs, type SoftSkillCategory } from './SoftSkillsCategoryTabs'
import { colors } from '@scaffald/ui/tokens'

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
  const { theme } = useThemeContext()
  const router = useRouter()
  const toast = useToast()
  const [activeCategory, setActiveCategory] = useState<SoftSkillCategory>('reliability')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle'
  )
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastAutoSaveRef = useRef<SoftSkillsFormData | null>(null)

  // Fetch soft skills data
  const {
    data,
    isPending: isLoading,
    error,
    refetch,
  } = useSoftSkills(undefined, {
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

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
  const updateMutation = useUpdateSoftSkillsMutation({
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
        const _message =
          error instanceof Error ? error.message : 'Failed to save assessment. Please try again.'
        toast.show({
          title: 'Error',
          message: '',
          variant: 'error',
        })
      }
    },
    [updateMutation, toast]
  )

  // Handle success modal close
  const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false)
    router.push(ROUTES.PROFILE.SKILLS.path)
  }, [router])

  if (isLoading) {
    return <LoadingState message="Loading soft skills assessment..." />
  }

  if (error) {
    return (
      <Stack gap={16} align="center" paddingVertical={32}>
        <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>Failed to load assessment</Text>
        <Text style={{ color: colors.text[theme].secondary }}>{error.message}</Text>
        <Button variant="filled" color="primary" size="sm" onPress={() => void refetch()}>
          Retry
        </Button>
      </Stack>
    )
  }

  if (formSkills.length === 0) {
    return (
      <Stack gap={16} align="center" paddingVertical={32}>
        <Text style={{ color: colors.text[theme].secondary }}>No soft skills available</Text>
        <Text style={{ color: colors.text[theme].secondary }}>Please contact support if this issue persists.</Text>
      </Stack>
    )
  }

  return (
    <Stack gap={16}>
      {/* Header */}
      <Row justify="space-between" align="center">
        <Heading level={3}>Rate Your Soft Skills</Heading>
        <SaveStatusIndicator
          status={autoSaveStatus}
          lastSavedAt={lastSavedAt}
          error={autoSaveStatus === 'error' ? 'Failed to auto-save' : undefined}
        />
      </Row>

      <Text style={{ color: colors.text[theme].secondary }}>
        Rate each soft skill from 1-5 based on your proficiency level. Changes are automatically
        saved every 30 seconds.
      </Text>

      <Separator />

      {/* Category Tabs */}
      <SoftSkillsCategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <Separator />

      {/* Skills List for Active Category */}
      <Stack gap={16}>
        {categorySkills.length === 0 ? (
          <Stack gap={8} align="center" paddingVertical={32}>
            <Text style={{ color: colors.text[theme].secondary }}>No skills in this category</Text>
          </Stack>
        ) : (
          categorySkills.map((skill) => {
            const skillRatingIndex = watchedRatings.findIndex((r) => r.skill_id === skill.id)
            const defaultRating =
              skillRatingIndex >= 0 ? (watchedRatings[skillRatingIndex]?.rating ?? 1) : 1

            if (skillRatingIndex < 0) {
              return null
            }

            return (
              <Card key={skill.id} bordered padding="md" style={{ backgroundColor: colors.bg[theme].default }}>
                <Stack gap={12}>
                  <Stack gap={4}>
                    <Text style={{ color: colors.text[theme].secondary }}>{skill.name}</Text>
                    {skill.description && <Text style={{ color: colors.text[theme].secondary }}>{skill.description}</Text>}
                  </Stack>

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
                        <Stack gap={8}>
                          <Slider
                            value={sliderValue}
                            onValueChange={(newValue) => onChange(newValue)}
                            min={1}
                            max={5}
                            step={1}
                            style={{ marginTop: 16, marginBottom: 8 }}
                          />

                          <Row justify="space-between" gap={8} wrap>
                            {SOFT_SKILL_LEVELS.map((level) => (
                              <Stack
                                key={level.value}
                                flex={1}
                                minWidth={64}
                                style={{ alignItems: 'center', opacity: sliderValue === level.value ? 1 : 0.6 }}
                              >
                                <Text style={{ color: colors.text[theme].secondary }}>{level.value}</Text>
                                <Text style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
                                  {level.label}
                                </Text>
                              </Stack>
                            ))}
                          </Row>
                        </Stack>
                      )
                    }}
                  />
                </Stack>
              </Card>
            )
          })
        )}
      </Stack>

      <Separator />

      {/* Submit Button */}
      <Row justify="flex-end" paddingTop={8}>
        <Button
          variant="filled" color="primary"
          size="md"
          onPress={handleSubmit(onSubmit)}
          disabled={!allSkillsRated || updateMutation.isPending}
          loading={updateMutation.isPending}
          iconStart={updateMutation.isPending ? undefined : CheckCircle2}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Assessment'}
        </Button>
      </Row>

      {/* Success Modal */}
      <ResponsiveModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        title="Assessment Complete!"
        size="md"
      >
        <Stack gap={16} padding="md" align="center">
          <Stack
            width={80}
            height={80}
            borderRadius={12}
            backgroundColor={theme === 'light' ? colors.success[50] : colors.success[900]}
            borderWidth={2}
            borderColor={colors.success[500]}
            align="center"
            justify="center"
          >
            <CheckCircle2 size={48} color={colors.success[500]} />
          </Stack>

          <Stack gap={8} align="center">
            <Text style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
              Soft Skills Assessment Complete!
            </Text>
            <Text style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
              Your assessment has been saved successfully. Your ratings will be used to improve job
              matching and showcase your strengths.
            </Text>
          </Stack>

          <Row gap={12} paddingTop={8}>
            <Button variant="outline" onPress={handleSuccessModalClose}>
              View Profile
            </Button>
            <Button
              variant="filled" color="primary"
              onPress={() => {
                setShowSuccessModal(false)
                router.push(ROUTES.WORKERS.MAP.path)
              }}
            >
              Find Matching Jobs
            </Button>
          </Row>
        </Stack>
      </ResponsiveModal>
    </Stack>
  )
}
