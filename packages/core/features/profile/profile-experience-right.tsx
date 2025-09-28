import { useState } from 'react'
import { YStack, XStack, Text, Button, Input, H4, TextArea, Switch, ScrollView } from 'tamagui'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X } from '@tamagui/lucide-icons'
import {
  experienceProfileSchema,
  type ExperienceProfileFormData,
  experienceProfileDefaults,
  createNewExperienceEntry,
} from './config'

/**
 * Profile Experience Right Component
 * Form for managing work experience
 */
export function ProfileExperienceRight() {
  const [isLoading, setIsLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ExperienceProfileFormData>({
    resolver: zodResolver(experienceProfileSchema),
    defaultValues: experienceProfileDefaults,
    mode: 'onChange',
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'experience_entries',
  })

  const onSubmit = async (data: ExperienceProfileFormData) => {
    setIsLoading(true)
    try {
      console.log('Saving experience data:', data)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Error saving experience:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addExperienceEntry = () => {
    append(createNewExperienceEntry())
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack gap="$4" padding="$4" flex={1}>
        <H4>Work Experience</H4>

        <YStack gap="$4">
          {/* Experience Entries */}
          <YStack gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontWeight="600">Your Work Experience</Text>
              <Button size="$3" onPress={addExperienceEntry} icon={Plus}>
                Add Experience
              </Button>
            </XStack>

            {fields.map((field, index) => (
              <YStack
                key={field.id}
                gap="$3"
                padding="$3"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$4"
              >
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontWeight="600">Experience {index + 1}</Text>
                  <Button size="$2" variant="outlined" onPress={() => remove(index)} icon={X}>
                    Remove
                  </Button>
                </XStack>

                {/* Job Title and Company */}
                <XStack gap="$3">
                  <YStack gap="$2" flex={1}>
                    <Text>Job Title *</Text>
                    <Controller
                      name={`experience_entries.${index}.job_title`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          placeholder="e.g. Senior Software Engineer"
                          value={field.value}
                          onChangeText={field.onChange}
                          borderColor={
                            errors.experience_entries?.[index]?.job_title ? '$red8' : '$borderColor'
                          }
                        />
                      )}
                    />
                    {errors.experience_entries?.[index]?.job_title && (
                      <Text color="$red10" fontSize="$2">
                        {errors.experience_entries[index]?.job_title?.message}
                      </Text>
                    )}
                  </YStack>

                  <YStack gap="$2" flex={1}>
                    <Text>Company *</Text>
                    <Controller
                      name={`experience_entries.${index}.company_name`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          placeholder="e.g. Google Inc."
                          value={field.value}
                          onChangeText={field.onChange}
                          borderColor={
                            errors.experience_entries?.[index]?.company_name
                              ? '$red8'
                              : '$borderColor'
                          }
                        />
                      )}
                    />
                    {errors.experience_entries?.[index]?.company_name && (
                      <Text color="$red10" fontSize="$2">
                        {errors.experience_entries[index]?.company_name?.message}
                      </Text>
                    )}
                  </YStack>
                </XStack>

                {/* Location and Employment Type */}
                <XStack gap="$3">
                  <YStack gap="$2" flex={1}>
                    <Text>Location</Text>
                    <Controller
                      name={`experience_entries.${index}.location`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          placeholder="e.g. San Francisco, CA"
                          value={field.value || ''}
                          onChangeText={field.onChange}
                        />
                      )}
                    />
                  </YStack>

                  <YStack gap="$2" flex={1}>
                    <Text>Employment Type</Text>
                    <Controller
                      name={`experience_entries.${index}.employment_type`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          placeholder="e.g. Full-time"
                          value={field.value || ''}
                          onChangeText={field.onChange}
                        />
                      )}
                    />
                  </YStack>
                </XStack>

                {/* Start and End Dates */}
                <XStack gap="$3">
                  <YStack gap="$2" flex={1}>
                    <Text>Start Date</Text>
                    <Controller
                      name={`experience_entries.${index}.start_date`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          placeholder="YYYY-MM-DD"
                          value={field.value || ''}
                          onChangeText={field.onChange}
                        />
                      )}
                    />
                  </YStack>
                  <YStack gap="$2" flex={1}>
                    <Text>End Date</Text>
                    <Controller
                      name={`experience_entries.${index}.end_date`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          placeholder="YYYY-MM-DD or 'Present'"
                          value={field.value || ''}
                          onChangeText={field.onChange}
                        />
                      )}
                    />
                  </YStack>
                </XStack>

                {/* Current Job Toggle */}
                <XStack gap="$3" alignItems="center">
                  <Text>Currently working here</Text>
                  <Controller
                    name={`experience_entries.${index}.is_current`}
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </XStack>

                {/* Description */}
                <YStack gap="$2">
                  <Text>Job Description</Text>
                  <Controller
                    name={`experience_entries.${index}.description`}
                    control={control}
                    render={({ field }) => (
                      <TextArea
                        placeholder="Describe your role, responsibilities, and key achievements..."
                        value={field.value || ''}
                        onChangeText={field.onChange}
                        minHeight={100}
                      />
                    )}
                  />
                </YStack>

                {/* Skills Used */}
                <YStack gap="$2">
                  <Text>Skills Used</Text>
                  <Controller
                    name={`experience_entries.${index}.skills_used`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="e.g. JavaScript, React, Node.js (comma separated)"
                        value={
                          Array.isArray(field.value) ? field.value.join(', ') : field.value || ''
                        }
                        onChangeText={(text) =>
                          field.onChange(text ? text.split(', ').map((s) => s.trim()) : [])
                        }
                      />
                    )}
                  />
                </YStack>

                {/* Achievements */}
                <YStack gap="$2">
                  <Text>Key Achievements</Text>
                  <Controller
                    name={`experience_entries.${index}.key_achievements`}
                    control={control}
                    render={({ field }) => (
                      <TextArea
                        placeholder="List your key achievements and accomplishments in this role..."
                        value={
                          Array.isArray(field.value) ? field.value.join('\n') : field.value || ''
                        }
                        onChangeText={(text) =>
                          field.onChange(text ? text.split('\n').filter((a) => a.trim()) : [])
                        }
                        minHeight={80}
                      />
                    )}
                  />
                </YStack>
              </YStack>
            ))}

            {fields.length === 0 && (
              <YStack padding="$4" alignItems="center" gap="$2">
                <Text color="$gray11">No work experience added yet</Text>
                <Button onPress={addExperienceEntry} icon={Plus}>
                  Add Your First Job
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
    </ScrollView>
  )
}
