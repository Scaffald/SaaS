import { useEffect, useState, useCallback, useRef } from 'react'
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  TextArea,
  Select,
  Adapt,
  Sheet,
  useWindowDimensions,
  Checkbox,
  Label,
  Spinner,
} from 'tamagui'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown } from '@tamagui/lucide-icons'
import {
  educationProfileSchema,
  type EducationProfileFormData,
  DEGREE_TYPE_OPTIONS,
} from '../config'
import {
  ResponsiveModal,
  UniversityAutocomplete,
  ConfirmationDialog,
  MonthYearPicker,
} from '@app/ui'
import { api } from '@app/core/utils/api'
import { useToastController } from '@tamagui/toast'

// University type definition
interface University {
  id: string
  name: string
  country: string
  alpha_two_code: string
  slug: string
}

// biome-ignore lint/suspicious/noExplicitAny: tRPC types not yet generated
type EducationEntry = any

interface EducationEntryEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  educationEntry: EducationEntry | null // The education entry to edit
  onSuccess?: () => void
}

/**
 * Education Entry Edit Modal
 * Modal form for editing a single education entry
 */
export function EducationEntryEditModal({
  open,
  onOpenChange,
  educationEntry,
  onSuccess,
}: EducationEntryEditModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const originalDataRef = useRef<EducationProfileFormData['education_entries'][0] | null>(null)
  const { width } = useWindowDimensions()
  const isMobile = width < 640
  const toast = useToastController()

  // University search state
  const [searchQuery, setSearchQuery] = useState('')
  const [manualEntryMode, setManualEntryMode] = useState(false)

  // Queries
  const educationQuery = api.profile.getEducation.useQuery()
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

  // Mutations
  const saveEducationMutation = api.profile.saveEducation.useMutation({
    onSuccess: () => {
      toast.show('Education Updated', {
        message: 'Your education entry has been updated successfully!',
      })
      educationQuery.refetch()
      onSuccess?.()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.show('Error', {
        message: error.message || 'Failed to update education entry. Please try again.',
      })
    },
  })

  // Handle search input changes
  const handleUniversitySearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<EducationProfileFormData['education_entries'][0]>({
    resolver: zodResolver(
      educationProfileSchema.shape.education_entries.element
    ),
    mode: 'onChange',
  })

  // Load education entry data when modal opens
  useEffect(() => {
    if (open && educationEntry) {
      // Determine if degree_type needs to be "Other" (if it's not in the standard list)
      const isStandardDegreeType = educationEntry.degree_type
        ? (DEGREE_TYPE_OPTIONS as readonly string[]).includes(educationEntry.degree_type)
        : false
      const degreeType = isStandardDegreeType ? educationEntry.degree_type : undefined
      const customDegreeType =
        !isStandardDegreeType && educationEntry.degree_type ? educationEntry.degree_type : undefined

      const formData = {
        id: educationEntry.id,
        university_id: educationEntry.university_id || undefined,
        institution_name: educationEntry.institution_name || '',
        is_verified: educationEntry.is_verified || false,
        degree_type: degreeType || (customDegreeType ? 'Other' : undefined),
        custom_degree_type: customDegreeType || undefined,
        field_of_study: educationEntry.field_of_study || undefined,
        start_date: educationEntry.start_date || undefined,
        end_date: educationEntry.end_date || undefined,
        expected_graduation_date: educationEntry.expected_graduation_date || undefined,
        is_current: educationEntry.is_current || false,
        gpa: educationEntry.gpa || undefined,
        description: educationEntry.description || undefined,
        location: educationEntry.location || undefined,
      }

      reset(formData)
      originalDataRef.current = formData
      setManualEntryMode(!educationEntry.university_id)
    }
  }, [open, educationEntry, reset])

  const onSubmit = async (data: EducationProfileFormData['education_entries'][0]) => {
    setIsLoading(true)
    try {
      // Get all existing education entries
      const allEntries = educationQuery.data || []
      
      // Update the entry being edited
      // biome-ignore lint/suspicious/noExplicitAny: tRPC types not yet generated
      const updatedEntries = allEntries.map((entry: any) =>
        entry.id === educationEntry.id ? data : entry
      )

      await saveEducationMutation.mutateAsync({
        education_entries: updatedEntries,
      })
    } catch (error) {
      console.error('Error updating education:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (isDirty) {
      setShowCancelDialog(true)
    } else {
      onOpenChange(false)
    }
  }

  if (!educationEntry) return null

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={handleClose}
        title="Edit Education Entry"
        size="large"
      >
        <YStack gap="$4" p="$4">
          {/* Institution */}
          <YStack gap="$2">
            <Text>Institution *</Text>
            <Controller
              name="university_id"
              control={control}
              render={({ field: universityField }) => (
                <Controller
                  name="institution_name"
                  control={control}
                  render={({ field: nameField }) => {
                    return (
                      <YStack gap="$2">
                        {!manualEntryMode ? (
                          <>
                            <UniversityAutocomplete
                              value={nameField.value || ''}
                              onChange={nameField.onChange}
                              onUniversitySelect={(university: University) => {
                                universityField.onChange(university.id)
                                nameField.onChange(university.name)
                                setValue('is_verified', true, { shouldValidate: false })
                                setManualEntryMode(false)
                              }}
                              onSearch={handleUniversitySearch}
                              results={searchUniversitiesQuery.data?.universities || []}
                              loading={searchUniversitiesQuery.isLoading}
                              searchError={searchUniversitiesQuery.error?.message}
                              placeholder="Search for institution..."
                              error={
                                errors.institution_name?.message ||
                                errors.university_id?.message
                              }
                            />
                            <Button
                              size="$2"
                              variant="outlined"
                              onPress={() => {
                                setManualEntryMode(true)
                                universityField.onChange(null)
                                setValue('is_verified', false, { shouldValidate: false })
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
                              error={errors.institution_name?.message}
                            />
                            <Button
                              size="$2"
                              variant="outlined"
                              onPress={() => {
                                setManualEntryMode(false)
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
                    )
                  }}
                />
              )}
            />
          </YStack>

          {/* Degree Type */}
          <YStack gap="$2">
            <Text>Degree Type</Text>
            <Controller
              name="degree_type"
              control={control}
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={field.onChange} placement="bottom">
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
              name="degree_type"
              control={control}
              render={({ field: degreeTypeField }) => {
                const isOther = degreeTypeField.value === 'Other'
                return isOther ? (
                  <Controller
                    name="custom_degree_type"
                    control={control}
                    render={({ field: customField }) => (
                      <Input
                        placeholder="Specify degree type"
                        value={customField.value || ''}
                        onChangeText={customField.onChange}
                        error={errors.custom_degree_type?.message}
                      />
                    )}
                  />
                ) : null
              }}
            />
          </YStack>

          {/* Field of Study */}
          <YStack gap="$2">
            <Text>Field of Study</Text>
            <Controller
              name="field_of_study"
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
              name="gpa"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder="e.g. 3.5 (0.0 - 4.0)"
                  value={field.value?.toString() || ''}
                  onChangeText={(text) => {
                    const numValue = Number.parseFloat(text)
                    if (
                      text === '' ||
                      (!Number.isNaN(numValue) && numValue >= 0 && numValue <= 4.0)
                    ) {
                      field.onChange(text === '' ? undefined : numValue)
                    }
                  }}
                  keyboardType="numeric"
                  error={errors.gpa?.message}
                />
              )}
            />
          </YStack>

          {/* Start and End Dates */}
          <YStack gap="$2">
            <XStack gap="$3">
              <YStack gap="$2" flex={1}>
                <Controller
                  name="start_date"
                  control={control}
                  render={({ field }) => (
                    <MonthYearPicker
                      value={field.value ? new Date(field.value) : null}
                      onChange={(date) => {
                        const dateStr = date ? date.toISOString().split('T')[0] : null
                        field.onChange(dateStr || undefined)
                      }}
                      label="Start Date"
                      error={errors.start_date?.message}
                    />
                  )}
                />
              </YStack>
              <YStack gap="$2" flex={1}>
                <Controller
                  name="end_date"
                  control={control}
                  render={({ field }) => (
                    <MonthYearPicker
                      value={field.value ? new Date(field.value) : null}
                      onChange={(date) => {
                        const dateStr = date ? date.toISOString().split('T')[0] : null
                        field.onChange(dateStr || undefined)
                      }}
                      disabled={watch('is_current')}
                      label="End Date"
                      error={errors.end_date?.message}
                    />
                  )}
                />
              </YStack>
            </XStack>

            {/* Currently Enrolled Checkbox */}
            <Controller
              name="is_current"
              control={control}
              render={({ field }) => (
                <XStack gap="$2" items="center">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked === true)
                      if (checked === true) {
                        setValue('end_date', undefined, { shouldValidate: true })
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
                        setValue('end_date', undefined, { shouldValidate: true })
                      }
                    }}
                  >
                    Currently enrolled
                  </Label>
                </XStack>
              )}
            />

            {/* Expected Graduation Date */}
            <Controller
              name="is_current"
              control={control}
              render={({ field: isCurrentField }) => {
                return isCurrentField.value ? (
                  <Controller
                    name="expected_graduation_date"
                    control={control}
                    render={({ field: expectedField }) => (
                      <MonthYearPicker
                        value={expectedField.value ? new Date(expectedField.value) : null}
                        onChange={(date) => {
                          const dateStr = date ? date.toISOString().split('T')[0] : null
                          expectedField.onChange(dateStr || undefined)
                        }}
                        label="Expected Graduation Date"
                        error={errors.expected_graduation_date?.message}
                      />
                    )}
                  />
                ) : null
              }}
            />
          </YStack>

          {/* Description */}
          <YStack gap="$2">
            <Text>Description</Text>
            <Controller
              name="description"
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

          {/* Action Buttons */}
          <XStack justify="flex-end" gap="$3" pt="$4">
            <Button
              variant="outlined"
              disabled={!isDirty}
              onPress={() => setShowCancelDialog(true)}
              opacity={!isDirty ? 0.5 : 1}
            >
              Cancel
            </Button>
            <Button
              onPress={handleSubmit(onSubmit)}
              disabled={!isDirty || isLoading}
              opacity={!isDirty || isLoading ? 0.5 : 1}
            >
              {isLoading ? (
                <XStack gap="$2" items="center">
                  <Spinner size="small" />
                  <Text>Saving...</Text>
                </XStack>
              ) : (
                'Save Changes'
              )}
            </Button>
          </XStack>
        </YStack>
      </ResponsiveModal>

      {/* Cancel Confirmation Dialog */}
      <ConfirmationDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        confirmTheme="red"
        onConfirm={() => {
          if (originalDataRef.current) {
            reset(originalDataRef.current)
            setShowCancelDialog(false)
            onOpenChange(false)
          }
        }}
      />
    </>
  )
}

