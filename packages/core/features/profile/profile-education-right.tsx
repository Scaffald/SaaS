import { useState } from 'react'
import { YStack, XStack, Text, Button, Input, H4, TextArea, Select } from 'tamagui'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X, ChevronDown } from '@tamagui/lucide-icons'
import {
  educationProfileSchema,
  type EducationProfileFormData,
  educationProfileDefaults,
  EDUCATION_LEVEL_OPTIONS,
  DEGREE_TYPE_OPTIONS,
  createNewEducationEntry,
} from './config'

/**
 * Profile Education Right Component
 * Form for managing education background
 */
export function ProfileEducationRight() {
  const [isLoading, setIsLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<EducationProfileFormData>({
    resolver: zodResolver(educationProfileSchema),
    defaultValues: educationProfileDefaults,
    mode: 'onChange',
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'education_entries',
  })

  const onSubmit = async (data: EducationProfileFormData) => {
    setIsLoading(true)
    try {
      console.log('Saving education data:', data)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Error saving education:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addEducationEntry = () => {
    append(createNewEducationEntry())
  }

  return (
    <YStack gap="$4" padding="$4" flex={1}>
      <H4>Education Background</H4>

      <YStack gap="$4">
        {/* Education Level */}
        <YStack gap="$2">
          <Text fontWeight="600">Highest Education Level</Text>
          <Controller
            name="education_level"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <Select.Trigger iconAfter={ChevronDown}>
                  <Select.Value placeholder="Select education level" />
                </Select.Trigger>
                <Select.Content>
                  <Select.ScrollUpButton />
                  <Select.Viewport>
                    {EDUCATION_LEVEL_OPTIONS.map((level) => (
                      <Select.Item key={level} value={level} index={0}>
                        <Select.ItemText>{level}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                  <Select.ScrollDownButton />
                </Select.Content>
              </Select>
            )}
          />
        </YStack>

        {/* Education Entries */}
        <YStack gap="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontWeight="600">Education History</Text>
            <Button size="$3" onPress={addEducationEntry} icon={Plus}>
              Add Education
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
                <Text fontWeight="600">Education {index + 1}</Text>
                <Button size="$2" variant="outlined" onPress={() => remove(index)} icon={X}>
                  Remove
                </Button>
              </XStack>

              {/* Institution and Degree */}
              <XStack gap="$3">
                <YStack gap="$2" flex={1}>
                  <Text>Institution *</Text>
                  <Controller
                    name={`education_entries.${index}.institution_name`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="e.g. University of California"
                        value={field.value}
                        onChangeText={field.onChange}
                        borderColor={
                          errors.education_entries?.[index]?.institution_name
                            ? '$red8'
                            : '$borderColor'
                        }
                      />
                    )}
                  />
                  {errors.education_entries?.[index]?.institution_name && (
                    <Text color="$red10" fontSize="$2">
                      {errors.education_entries[index]?.institution_name?.message}
                    </Text>
                  )}
                </YStack>

                <YStack gap="$2" flex={1}>
                  <Text>Degree Type</Text>
                  <Controller
                    name={`education_entries.${index}.degree_type`}
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <Select.Trigger iconAfter={ChevronDown}>
                          <Select.Value placeholder="Select degree type" />
                        </Select.Trigger>
                        <Select.Content>
                          <Select.ScrollUpButton />
                          <Select.Viewport>
                            {DEGREE_TYPE_OPTIONS.map((type) => (
                              <Select.Item key={type} value={type} index={0}>
                                <Select.ItemText>{type}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                          <Select.ScrollDownButton />
                        </Select.Content>
                      </Select>
                    )}
                  />
                </YStack>
              </XStack>

              {/* Field of Study */}
              <YStack gap="$2">
                <Text>Field of Study</Text>
                <Controller
                  name={`education_entries.${index}.field_of_study`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder="e.g. Computer Science"
                      value={field.value || ''}
                      onChangeText={field.onChange}
                    />
                  )}
                />
              </YStack>

              {/* Start and End Dates */}
              <XStack gap="$3">
                <YStack gap="$2" flex={1}>
                  <Text>Start Date</Text>
                  <Controller
                    name={`education_entries.${index}.start_date`}
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
                    name={`education_entries.${index}.end_date`}
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

              {/* GPA and Honors */}
              <XStack gap="$3">
                <YStack gap="$2" flex={1}>
                  <Text>GPA</Text>
                  <Controller
                    name={`education_entries.${index}.gpa`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="e.g. 3.8"
                        value={field.value?.toString() || ''}
                        onChangeText={(text) => field.onChange(text ? parseFloat(text) : undefined)}
                        keyboardType="numeric"
                      />
                    )}
                  />
                </YStack>
                <YStack gap="$2" flex={1}>
                  <Text>Honors</Text>
                  <Controller
                    name={`education_entries.${index}.honors`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="e.g. Magna Cum Laude"
                        value={
                          Array.isArray(field.value) ? field.value.join(', ') : field.value || ''
                        }
                        onChangeText={(text) => field.onChange(text ? text.split(', ') : [])}
                      />
                    )}
                  />
                </YStack>
              </XStack>

              {/* Activities and Description */}
              <YStack gap="$2">
                <Text>Activities & Societies</Text>
                <Controller
                  name={`education_entries.${index}.activities`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder="e.g. Student Government, Honor Society"
                      value={field.value || ''}
                      onChangeText={field.onChange}
                    />
                  )}
                />
              </YStack>

              <YStack gap="$2">
                <Text>Description</Text>
                <Controller
                  name={`education_entries.${index}.description`}
                  control={control}
                  render={({ field }) => (
                    <TextArea
                      placeholder="Describe your education experience, achievements, relevant coursework..."
                      value={field.value || ''}
                      onChangeText={field.onChange}
                      minHeight={80}
                    />
                  )}
                />
              </YStack>
            </YStack>
          ))}

          {fields.length === 0 && (
            <YStack padding="$4" alignItems="center" gap="$2">
              <Text color="$gray11">No education entries added yet</Text>
              <Button onPress={addEducationEntry} icon={Plus}>
                Add Your First Education Entry
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
