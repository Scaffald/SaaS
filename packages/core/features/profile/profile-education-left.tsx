import { api } from '@app/core/utils/api'
import {
  UIButton as Button,
  ConfirmationDialog,
  CustomCheckbox,
  DashboardWidget,
  FieldError,
  MonthYearPicker,
  Popover,
} from '@scaffald/tamagui-ui'
import { UniversityAutocomplete } from '@app/core/components/university'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, Plus, X } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import {
  H4,
  Input,
  Label,
  ScrollView,
  Separator,
  Spinner,
  Text,
  TextArea,
  XStack,
  YStack,
} from 'tamagui'
import {
  createNewEducationEntry,
  DEGREE_TYPE_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  type EducationProfileFormData,
  educationProfileDefaults,
  educationProfileSchema,
} from './config'
import type { EducationEntry, EducationEntryFormValues } from './types/education'
import { normalizeEducationEntry } from './utils/education-entry'
import { invalidateProfileQueries } from './utils/profile-sync'
import {
  completeProfileSync,
  failProfileSync,
  resetProfileSyncError,
  startProfileSync,
  useAdaptiveProfileSync,
} from './utils/profile-sync-store'

interface SaveEducationInput {
  education_level?: string | null
  education_entries?: EducationEntryFormValues[]
}

interface SaveEducationContext {
  previousEducation?: EducationEntry[] | undefined
  previousLevel?: { education_level: string | null } | undefined
}

interface SaveEducationOutput {
  success: boolean
  education_entries: EducationEntry[]
}

// University type definition
interface University {
  id: string
  name: string
  country: string
  alpha_two_code: string
  slug: string
}

const ERROR_FIELD_LABELS: Record<string, string> = {
  education_level: 'Highest Education Level',
  institution_name: 'Institution Name',
  university_id: 'Institution Selection',
  is_verified: 'Verification Status',
  degree_type: 'Degree Type',
  custom_degree_type: 'Custom Degree Type',
  field_of_study: 'Field of Study',
  start_date: 'Start Date',
  end_date: 'End Date',
  expected_graduation_date: 'Expected Graduation Date',
  is_current: 'Current Enrollment Status',
  gpa: 'GPA',
  description: 'Description',
  location: 'Location',
}

interface ProfileEducationLeftProps {
  editingEntryId?: string | null
  onEditComplete?: () => void
}

/**
 * Profile Education Left Component
 * Form for managing education background
 */
