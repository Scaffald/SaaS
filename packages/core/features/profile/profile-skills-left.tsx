import React, { useState, useEffect } from 'react'
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  H4,
  Slider,
  ScrollView,
  Spinner,
  AnimatePresence,
} from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X } from '@tamagui/lucide-icons'
import {
  skillsProfileSchema,
  type SkillsProfileFormData,
  skillsProfileDefaults,
  PROFICIENCY_LEVELS,
} from './config'
import { api } from '@app/core/utils/api'
import { DashboardWidget } from '@app/ui'

/**
 * Profile Skills Left Component
 * Form for managing skills and proficiency levels
 */
export function ProfileSkillsLeft() {
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToastController()

  const {
    data: skillsData,
    isLoading: isLoadingSkills,
    refetch,
    error: skillsError,
  } = api.profile.getSkills.useQuery(undefined, {
    onError: (error: Error) => {
      console.error('getSkills query error:', error)
    },
    onSuccess: (data: unknown) => {
      console.log('getSkills query success:', data)
    },
  })

  console.log('Skills data:', skillsData)
  console.log('Skills loading:', isLoadingSkills)
  console.log('Skills error:', skillsError)

  const updateSkillsMutation = api.profile.updateSkills.useMutation({
    onSuccess: (data) => {
      console.log('updateSkills mutation success:', data)
      toast.show('Skills Updated', {
        message: 'Your skills have been saved successfully!',
      })
      refetch()
    },
    onError: (error) => {
      console.error('updateSkills mutation error:', error)
      toast.show('Error', {
        message: error.message || 'Failed to save skills. Please try again.',
      })
    },
  })

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<SkillsProfileFormData>({
    resolver: zodResolver(skillsProfileSchema),
    defaultValues: skillsProfileDefaults,
    mode: 'onChange', // Real-time validation
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'skills',
  })

  // Reset form when skills data is loaded
  useEffect(() => {
    if (skillsData) {
      reset(skillsData)
    }
  }, [skillsData, reset])

  const onSubmit = async (data: SkillsProfileFormData) => {
    console.log('Form submitted with data:', data)
    setIsLoading(true)
    try {
      console.log('Calling updateSkillsMutation...')
      const result = await updateSkillsMutation.mutateAsync(data)
      console.log('Mutation result:', result)
    } catch (error) {
      console.error('Mutation error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingSkills) {
    return (
      <YStack gap="$4" p="$4" flex={1} justify="center" items="center">
        <Spinner size="large" />
        <Text>Loading skills...</Text>
      </YStack>
    )
  }

  const addSkill = () => {
    append({
      skill_id: crypto.randomUUID(),
      skill_name: '',
      proficiency: 3,
      years_experience: 0,
      is_primary: false,
      endorsed_count: 0,
    })
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <DashboardWidget>
        <YStack gap="$4" p="$4" flex={1}>
          <H4>Skills & Expertise</H4>

          <YStack gap="$4">
            {/* Skills List */}
            <YStack gap="$3">
              <XStack justify="space-between" items="center">
                <Text fontWeight="600">Your Skills</Text>
                <Button size="$3" onPress={addSkill} icon={Plus}>
                  Add Skill
                </Button>
              </XStack>

              {fields.map((field, index) => (
                <YStack
                  key={field.id}
                  gap="$3"
                  p="$3"
                  borderWidth={1}
                  borderColor="$borderColor"
                  rounded="$4"
                >
                  <XStack justify="space-between" items="center">
                    <Text fontWeight="600">Skill {index + 1}</Text>
                    <Button size="$2" variant="outlined" onPress={() => remove(index)} icon={X}>
                      Remove
                    </Button>
                  </XStack>

                  {/* Skill Name */}
                  <YStack gap="$2">
                    <Text>Skill Name *</Text>
                    <Controller
                      name={`skills.${index}.skill_name`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          placeholder="e.g. JavaScript, Welding, Project Management"
                          value={field.value}
                          onChangeText={field.onChange}
                          borderColor={
                            errors.skills?.[index]?.skill_name ? '$red8' : '$borderColor'
                          }
                        />
                      )}
                    />
                    {errors.skills?.[index]?.skill_name && (
                      <Text color="$red10" fontSize="$2">
                        {errors.skills[index]?.skill_name?.message}
                      </Text>
                    )}
                  </YStack>

                  {/* Proficiency Level */}
                  <YStack gap="$2">
                    <Text>Proficiency Level</Text>
                    <Controller
                      name={`skills.${index}.proficiency`}
                      control={control}
                      render={({ field }) => (
                        <YStack gap="$2">
                          <Slider
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            min={1}
                            max={5}
                            step={1}
                          >
                            <Slider.Track>
                              <Slider.TrackActive />
                            </Slider.Track>
                            <Slider.Thumb index={0} />
                          </Slider>
                          <XStack justify="space-between">
                            <Text fontSize="$2" color="$color11">
                              {PROFICIENCY_LEVELS.find((level) => level.value === field.value)
                                ?.label || 'Intermediate'}
                            </Text>
                            <Text fontSize="$2" color="$color11">
                              {field.value}/5
                            </Text>
                          </XStack>
                        </YStack>
                      )}
                    />
                  </YStack>

                  {/* Years of Experience */}
                  <YStack gap="$2">
                    <Text>Years of Experience</Text>
                    <Controller
                      name={`skills.${index}.years_experience`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          placeholder="Years of experience"
                          value={field.value?.toString() || ''}
                          onChangeText={(text) => field.onChange(text ? Number.parseInt(text) : 0)}
                          keyboardType="numeric"
                        />
                      )}
                    />
                  </YStack>
                </YStack>
              ))}

              {fields.length === 0 && (
                <YStack p="$4" items="center" gap="$2">
                  <Text color="$color11">No skills added yet</Text>
                  <Button onPress={addSkill} icon={Plus}>
                    Add Your First Skill
                  </Button>
                </YStack>
              )}
            </YStack>

            {/* Save Button */}
            <XStack justify="flex-end" pt="$4">
              <Button
                onPress={handleSubmit(onSubmit)}
                disabled={!isDirty || isLoading}
                opacity={!isDirty || isLoading ? 0.5 : 1}
                space={isLoading ? '$2' : 0}
              >
                <AnimatePresence>
                  {isLoading && (
                    <Button.Icon>
                      <Spinner
                        animation="bouncy"
                        enterStyle={{
                          scale: 0,
                        }}
                        exitStyle={{
                          scale: 0,
                        }}
                      />
                    </Button.Icon>
                  )}
                </AnimatePresence>
                <Button.Text>{isLoading ? 'Saving...' : 'Save Changes'}</Button.Text>
              </Button>
            </XStack>
          </YStack>
        </YStack>
      </DashboardWidget>
    </ScrollView>
  )
}
