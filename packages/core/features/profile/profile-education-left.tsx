import { useEffect, useState } from 'react'
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  H4,
  TextArea,
  Select,
  ScrollView,
  Adapt,
  Sheet,
  useWindowDimensions,
  Spinner,
} from 'tamagui'
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
import { DashboardWidget } from '@app/ui'
import { api } from '@app/core/utils/api'

/**
 * Profile Education Right Component
 * Form for managing education background
 */
export function ProfileEducationLeft() {
  const [isLoading, setIsLoading] = useState(false)
  const { width } = useWindowDimensions()
  const isMobile = width < 640

  // Queries
  const educationQuery = api.profile.getEducation.useQuery()
  const educationLevelQuery = api.profile.getEducationLevel.useQuery()

  // Mutations
  const saveEducationMutation = api.profile.saveEducation.useMutation({
    onSuccess: () => {
      educationQuery.refetch()
      educationLevelQuery.refetch()
    },
  })

  const {
    control,
    handleSubmit,
    reset,
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

  // Load data when queries succeed
  useEffect(() => {
    if (educationQuery.data && educationLevelQuery.data) {
      reset({
        education_level: educationLevelQuery.data.education_level || undefined,
        education_entries: educationQuery.data.map((edu) => ({
          id: edu.id,
          institution_name: edu.institution_name,
          degree_type: edu.degree_type || undefined,
          field_of_study: edu.field_of_study || undefined,
          start_date: edu.start_date || undefined,
          end_date: edu.end_date || undefined,
          is_current: edu.is_current,
          gpa: edu.gpa || undefined,
          honors: edu.honors || undefined,
          activities: edu.activities || undefined,
          description: edu.description || undefined,
          location: edu.location || undefined,
          is_verified: edu.is_verified,
        })),
      })
    }
  }, [educationQuery.data, educationLevelQuery.data, reset])

  const onSubmit = async (data: EducationProfileFormData) => {
    setIsLoading(true)
    try {
      await saveEducationMutation.mutateAsync({
        education_level: data.education_level || null,
        education_entries: data.education_entries || [],
      })
    } catch (error) {
      console.error('Error saving education:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addEducationEntry = () => {
    append(createNewEducationEntry())
  }

  // Show loading state
  if (educationQuery.isLoading || educationLevelQuery.isLoading) {
    return (
      <DashboardWidget>
        <YStack items="center" justify="center" p="$8" gap="$4">
          <Spinner size="large" />
          <Text color="$color11">Loading education data...</Text>
        </YStack>
      </DashboardWidget>
    )
  }

  // Show error state
  if (educationQuery.isError || educationLevelQuery.isError) {
    return (
      <DashboardWidget>
        <YStack items="center" justify="center" p="$8" gap="$4">
          <Text color="$red10">Failed to load education data</Text>
          <Button onPress={() => educationQuery.refetch()}>Retry</Button>
        </YStack>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
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

                <Adapt when={isMobile} platform="touch">
                  <Sheet
                    native
                    modal
                    dismissOnSnapToBottom
                    animationConfig={{
                      type: 'spring',
                      damping: 20,
                      mass: 1.2,
                      stiffness: 250,
                    }}
                  >
                    <Sheet.Frame>
                      <Sheet.ScrollView>
                        <Adapt.Contents />
                      </Sheet.ScrollView>
                    </Sheet.Frame>
                    <Sheet.Overlay
                      animation="lazy"
                      enterStyle={{ opacity: 0 }}
                      exitStyle={{ opacity: 0 }}
                    />
                  </Sheet>
                </Adapt>

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
          <XStack justify="space-between" items="center">
            <Text fontWeight="600">Education History</Text>
            <Button size="$3" onPress={addEducationEntry} icon={Plus}>
              Add Education
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

                        <Adapt when={isMobile} platform="touch">
                          <Sheet
                            native
                            modal
                            dismissOnSnapToBottom
                            animationConfig={{
                              type: 'spring',
                              damping: 20,
                              mass: 1.2,
                              stiffness: 250,
                            }}
                          >
                            <Sheet.Frame>
                              <Sheet.ScrollView>
                                <Adapt.Contents />
                              </Sheet.ScrollView>
                            </Sheet.Frame>
                            <Sheet.Overlay
                              animation="lazy"
                              enterStyle={{ opacity: 0 }}
                              exitStyle={{ opacity: 0 }}
                            />
                          </Sheet>
                        </Adapt>

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
                        onChangeText={(text) =>
                          field.onChange(text ? Number.parseFloat(text) : undefined)
                        }
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
                      minH={80}
                    />
                  )}
                />
              </YStack>
            </YStack>
          ))}

          {fields.length === 0 && (
            <YStack p="$4" items="center" gap="$2">
              <Text color="$color11">No education entries added yet</Text>
            </YStack>
          )}
        </YStack>

        {/* Save Button */}
        <XStack justify="flex-end" pt="$4">
          <Button
            onPress={handleSubmit(onSubmit)}
            disabled={!isDirty || isLoading}
            opacity={!isDirty || isLoading ? 0.5 : 1}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </XStack>
      </YStack>
    </DashboardWidget>
  )
}
