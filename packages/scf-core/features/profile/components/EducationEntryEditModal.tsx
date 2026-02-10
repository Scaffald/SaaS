import { api } from '@scf/core/utils/api'
import {
  Button,
  ConfirmationDialog,
  CustomCheckbox,
  FieldError,
  MonthYearPicker,
  ResponsiveModal,
  ResponsiveSelect,
} from '@unicornlove/beyond-ui'
import { UniversityAutocomplete } from '@scf/core/components/university'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@unicornlove/beyond-ui'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  Input,
  Label,
  Spinner,
  Text,
  TextArea,
  useWindowDimensions,
  Row,
  Stack,
} from '@unicornlove/beyond-ui'
import { DEGREE_TYPE_OPTIONS, singleEducationEntrySchema } from '../config'
import type { EducationEntry, EducationEntryFormValues } from '../types/education'
import { normalizeEducationEntry } from '../utils/education-entry'

// University type definition
interface University {
  id: string
  name: string
  country: string
  alpha_two_code: string
  slug: string
}

type DegreeOption = (typeof DEGREE_TYPE_OPTIONS)[number]

interface EducationEntryEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  educationEntry: EducationEntry | null // The education entry to edit
  onSuccess?: () => void
}

export function EducationEntryEditModal({
  open,
  onOpenChange,
  educationEntry,
  onSuccess,
}: EducationEntryEditModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const originalDataRef = useRef<EducationEntryFormValues | null>(null)
  const { width } = useWindowDimensions()
  const _isMobile = width < 640
  const toast = useToast()

  // University search state
  const [searchQuery, setSearchQuery] = useState('')
  const [manualEntryMode, setManualEntryMode] = useState(false)

  // Queries
  const educationQuery = api.profile.education.getEducation.useQuery()
  const searchUniversitiesQuery = api.office.universities.searchUniversities.useQuery(
    {
      query: searchQuery,
      country: 'United States',
      limit: 5,
    },
    {
      enabled: searchQuery.length >= 3,
      placeholderData: (previousData) => previousData,
    }
  )

  // Mutations
  const saveEducationMutation = api.profile.education.saveEducation.useMutation({
    onSuccess: () => {
      toast.show({
          title: 'Education Updated',
          message: 'Your education entry has been updated successfully!',
        })
      educationQuery.refetch()
      onSuccess?.()
      onOpenChange(false)
    },
    onError: (error: unknown) => {
      const _message =
        error instanceof Error
          ? error.message
          : 'Failed to update education entry. Please try again.'
      toast.show({
          title: 'Error',
          variant: 'error',
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
  } = useForm<EducationEntryFormValues>({
    resolver: zodResolver(singleEducationEntrySchema),
    mode: 'onChange',
  })

  // Load education entry data when modal opens
  useEffect(() => {
    if (open && educationEntry) {
      const formData = normalizeEducationEntry(educationEntry)

      reset(formData)
      originalDataRef.current = formData
      setManualEntryMode(!educationEntry.university_id)
    }
  }, [open, educationEntry, reset])

  const onSubmit = async (data: EducationEntryFormValues) => {
    setIsLoading(true)
    try {
      if (!educationEntry) {
        return
      }

      // Get all existing education entries
      const allEntries: EducationEntryFormValues[] = (educationQuery.data ?? []).map(
        normalizeEducationEntry
      )

      // Update the entry being edited
      const updatedEntries = allEntries.map((entry: EducationEntryFormValues) =>
        entry.id === educationEntry.id ? data : entry
      )

      await saveEducationMutation.mutateAsync({
        education_entries: updatedEntries,
      })
    } catch (error: unknown) {
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
        <Stack gap="$4" padding="$4">
          {/* Institution */}
          <Stack gap="$2">
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
                      <Stack gap="$2">
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
                                errors.institution_name?.message || errors.university_id?.message
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
                            />
                            <FieldError message={errors.institution_name?.message} />
                            <Button
                              size="$2"
                              variant="outlined"
                              onPress={() => {
                                setManualEntryMode(false)
                                nameField.onChange('')
                                universityField.onChange(undefined)
                              }}
                            >
                              Search from catalog instead
                            </Button>
                          </>
                        )}
                      </Stack>
                    )
                  }}
                />
              )}
            />
          </Stack>

          {/* Degree Type */}
          <Stack gap="$2">
            <Text>Degree Type</Text>
            <Controller
              name="degree_type"
              control={control}
              render={({ field }) => (
                <ResponsiveSelect
                  value={field.value ?? ''}
                  onValueChange={(value) =>
                    field.onChange(value === '' ? undefined : (value as DegreeOption))
                  }
                  placeholder="Select degree type"
                  options={DEGREE_TYPE_OPTIONS.map((type) => ({
                    value: type,
                    label: type,
                  }))}
                />
              )}
            />
            {/* Custom Degree Type Input (shown when "Other" is selected) */}
            <Controller
              name="degree_type"
              control={control}
              render={({ field: degreeTypeField }) => {
                const isOther = degreeTypeField.value === 'Other'
                return (
                  <>
                    {isOther && (
                      <Controller
                        name="custom_degree_type"
                        control={control}
                        render={({ field: customField }) => (
                          <>
                            <Input
                              placeholder="Specify degree type"
                              value={customField.value || ''}
                              onChangeText={customField.onChange}
                            />
                            <FieldError message={errors.custom_degree_type?.message} />
                          </>
                        )}
                      />
                    )}
                  </>
                )
              }}
            />
          </Stack>

          {/* Field of Study */}
          <Stack gap="$2">
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
          </Stack>

          {/* GPA */}
          <Stack gap="$2">
            <Text>GPA (Optional)</Text>
            <Controller
              name="gpa"
              control={control}
              render={({ field }) => {
                // Use local state to track raw input for better decimal handling
                const [localValue, setLocalValue] = useState(field.value?.toString() || '')

                // Sync local value when field value changes externally (e.g., form reset)
                useEffect(() => {
                  setLocalValue(field.value?.toString() || '')
                }, [field.value])

                return (
                  <>
                    <Input
                      placeholder="e.g. 3.5 (0.0 - 4.0)"
                      value={localValue}
                      onChangeText={(text) => {
                        // Allow empty string
                        if (text === '') {
                          setLocalValue('')
                          field.onChange(undefined)
                          return
                        }

                        // Allow decimal point and digits
                        // Match pattern: optional digits, optional decimal point, optional single digit after decimal
                        const decimalPattern = /^\d*\.?\d?$/
                        if (!decimalPattern.test(text)) {
                          return // Don't update if invalid pattern
                        }

                        // Update local display value
                        setLocalValue(text)

                        // Parse as float
                        const numValue = Number.parseFloat(text)

                        // Validate range and that it's a valid number
                        if (
                          !Number.isNaN(numValue) &&
                          numValue >= 0 &&
                          numValue <= 4.0 &&
                          // Ensure max 1 decimal place
                          (text.split('.')[1]?.length ?? 0) <= 1
                        ) {
                          // Only update form field if we have a complete number (not just "3.")
                          if (!text.endsWith('.')) {
                            field.onChange(numValue)
                          }
                        }
                      }}
                      onBlur={() => {
                        // On blur, ensure we have a valid number
                        const currentValue = field.value
                        if (currentValue !== undefined && currentValue !== null) {
                          // Round to 1 decimal place
                          const rounded = Math.round(currentValue * 10) / 10
                          field.onChange(rounded)
                          setLocalValue(rounded.toString())
                        } else {
                          setLocalValue('')
                        }
                      }}
                      keyboardType="decimal-pad"
                    />
                    <FieldError message={errors.gpa?.message} />
                  </>
                )
              }}
            />
          </Stack>

          {/* Start and End Dates */}
          <Stack gap="$2">
            <Row gap="$3" $sm={{ flexDirection: 'column' }} $md={{ flexDirection: 'row' }}>
              <Stack gap="$2" flex={1}>
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
              </Stack>
              <Stack gap="$2" flex={1}>
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
              </Stack>
            </Row>

            {/* Currently Enrolled Checkbox */}
            <Controller
              name="is_current"
              control={control}
              render={({ field }) => {
                const isCurrent = Boolean(field.value)
                const handleChange = (next: boolean) => {
                  field.onChange(next)
                  if (next) {
                    setValue('end_date', undefined, { shouldValidate: true })
                  } else {
                    setValue('expected_graduation_date', undefined, {
                      shouldValidate: true,
                    })
                  }
                }

                return (
                  <Row gap="$2" alignItems="center">
                    <CustomCheckbox
                      checked={isCurrent}
                      onCheckedChange={handleChange}
                      testID="education-modal-current"
                      aria-label="Currently enrolled"
                    />
                    <Label onPress={() => handleChange(!isCurrent)}>Currently enrolled</Label>
                  </Row>
                )
              }}
            />

            {/* Expected Graduation Date */}
            {watch('is_current') && (
              <Controller
                name="expected_graduation_date"
                control={control}
                render={({ field }) => (
                  <MonthYearPicker
                    value={field.value ? new Date(field.value) : null}
                    onChange={(date) => {
                      const dateStr = date ? date.toISOString().split('T')[0] : null
                      field.onChange(dateStr || undefined)
                    }}
                    label="Expected Graduation Date"
                    error={errors.expected_graduation_date?.message}
                  />
                )}
              />
            )}
          </Stack>

          {/* Description */}
          <Stack gap="$2">
            <Text>Description</Text>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <>
                  <TextArea
                    placeholder="Describe your education experience, achievements, relevant coursework..."
                    value={field.value || ''}
                    onChangeText={field.onChange}
                    minHeight={80}
                  />
                  <FieldError message={errors.description?.message} />
                </>
              )}
            />
          </Stack>

          {/* Action Buttons */}
          <Row
            justifyContent="flex-end"
            gap="$3"
            paddingTop="$4"
            $sm={{ flexDirection: 'column' }}
            $md={{ flexDirection: 'row' }}
          >
            <Button
              variant="outlined"
              disabled={!isDirty}
              onPress={() => setShowCancelDialog(true)}
              opacity={!isDirty ? 0.5 : 1}
              $sm={{ height: 44, width: '100%' }}
              $md={{ height: undefined, width: undefined }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={handleSubmit(onSubmit)}
              disabled={!isDirty || isLoading}
              opacity={!isDirty || isLoading ? 0.5 : 1}
              $sm={{ height: 44, width: '100%' }}
              $md={{ height: undefined, width: undefined }}
            >
              {isLoading ? (
                <Row gap="$2" alignItems="center">
                  <Spinner size="small" />
                  <Text>Saving...</Text>
                </Row>
              ) : (
                'Save Changes'
              )}
            </Button>
          </Row>
        </Stack>
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
