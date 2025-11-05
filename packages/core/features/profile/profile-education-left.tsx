import { useEffect, useState, useCallback } from 'react'
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  H4,
  TextArea,
  Select,
  Adapt,
  Sheet,
  useWindowDimensions,
  Spinner,
  Checkbox,
  Label,
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
import { DashboardWidget, UniversityAutocomplete } from '@app/ui'
import { api } from '@app/core/utils/api'

// University type definition
interface University {
  id: string
  name: string
  country: string
  alpha_two_code: string
  slug: string
}

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

  // University search state
  const [searchQuery, setSearchQuery] = useState('')
  
  // Track manual entry mode for each education entry (by index)
  const [manualEntryMode, setManualEntryMode] = useState<Record<number, boolean>>({})

  // University search query (only runs when query is valid)
  const searchUniversitiesQuery = api.office.universities.searchUniversities.useQuery(
    {
      query: searchQuery,
      country: 'United States',
      limit: 5,
    },
    {
      enabled: searchQuery.length >= 3,
      keepPreviousData: true,
    }
  )

  // Handle search input changes
  const handleUniversitySearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

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
      type EducationData = NonNullable<typeof educationQuery.data>[number]
      const entries = educationQuery.data.map((edu: EducationData, index: number) => {
        // Set manual entry mode if no university_id
        if (!edu.university_id) {
          setManualEntryMode(prev => ({ ...prev, [index]: true }))
        }
        
        // Determine if degree_type needs to be "Other" (if it's not in the standard list)
        const isStandardDegreeType = edu.degree_type 
          ? (DEGREE_TYPE_OPTIONS as readonly string[]).includes(edu.degree_type)
          : false
        const degreeType = isStandardDegreeType ? edu.degree_type : undefined
        const customDegreeType = !isStandardDegreeType && edu.degree_type ? edu.degree_type : undefined
        
        return {
          id: edu.id,
          university_id: edu.university_id || undefined,
          institution_name: edu.institution_name || '',
          is_verified: edu.is_verified ?? false,
          degree_type: degreeType || (customDegreeType ? 'Other' : undefined),
          custom_degree_type: customDegreeType,
          field_of_study: edu.field_of_study || undefined,
          start_date: edu.start_date || '',
          end_date: edu.end_date || undefined,
          expected_graduation_date: edu.expected_graduation_date || undefined,
          is_current: edu.is_current ?? false,
          gpa: edu.gpa || undefined,
          description: edu.description || undefined,
          location: edu.location || undefined,
        }
      })
      
      reset({
        education_level: educationLevelQuery.data.education_level || undefined,
        education_entries: entries,
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
                    {EDUCATION_LEVEL_OPTIONS.map((level, idx) => (
                      <Select.Item key={level} value={level} index={idx}>
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

              {/* Institution */}
              <YStack gap="$2">
                <Text>Institution *</Text>
                <Controller
                  name={`education_entries.${index}.university_id`}
                  control={control}
                  render={({ field: universityField }) => (
                    <Controller
                      name={`education_entries.${index}.institution_name`}
                      control={control}
                      render={({ field: nameField }) => {
                        const isManualMode = manualEntryMode[index] ?? false;
                        return (
                          <YStack gap="$2">
                            {!isManualMode ? (
                              <>
                                <UniversityAutocomplete
                                  value={nameField.value || ''}
                                  onChange={nameField.onChange}
                          onUniversitySelect={(university: University) => {
                            universityField.onChange(university.id)
                            nameField.onChange(university.name)
                            setValue(`education_entries.${index}.is_verified`, true, { shouldValidate: false })
                            setManualEntryMode(prev => ({ ...prev, [index]: false }))
                          }}
                                  onSearch={handleUniversitySearch}
                                  results={searchUniversitiesQuery.data?.universities || []}
                                  loading={searchUniversitiesQuery.isLoading}
                                  searchError={searchUniversitiesQuery.error?.message}
                                  placeholder="Search for institution..."
                                  error={errors.education_entries?.[index]?.institution_name?.message || errors.education_entries?.[index]?.university_id?.message}
                                />
                                <Button
                                  size="$2"
                                  variant="outlined"
                                  onPress={() => {
                                    setManualEntryMode(prev => ({ ...prev, [index]: true }))
                                    universityField.onChange(null)
                                    setValue(`education_entries.${index}.is_verified`, false, { shouldValidate: false })
                                  }}
                                  alignSelf="flex-start"
                                >
                                  Can't find your institution? Enter it manually
                                </Button>
                              </>
                            ) : (
                              <>
                                <Input
                                  placeholder="Enter institution name"
                                  value={nameField.value || ''}
                                  onChangeText={(text) => {
                                    nameField.onChange(text)
                                    universityField.onChange(null)
                                  }}
                                  error={errors.education_entries?.[index]?.institution_name?.message}
                                />
                                <Button
                                  size="$2"
                                  variant="outlined"
                                  onPress={() => {
                                    setManualEntryMode(prev => ({ ...prev, [index]: false }))
                                    nameField.onChange('')
                                    universityField.onChange(undefined)
                                  }}
                                  alignSelf="flex-start"
                                >
                                  Search from catalog instead
                                </Button>
                              </>
                            )}
                          </YStack>
                        );
                      }}
                    />
                  )}
                />
              </YStack>

              {/* Degree Type */}
              <YStack gap="$2">
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
                          {DEGREE_TYPE_OPTIONS.map((type, idx) => (
                            <Select.Item key={type} value={type} index={idx}>
                              <Select.ItemText>{type}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                        <Select.ScrollDownButton />
                      </Select.Content>
                    </Select>
                  )}
                />
                {/* Custom Degree Type Input (shown when "Other" is selected) */}
                <Controller
                  name={`education_entries.${index}.degree_type`}
                  control={control}
                  render={({ field: degreeTypeField }) => {
                    const isOther = degreeTypeField.value === 'Other';
                    return isOther ? (
                      <Controller
                        name={`education_entries.${index}.custom_degree_type`}
                        control={control}
                        render={({ field: customField }) => (
                          <Input
                            placeholder="Specify degree type"
                            value={customField.value || ''}
                            onChangeText={customField.onChange}
                            error={errors.education_entries?.[index]?.custom_degree_type?.message}
                          />
                        )}
                      />
                    ) : null;
                  }}
                />
              </YStack>

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

              {/* GPA */}
              <YStack gap="$2">
                <Text>GPA (Optional)</Text>
                <Controller
                  name={`education_entries.${index}.gpa`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder="e.g. 3.5 (0.0 - 4.0)"
                      value={field.value?.toString() || ''}
                      onChangeText={(text) => {
                        const numValue = Number.parseFloat(text)
                        if (text === '' || (!Number.isNaN(numValue) && numValue >= 0 && numValue <= 4.0)) {
                          field.onChange(text === '' ? undefined : numValue)
                        }
                      }}
                      keyboardType="numeric"
                      error={errors.education_entries?.[index]?.gpa?.message}
                    />
                  )}
                />
              </YStack>

              {/* Start and End Dates */}
              <YStack gap="$2">
                <XStack gap="$3">
                  <YStack gap="$2" flex={1}>
                    <Text>Start Date *</Text>
                    <Controller
                      name={`education_entries.${index}.start_date`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          placeholder="YYYY-MM-DD"
                          value={field.value || ''}
                          onChangeText={field.onChange}
                          error={errors.education_entries?.[index]?.start_date?.message}
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
                          placeholder="YYYY-MM-DD"
                          value={field.value || ''}
                          onChangeText={field.onChange}
                          error={errors.education_entries?.[index]?.end_date?.message}
                        />
                      )}
                    />
                  </YStack>
                </XStack>
                
                {/* Currently Enrolled Checkbox */}
                <Controller
                  name={`education_entries.${index}.is_current`}
                  control={control}
                  render={({ field }) => (
                    <XStack gap="$2" items="center">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked === true)
                          // Clear end_date when checking current
                          if (checked === true) {
                            setValue(`education_entries.${index}.end_date`, undefined, { shouldValidate: true })
                          }
                        }}
                      >
                        <Checkbox.Indicator />
                      </Checkbox>
                      <Label
                        onPress={() => {
                          const newValue = !field.value
                          field.onChange(newValue)
                          if (newValue) {
                            setValue(`education_entries.${index}.end_date`, undefined, { shouldValidate: true })
                          }
                        }}
                      >
                        Currently enrolled
                      </Label>
                    </XStack>
                  )}
                />
                
                {/* Expected Graduation Date (shown when is_current is true) */}
                <Controller
                  name={`education_entries.${index}.is_current`}
                  control={control}
                  render={({ field: isCurrentField }) => {
                    return isCurrentField.value ? (
                      <YStack gap="$2">
                        <Text>Expected Graduation Date</Text>
                        <Controller
                          name={`education_entries.${index}.expected_graduation_date`}
                          control={control}
                          render={({ field: expectedField }) => (
                            <Input
                              placeholder="YYYY-MM-DD"
                              value={expectedField.value || ''}
                              onChangeText={expectedField.onChange}
                            />
                          )}
                        />
                      </YStack>
                    ) : null;
                  }}
                />
              </YStack>

              {/* Description */}
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
