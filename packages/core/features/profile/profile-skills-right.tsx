import { useState } from 'react'
import { YStack, XStack, Text, Button, Input, H4, Slider } from 'tamagui'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X } from '@tamagui/lucide-icons'
import {
  skillsProfileSchema,
  type SkillsProfileFormData,
  skillsProfileDefaults,
  PROFICIENCY_LEVELS,
} from './config'

/**
 * Profile Skills Right Component
 * Form for managing skills and proficiency levels
 */
export function ProfileSkillsRight() {
  const [isLoading, setIsLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<SkillsProfileFormData>({
    resolver: zodResolver(skillsProfileSchema),
    defaultValues: skillsProfileDefaults,
    mode: 'onChange',
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'skills',
  })

  const onSubmit = async (data: SkillsProfileFormData) => {
    setIsLoading(true)
    try {
      console.log('Saving skills data:', data)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Error saving skills:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addSkill = () => {
    append({
      skill_id: '',
      skill_name: '',
      proficiency: 3,
      years_experience: 0,
      is_primary: false,
      endorsed_count: 0,
    })
  }

  return (
    <YStack space="$4" padding="$4" flex={1}>
      <H4>Skills & Expertise</H4>

      <YStack space="$4">
        {/* Skills List */}
        <YStack space="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontWeight="600">Your Skills</Text>
            <Button size="$3" onPress={addSkill} icon={Plus}>
              Add Skill
            </Button>
          </XStack>

          {fields.map((field, index) => (
            <YStack
              key={field.id}
              space="$3"
              padding="$3"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
            >
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontWeight="600">Skill {index + 1}</Text>
                <Button size="$2" variant="outlined" onPress={() => remove(index)} icon={X}>
                  Remove
                </Button>
              </XStack>

              {/* Skill Name */}
              <YStack space="$2">
                <Text>Skill Name *</Text>
                <Controller
                  name={`skills.${index}.skill_name`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder="e.g. JavaScript, Welding, Project Management"
                      value={field.value}
                      onChangeText={field.onChange}
                      borderColor={errors.skills?.[index]?.skill_name ? '$red8' : '$borderColor'}
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
              <YStack space="$2">
                <Text>Proficiency Level</Text>
                <Controller
                  name={`skills.${index}.proficiency`}
                  control={control}
                  render={({ field }) => (
                    <YStack space="$2">
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
                      <XStack justifyContent="space-between">
                        <Text fontSize="$2" color="$gray11">
                          {PROFICIENCY_LEVELS.find((level) => level.value === field.value)?.label ||
                            'Intermediate'}
                        </Text>
                        <Text fontSize="$2" color="$gray11">
                          {field.value}/5
                        </Text>
                      </XStack>
                    </YStack>
                  )}
                />
              </YStack>

              {/* Years of Experience */}
              <YStack space="$2">
                <Text>Years of Experience</Text>
                <Controller
                  name={`skills.${index}.years_experience`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder="Years of experience"
                      value={field.value?.toString() || ''}
                      onChangeText={(text) => field.onChange(text ? parseInt(text) : 0)}
                      keyboardType="numeric"
                    />
                  )}
                />
              </YStack>
            </YStack>
          ))}

          {fields.length === 0 && (
            <YStack padding="$4" alignItems="center" space="$2">
              <Text color="$gray11">No skills added yet</Text>
              <Button onPress={addSkill} icon={Plus}>
                Add Your First Skill
              </Button>
            </YStack>
          )}
        </YStack>

        {/* Save Button */}
        <XStack justifyContent="flex-end" paddingTop="$4">
          <Button
            onPress={handleSubmit(onSubmit)}
            disabled={!isDirty || isLoading}
            opacity={!isDirty || isLoading ? 0.5 : 1}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </XStack>
      </YStack>
    </YStack>
  )
}