export function ProfileEducationLeft({
  editingEntryId,
  onEditComplete,
}: ProfileEducationLeftProps = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [hiddenEntryIds, setHiddenEntryIds] = useState<Set<string>>(new Set())
  const originalDataRef = useRef<EducationProfileFormData | null>(null)
  const entryRefs = useRef<Record<string, HTMLElement | null>>({})
  const toast = useToastController()
  const syncStatus = useAdaptiveProfileSync(300)
  const isSyncing = syncStatus === 'syncing'

  // Queries
  const educationQuery = api.profile.education.getEducation.useQuery()
  const educationLevelQuery = api.profile.education.getEducationLevel.useQuery()
  const utils = api.useContext()
  const educationEntries = (educationQuery.data ?? []) as EducationEntry[]

  // Mutations
  const saveEducationMutation = api.profile.education.saveEducation.useMutation(
    {
      async onMutate(input: SaveEducationInput): Promise<SaveEducationContext> {
        resetProfileSyncError()
        startProfileSync()
        await Promise.all([
          utils.profile.education.getEducation.cancel(),
          utils.profile.education.getEducationLevel.cancel(),
        ])

        const previousEducation = utils.profile.education.getEducation.getData()
        const previousLevel = utils.profile.education.getEducationLevel.getData()

        // biome-ignore lint/suspicious/noExplicitAny: Form schema is subset of API schema
        utils.profile.education.getEducation.setData(undefined, (input.education_entries ?? []) as any)
        utils.profile.education.getEducationLevel.setData(undefined, {
          education_level: input.education_level ?? null,
          // biome-ignore lint/suspicious/noExplicitAny: Form schema is subset of API schema
        } as any)

        return { previousEducation, previousLevel }
      },
      onError: (error: unknown, _input: SaveEducationInput, context?: SaveEducationContext) => {
      console.error('Error saving education:', error)
      if (context?.previousEducation) {
        // biome-ignore lint/suspicious/noExplicitAny: Form schema is subset of API schema
        utils.profile.education.getEducation.setData(undefined, context.previousEducation as any)
      }
      if (context?.previousLevel) {
        // biome-ignore lint/suspicious/noExplicitAny: Form schema is subset of API schema
        utils.profile.education.getEducationLevel.setData(undefined, context.previousLevel as any)
      }
      failProfileSync()
      toast.show('Save Failed', {
        message:
          error instanceof Error
            ? error.message
            : 'Failed to save education entry. Please try again.',
      })
    },
    onSuccess: () => {
      toast.show('Education Saved', {
        message: 'Your education history has been updated successfully!',
      })
    },
    onSettled: (_data: SaveEducationOutput | undefined, error: unknown) => {
      if (!error) {
        completeProfileSync()
      }
      void invalidateProfileQueries(utils)
    },
    // biome-ignore lint/suspicious/noExplicitAny: Form schema is subset of API schema
    } as any
  )

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
      placeholderData: (previousData) => previousData,
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
    setValue,
    watch,
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

  const errorSummary = useMemo(() => {
    const messages: string[] = []

    const ensurePush = (message: string | undefined) => {
      if (message && !messages.includes(message)) {
        messages.push(message)
      }
    }

    const formatLabel = (key: string) => {
      if (ERROR_FIELD_LABELS[key]) {
        return ERROR_FIELD_LABELS[key]
      }
      return key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
    }

    const traverse = (errorNode: unknown, prefix?: string) => {
      if (!errorNode) {
        return
      }

      if (Array.isArray(errorNode)) {
        for (const [idx, item] of errorNode.entries()) {
          const nextPrefix = prefix ? `${prefix} • Item ${idx + 1}` : `Item ${idx + 1}`
          traverse(item, nextPrefix)
        }
        return
      }

      if (typeof errorNode === 'object') {
        const maybeMessage = (errorNode as { message?: unknown }).message
        if (typeof maybeMessage === 'string' && maybeMessage.length > 0) {
          ensurePush(prefix ? `${prefix}: ${maybeMessage}` : maybeMessage)
          return
        }

        for (const [key, value] of Object.entries(errorNode as Record<string, unknown>)) {
          const label = formatLabel(key)
          const nextPrefix = key === '_root' ? prefix : prefix ? `${prefix} • ${label}` : label
          traverse(value, nextPrefix)
        }
      }
    }

    ensurePush(
      errors.education_level?.message
        ? `Highest Education Level: ${errors.education_level.message}`
        : undefined
    )

    const educationEntryErrors = Array.isArray(errors.education_entries)
      ? errors.education_entries
      : []
    for (let idx = 0; idx < educationEntryErrors.length; idx += 1) {
      const entryErrors = educationEntryErrors[idx]
      if (!entryErrors) {
        continue
      }
      const entryPrefix = `Education ${idx + 1}`
      traverse(entryErrors, entryPrefix)
    }

    return messages.length > 1 ? messages : []
  }, [errors])

  const educationEntryFieldErrors = Array.isArray(errors.education_entries)
    ? errors.education_entries
    : []

  // Load data when queries succeed
  useEffect(() => {
    if (educationQuery.data && educationLevelQuery.data) {
      const entries = educationEntries.map((edu, index) => {
        // Set manual entry mode if no university_id
        if (!edu.university_id) {
          setManualEntryMode((prev) => ({ ...prev, [index]: true }))
        }

        return normalizeEducationEntry(edu)
      })

      const formData = {
        education_level: educationLevelQuery.data.education_level || undefined,
        education_entries: entries,
      }
      // biome-ignore lint/suspicious/noExplicitAny: Form schema is subset of API schema
      reset(formData as any)
      // biome-ignore lint/suspicious/noExplicitAny: Form schema is subset of API schema
      originalDataRef.current = formData as any

      // Clear hidden entries - we'll set them after fields update
      setHiddenEntryIds(new Set())
    }
  }, [educationQuery.data, educationLevelQuery.data, reset])

  // Hide all existing entries after form data loads
  useEffect(() => {
    if (fields.length > 0 && educationQuery.data) {
      const existingEntryFieldIds: string[] = []
      fields.forEach((field, index) => {
        const entryData = watch(`education_entries.${index}`)
        // Hide if it has an ID (existing entry) and is not being edited
        if (entryData?.id && entryData.id !== editingEntryId) {
          existingEntryFieldIds.push(field.id)
        }
      })

      if (existingEntryFieldIds.length > 0) {
        setHiddenEntryIds((prev) => {
          const next = new Set(prev)
          for (const id of existingEntryFieldIds) {
            next.add(id)
          }
          return next
        })
      }
    }
  }, [fields, educationQuery.data, editingEntryId, watch])

  // Scroll to editing entry when editingEntryId changes
  useEffect(() => {
    if (editingEntryId) {
      // Find the entry in the form fields by matching the ID
      const entryIndex = fields.findIndex((_field, idx) => {
        const entryData = watch(`education_entries.${idx}`)
        return entryData?.id === editingEntryId
      })

      if (entryIndex !== -1) {
        const entryId = fields[entryIndex].id
        const entryData = watch(`education_entries.${entryIndex}`)

        // Make sure the entry is visible (remove from hidden set)
        setHiddenEntryIds((prev) => {
          const next = new Set(prev)
          next.delete(entryId)
          return next
        })

        // Set manual entry mode based on whether it has a university_id
        if (entryData) {
          const shouldUseManualMode = !entryData.university_id
          setManualEntryMode((prev) => ({
            ...prev,
            [entryIndex]: shouldUseManualMode,
          }))

          // If there's an institution name with a university_id (verified institution),
          // trigger a search to populate results so the value displays in autocomplete
          if (entryData.institution_name && entryData.university_id && !shouldUseManualMode) {
            // Trigger search with the institution name to populate results
            // This ensures the UniversityAutocomplete can find and display the value
            setSearchQuery(entryData.institution_name)
            handleUniversitySearch(entryData.institution_name)
          }
        }

        // Scroll to the entry after a short delay to ensure it's rendered
        setTimeout(() => {
          const element = entryRefs.current[entryId]
          if (element && typeof window !== 'undefined') {
            // Scroll to the entry (web only)
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            // Focus the first input in the entry after another short delay
            setTimeout(() => {
              const firstInput = element.querySelector('input, textarea, button')
              if (firstInput instanceof HTMLElement) {
                firstInput.focus()
              }
            }, 100)
          }
        }, 100)
      }
    }
  }, [editingEntryId, fields, watch, handleUniversitySearch])

  // Browser navigation guard - prevent data loss on page close/navigation
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = '' // Required for Chrome
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const onSubmit = async (data: EducationProfileFormData) => {
    setIsLoading(true)

    // Track which entries are new (without IDs) before save
    const newEntryFieldIds: string[] = []
    data.education_entries?.forEach((entry, index) => {
      if (!entry.id && fields[index]) {
        newEntryFieldIds.push(fields[index].id)
      }
    })

    try {
      await saveEducationMutation.mutateAsync({
        education_level: data.education_level || null,
        education_entries: data.education_entries || [],
      })

      // After successful save, hide ALL entries (both new and edited)
      // They'll be visible in the right column instead
      const allEntryFieldIds = fields.map((field) => field.id)
      if (allEntryFieldIds.length > 0) {
        setHiddenEntryIds((prev) => {
          const next = new Set(prev)
          for (const id of allEntryFieldIds) {
            next.add(id)
          }
          return next
        })
      }

      // Clear editing state
      if (editingEntryId) {
        onEditComplete?.()
      }
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

      {errorSummary.length > 0 && (
        <YStack
          role="alert"
          mt="$2"
          mb="$2"
          p="$3"
          gap="$2"
          borderWidth={1}
          borderColor="$red7"
          bg="$red3"
          rounded="$4"
        >
          <Text fontWeight="600" color="$red11">
            Please resolve the following issues:
          </Text>
          <YStack gap="$1">
            {errorSummary.map((message) => (
              <Text key={message} color="$red11" fontSize="$3">
                • {message}
              </Text>
            ))}
          </YStack>
        </YStack>
      )}

      <YStack gap="$4">
        {/* Education Level */}
        <YStack gap="$2">
          <Text fontWeight="600">Highest Education Level</Text>
          <Controller
            name="education_level"
            control={control}
            render={({ field }) => (
              <SmartSelect
                value={field.value}
                onValueChange={field.onChange}
                options={EDUCATION_LEVEL_OPTIONS.map((level) => ({
                  label: level,
                  value: level,
                }))}
                placeholder="Select education level"
                error={errors.education_level?.message}
                allowClear
                disabled={isLoading}
              />
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

          {fields.map((field, index) => {
            const entryErrors = educationEntryFieldErrors[index]
            const hasEntryErrors = entryErrors !== undefined && entryErrors !== null
            const entryId = field.id
            const entryData = watch(`education_entries.${index}`)
            const isEditing = editingEntryId === entryData?.id
            const hasId = Boolean(entryData?.id)

            // Hide entry if:
            // 1. It has an ID (existing entry) AND is not being edited
            // 2. OR it's explicitly in the hidden set and not being edited
            const isHidden = (hasId && !isEditing) || (hiddenEntryIds.has(entryId) && !isEditing)

            // Only show forms for:
            // - New entries (no ID)
            // - Entries being edited (isEditing is true)
            if (isHidden) {
              return null
            }

            return (
              <YStack
                key={field.id}
                ref={(el) => {
                  if (el) {
                    // biome-ignore lint/suspicious/noExplicitAny: Ref assignment for dynamic entry management
                    entryRefs.current[entryId] = el as any
                  }
                }}
                gap="$3"
                p="$3"
                borderWidth={1}
                borderColor={isEditing ? '$blue7' : hasEntryErrors ? '$red7' : '$borderColor'}
                bg={isEditing ? '$blue2' : hasEntryErrors ? '$red2' : '$background'}
                rounded="$4"
              >
                <XStack justify="space-between" items="center">
                  <Text fontWeight="600">
                    {entryData?.id ? 'Edit Education' : `Education ${index + 1}`}
                  </Text>
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
                          const isManualMode = manualEntryMode[index] ?? false
                          return (
                            <YStack gap="$2">
                              {!isManualMode ? (
                                <>
                                  <UniversityAutocomplete
                                    value={nameField.value || ''}
                                    // Control input value when editing to display institution name
                                    // This ensures the value shows even if not in search results yet
                                    inputValue={
                                      isEditing && nameField.value ? nameField.value : undefined
                                    }
                                    onChange={nameField.onChange}
                                    onUniversitySelect={(university: University) => {
                                      universityField.onChange(university.id)
                                      nameField.onChange(university.name)
                                      setValue(`education_entries.${index}.is_verified`, true, {
                                        shouldValidate: false,
                                      })
                                      setManualEntryMode((prev) => ({ ...prev, [index]: false }))
                                    }}
                                    onSearch={handleUniversitySearch}
                                    results={searchUniversitiesQuery.data?.universities || []}
                                    loading={searchUniversitiesQuery.isLoading}
                                    searchError={searchUniversitiesQuery.error?.message}
                                    placeholder="Search for institution..."
                                    error={
                                      entryErrors?.institution_name?.message ||
                                      entryErrors?.university_id?.message
                                    }
                                  />
                                  <Button
                                    size="$2"
                                    variant="outlined"
                                    onPress={() => {
                                      setManualEntryMode((prev) => ({ ...prev, [index]: true }))
                                      universityField.onChange(null)
                                      setValue(`education_entries.${index}.is_verified`, false, {
                                        shouldValidate: false,
                                      })
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
                                    aria-label="Institution name"
                                    accessibilityLabel="Institution name"
                                    aria-required="true"
                                  />
                                  <FieldError message={entryErrors?.institution_name?.message} />
                                  <Button
                                    size="$2"
                                    variant="outlined"
                                    onPress={() => {
                                      setManualEntryMode((prev) => ({ ...prev, [index]: false }))
                                      nameField.onChange('')
                                      universityField.onChange(undefined)
                                    }}
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
                    name={`education_entries.${index}.degree_type`}
                    control={control}
                    render={({ field }) => (
                      <SmartSelect
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value)
                          if (value !== 'Other') {
                            setValue(`education_entries.${index}.custom_degree_type`, undefined, {
                              shouldValidate: true,
                            })
                          }
                        }}
                        options={DEGREE_TYPE_OPTIONS.map((type) => ({
                          label: type,
                          value: type,
                        }))}
                        placeholder="Select degree type"
                        allowClear
                        error={entryErrors?.degree_type?.message}
                      />
                    )}
                  />
                  {/* Custom Degree Type Input (shown when "Other" is selected) */}
                  <Controller
                    name={`education_entries.${index}.degree_type`}
                    control={control}
                    render={({ field: degreeTypeField }) => {
                      const isOther = degreeTypeField.value === 'Other'
                      return (
                        <>
                          {isOther && (
                            <Controller
                              name={`education_entries.${index}.custom_degree_type`}
                              control={control}
                              render={({ field: customField }) => (
                                <>
                                  <Input
                                    placeholder="Specify degree type"
                                    value={customField.value || ''}
                                    onChangeText={customField.onChange}
                                    aria-label="Custom degree type"
                                    accessibilityLabel="Custom degree type"
                                  />
                                  <FieldError message={entryErrors?.custom_degree_type?.message} />
                                </>
                              )}
                            />
                          )}
                        </>
                      )
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
                        aria-label="Field of study"
                        accessibilityLabel="Field of study"
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
                            aria-label="GPA"
                            accessibilityLabel="GPA"
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
                          <FieldError message={entryErrors?.gpa?.message} />
                        </>
                      )
                    }}
                  />
                </YStack>

                {/* Start and End Dates */}
                <YStack gap="$2">
                  <XStack gap="$3">
                    <YStack gap="$2" flex={1}>
                      <Controller
                        name={`education_entries.${index}.start_date`}
                        control={control}
                        render={({ field }) => (
                          <MonthYearPicker
                            value={field.value ? new Date(field.value) : null}
                            onChange={(date) => {
                              // Store as YYYY-MM-DD format (first day of month)
                              const dateStr = date ? date.toISOString().split('T')[0] : null
                              field.onChange(dateStr || undefined)
                            }}
                            error={entryErrors?.start_date?.message}
                            label="Start Date"
                          />
                        )}
                      />
                    </YStack>
                    <YStack gap="$2" flex={1}>
                      <Controller
                        name={`education_entries.${index}.end_date`}
                        control={control}
                        render={({ field }) => (
                          <MonthYearPicker
                            value={field.value ? new Date(field.value) : null}
                            onChange={(date) => {
                              // Store as YYYY-MM-DD format (first day of month)
                              const dateStr = date ? date.toISOString().split('T')[0] : null
                              field.onChange(dateStr || undefined)
                            }}
                            disabled={watch(`education_entries.${index}.is_current`)}
                            error={entryErrors?.end_date?.message}
                            label="End Date"
                          />
                        )}
                      />
                    </YStack>
                  </XStack>

                  {/* Currently Enrolled Checkbox */}
                  <Controller
                    name={`education_entries.${index}.is_current`}
                    control={control}
                    render={({ field }) => {
                      const isCurrent = Boolean(field.value)
                      const handleChange = (next: boolean) => {
                        field.onChange(next)
                        if (next) {
                          setValue(`education_entries.${index}.end_date`, undefined, {
                            shouldValidate: true,
                          })
                        } else {
                          setValue(
                            `education_entries.${index}.expected_graduation_date`,
                            undefined,
                            { shouldValidate: true }
                          )
                        }
                      }

                      return (
                        <XStack gap="$2" items="center">
                          <CustomCheckbox
                            checked={isCurrent}
                            onCheckedChange={handleChange}
                            testID={`education-current-${index}`}
                            aria-label="Currently enrolled"
                          />
                          <Label onPress={() => handleChange(!isCurrent)}>Currently enrolled</Label>
                        </XStack>
                      )
                    }}
                  />

                  {/* Expected Graduation Date (shown when is_current is true) */}
                  <Controller
                    name={`education_entries.${index}.is_current`}
                    control={control}
                    render={({ field: isCurrentField }) => (
                      <>
                        {isCurrentField.value && (
                          <Controller
                            name={`education_entries.${index}.expected_graduation_date`}
                            control={control}
                            render={({ field: expectedField }) => (
                              <MonthYearPicker
                                value={expectedField.value ? new Date(expectedField.value) : null}
                                onChange={(date) => {
                                  // Store as YYYY-MM-DD format (first day of month)
                                  const dateStr = date ? date.toISOString().split('T')[0] : null
                                  expectedField.onChange(dateStr || undefined)
                                }}
                                error={entryErrors?.expected_graduation_date?.message}
                                label="Expected Graduation Date"
                              />
                            )}
                          />
                        )}
                      </>
                    )}
                  />
                </YStack>

                {/* Description */}
                <YStack gap="$2">
                  <Text>Description</Text>
                  <Controller
                    name={`education_entries.${index}.description`}
                    control={control}
                    render={({ field }) => (
                      <>
                        <TextArea
                          placeholder="Describe your education experience, achievements, relevant coursework..."
                          value={field.value || ''}
                          onChangeText={field.onChange}
                          minH={80}
                        />
                        <FieldError message={entryErrors?.description?.message} />
                      </>
                    )}
                  />
                </YStack>
              </YStack>
            )
          })}

          {fields.length === 0 && (
            <YStack p="$4" items="center" gap="$2">
              <Text color="$color11">No education entries added yet</Text>
            </YStack>
          )}
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
            variant="primary"
            onPress={handleSubmit(onSubmit)}
            disabled={!isDirty || isLoading}
            opacity={!isDirty || isLoading ? 0.5 : 1}
          >
            {isSyncing ? 'Saving...' : 'Save Changes'}
          </Button>
        </XStack>

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
            }
          }}
        />
      </YStack>
    </DashboardWidget>
  )
}

interface SmartSelectOption {
  label: string
  value: string
}

interface SmartSelectProps {
  value?: string
  onValueChange: (value: string | undefined) => void
  options: SmartSelectOption[]
  placeholder?: string
  disabled?: boolean
  error?: string
  allowClear?: boolean
}

function SmartSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled = false,
  error,
  allowClear = false,
}: SmartSelectProps) {
  const [open, setOpen] = useState(false)
  const [_placement, setPlacement] = useState<'top' | 'bottom'>('bottom')
  const [contentWidth, setContentWidth] = useState<number | undefined>()
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  )

  const evaluatePlacement = useCallback(() => {
    if (typeof window === 'undefined' || !triggerRef.current) {
      return
    }

    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const preferredHeight = 280

    if (spaceBelow < preferredHeight && spaceAbove > spaceBelow) {
      setPlacement('top')
    } else {
      setPlacement('bottom')
    }

    setContentWidth(rect.width)
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    const frame = requestAnimationFrame(evaluatePlacement)

    const handleResize = () => evaluatePlacement()

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize, true)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize, true)
    }
  }, [open, evaluatePlacement])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (disabled) return
      setOpen(nextOpen)
      if (nextOpen) {
        requestAnimationFrame(evaluatePlacement)
      }
    },
    [disabled, evaluatePlacement]
  )

  const handleSelect = useCallback(
    (nextValue: string | undefined) => {
      onValueChange(nextValue)
      setOpen(false)
    },
    [onValueChange]
  )

  const displayLabel = selectedOption?.label ?? placeholder ?? 'Select'

  return (
    <YStack gap="$2">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <Popover.Trigger asChild>
          <Button
            ref={triggerRef}
            variant="outlined"
            justify="space-between"
            iconAfter={ChevronDown}
            disabled={disabled}
            borderColor={error ? '$red9' : '$borderColor'}
            color={selectedOption ? '$color12' : '$color11'}
            onPress={() => handleOpenChange(!open)}
          >
            {displayLabel}
          </Button>
        </Popover.Trigger>

        <Popover.Content
          elevate
          animation="quick"
          enterStyle={{ opacity: 0, scale: 0.96 }}
          exitStyle={{ opacity: 0, scale: 0.96 }}
          borderWidth={1}
          borderColor="$borderColor"
          bg="$color2"
          p="$2"
          style={{
            width: contentWidth,
            minWidth: contentWidth ?? 220,
            maxWidth: 320,
          }}
        >
          <ScrollView style={{ maxHeight: 280 }}>
            <YStack gap="$1">
              {allowClear && (
                <Button
                  size="$2"
                  chromeless
                  justify="flex-start"
                  onPress={() => handleSelect(undefined)}
                  disabled={disabled}
                  hoverStyle={{ bg: '$color3' }}
                >
                  Clear selection
                </Button>
              )}
              {allowClear && options.length > 0 && <Separator />}
              {options.map((option) => {
                const isSelected = option.value === value
                return (
                  <Button
                    key={option.value}
                    size="$3"
                    chromeless
                    justify="flex-start"
                    onPress={() => handleSelect(option.value)}
                    disabled={disabled}
                    bg={isSelected ? '$blue3' : 'transparent'}
                    hoverStyle={{ bg: '$blue4' }}
                    rounded="$3"
                    color={isSelected ? '$blue12' : '$color12'}
                  >
                    {option.label}
                  </Button>
                )
              })}
            </YStack>
          </ScrollView>
        </Popover.Content>
      </Popover>
      {error && (
        <Text fontSize="$2" color="$red10">
          {error}
        </Text>
      )}
    </YStack>
  )
}
