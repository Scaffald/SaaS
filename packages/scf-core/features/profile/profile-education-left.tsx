import {
  useDeleteEducationMutation,
  useEducation,
  useEducationLevel,
  useSaveEducationMutationWithSync,
} from '@scf/core/utils/profile-education-sdk-hooks'
import { useSearchUniversities } from '@scf/core/utils/office-universities-sdk-hooks'
import {
  Button,
  Checkbox,
  DashboardWidget,
  FieldError,
  Modal,
  ModalActions,
  ModalHeader,
  Popover,
  PopoverContent,
} from '@scaffald/ui'
import { MonthPicker } from './components/MonthYearPicker'
import { colors } from '@scaffald/ui/tokens'
import { UniversityAutocomplete } from '@scf/core/components/university'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, Plus, X } from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import { useUnsavedChangesPrompt } from '@scf/core/utils/platform'
import { Controller, type Resolver, useFieldArray, useForm } from 'react-hook-form'
import {
  H4,
  Input,
  Label,
  ScrollView,
  Separator,
  Spinner,
  Text,
  TextArea,
  Row,
  Stack,
} from '@scaffald/ui'
import { useThemeContext } from '@scaffald/ui'
import {
  createNewEducationEntry,
  DEGREE_TYPE_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  type EducationProfileFormData,
  educationProfileDefaults,
  educationProfileSchema,
} from './config'
import type { EducationEntry } from './types/education'
import { normalizeEducationEntry } from './utils/education-entry'
import { useAdaptiveProfileSync } from './utils/profile-sync-store'

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

/** The validation summary and the failed-save message share one look. */
const errorBannerStyle = {
  marginTop: 8,
  padding: 12,
  borderWidth: 1,
  borderColor: colors.error[300],
  backgroundColor: colors.error[50],
  borderRadius: 7,
}

/**
 * Profile Education Left Component
 *
 * The form is the list, as in ProfileExperienceLeft: every saved school is an
 * editable entry with its own Remove. It used to hide every saved entry unless
 * a rail beside it asked to edit one; #1275 removed the rail and with it every
 * way to see a saved school here (#1407).
 */
export function ProfileEducationLeft() {
  const { theme } = useThemeContext()
  const [isLoading, setIsLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const originalDataRef = useRef<EducationProfileFormData | null>(null)
  // Saved schools the user removed; the save endpoint only upserts, so these
  // are deleted on Save (and forgotten on Discard).
  const [removedEntryIds, setRemovedEntryIds] = useState<string[]>([])
  const syncStatus = useAdaptiveProfileSync(300)
  const isSyncing = syncStatus === 'syncing'

  // Queries
  const educationQuery = useEducation()
  const educationLevelQuery = useEducationLevel()
  const educationEntries = (educationQuery.data ?? []) as EducationEntry[]

  // A failed save must not cost the user what they typed (#1357). The hook
  // rolls the cache back on error and refetches; the load effect below then
  // reset() the form from that cache, and the new entry silently vanished.
  // While this is set the form keeps its own values; the next submit clears it.
  const keepFormAfterFailedSaveRef = useRef(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Mutations
  const saveEducationMutation = useSaveEducationMutationWithSync({
    onError: () => {
      keepFormAfterFailedSaveRef.current = true
    },
  })
  const deleteEducationMutation = useDeleteEducationMutation()
  const isSaving = saveEducationMutation.isPending || deleteEducationMutation.isPending

  // University search state
  const [searchQuery, setSearchQuery] = useState('')

  // Manual-entry mode the user picked, by field id. Without a choice, a saved
  // school with no catalog id is manual and everything else searches.
  const [manualEntryMode, setManualEntryMode] = useState<Record<string, boolean>>({})

  // University search query (SDK). Only runs when query is valid.
  const searchUniversitiesQuery = useSearchUniversities(
    {
      query: searchQuery,
      country: 'United States',
      limit: 5,
    },
    { enabled: searchQuery.length >= 3 }
  )

  // Handle search input changes
  const handleUniversitySearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<EducationProfileFormData>({
    // SC-59: cast required for @hookform/resolvers v5 — see useFeedbackForm for context.
    resolver: zodResolver(educationProfileSchema) as unknown as Resolver<EducationProfileFormData>,
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
    // Mid-save the cache holds the optimistic copy, then the rollback or the
    // refetch; after a failure it holds data without the user's edits. Either
    // way it is not something to reset the form to. `isSaving` is a dependency
    // so a successful save resets once, from the refetched rows (new ids).
    // `isLoading` spans the whole submit, deletes included: between a delete
    // and the save the cache still holds the old rows.
    if (isSaving || isLoading || keepFormAfterFailedSaveRef.current) return
    if (educationQuery.data && educationLevelQuery.data) {
      const entries = educationEntries.map((edu) => normalizeEducationEntry(edu))

      const formData = {
        education_level: educationLevelQuery.data.education_level || undefined,
        education_entries: entries,
      }
      // Form data from API is compatible with form schema
      reset(formData as EducationProfileFormData)
      originalDataRef.current = formData as EducationProfileFormData
      setRemovedEntryIds([])
    }
  }, [educationQuery.data, educationLevelQuery.data, reset, educationEntries, isSaving, isLoading])

  useUnsavedChangesPrompt(isDirty)

  const onSubmit = async (data: EducationProfileFormData) => {
    setIsLoading(true)
    setSaveError(null)
    keepFormAfterFailedSaveRef.current = false

    try {
      // Removed schools first, one at a time so a failure leaves the rest
      // queued for the next try.
      for (const educationId of removedEntryIds) {
        await deleteEducationMutation.mutateAsync({ educationId })
        setRemovedEntryIds((prev) => prev.filter((id) => id !== educationId))
      }

      await saveEducationMutation.mutateAsync({
        education_level: data.education_level || null,
        education_entries: data.education_entries || [],
      })
    } catch (error) {
      // The form still holds the entries (see keepFormAfterFailedSaveRef);
      // say why they did not save, next to the button that tried.
      keepFormAfterFailedSaveRef.current = true
      console.error('Error saving education:', error)
      setSaveError(
        error instanceof Error && error.message
          ? `Your education could not be saved: ${error.message}`
          : 'Your education could not be saved. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const addEducationEntry = () => {
    append(createNewEducationEntry())
  }

  const removeEducationEntry = (index: number) => {
    const savedId = getValues(`education_entries.${index}.id`)
    if (savedId) {
      setRemovedEntryIds((prev) => (prev.includes(savedId) ? prev : [...prev, savedId]))
    }
    remove(index)
  }

  // Show loading state
  if (educationQuery.isLoading || educationLevelQuery.isLoading) {
    return (
      <DashboardWidget>
        <Stack align="center" justify="center" style={{ padding: 32 }} gap={16}>
          <Spinner variant="ios" size="lg" />
          <Text style={{ color: colors.text[theme].secondary }}>Loading education data...</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  // Show error state
  if (educationQuery.isError || educationLevelQuery.isError) {
    return (
      <DashboardWidget>
        <Stack align="center" justify="center" style={{ padding: 32 }} gap={16}>
          <Text style={{ color: colors.error[500] }}>Failed to load education data</Text>
          <Button onPress={() => educationQuery.refetch()}>Retry</Button>
        </Stack>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <H4>Education Background</H4>

      {errorSummary.length > 0 && (
        <Stack
          style={{
            ...errorBannerStyle,
            marginBottom: 8,
            gap: 8,
          }}
        >
          <Text style={{ color: colors.error[700] }}>Please resolve the following issues:</Text>
          <Stack gap={4}>
            {errorSummary.map((message) => (
              <Text key={message} style={{ color: colors.error[700] }}>
                • {message}
              </Text>
            ))}
          </Stack>
        </Stack>
      )}

      <Stack gap={16}>
        {/* Education Level */}
        <Stack gap={8}>
          <Text>Highest Education Level</Text>
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
        </Stack>

        {/* Education Entries */}
        <Stack gap={12}>
          <Row justify="space-between" align="center">
            <Text>Education History</Text>
            <Button size="sm" onPress={addEducationEntry} iconStart={Plus}>
              Add Education
            </Button>
          </Row>

          {fields.map((field, index) => {
            const entryErrors = educationEntryFieldErrors[index]
            const hasEntryErrors = entryErrors !== undefined && entryErrors !== null
            const entryData = watch(`education_entries.${index}`)
            const isManualMode =
              manualEntryMode[field.id] ?? (Boolean(entryData?.id) && !entryData?.university_id)
            const setManualMode = (next: boolean) =>
              setManualEntryMode((prev) => ({ ...prev, [field.id]: next }))

            return (
              <View key={field.id} testID={`education-entry-${index}`}>
                <Stack
                  gap={12}
                  style={{
                    padding: 12,
                    borderWidth: 1,
                    borderColor: hasEntryErrors ? colors.error[300] : colors.border[theme].default,
                    backgroundColor: hasEntryErrors
                      ? theme === 'light'
                        ? colors.error[50]
                        : colors.error[900]
                      : colors.bg[theme].default,
                    borderRadius: 7,
                  }}
                >
                  <Row justify="space-between" align="center">
                    <Text>{`Education ${index + 1}`}</Text>
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() => removeEducationEntry(index)}
                      iconStart={X}
                      aria-label={`Remove education ${index + 1}`}
                    >
                      Remove
                    </Button>
                  </Row>

                  {/* Institution */}
                  <Stack gap={8}>
                    <Text>Institution *</Text>
                    <Controller
                      name={`education_entries.${index}.university_id`}
                      control={control}
                      render={({ field: universityField }) => (
                        <Controller
                          name={`education_entries.${index}.institution_name`}
                          control={control}
                          render={({ field: nameField }) => {
                            return (
                              <Stack gap={8}>
                                {!isManualMode ? (
                                  <>
                                    <UniversityAutocomplete
                                      // Uncontrolled input that follows the form's name: typing
                                      // writes through onChange, a selection or reset comes back
                                      // in as `value`. A controlled `inputValue` with no
                                      // onInputChange froze the field on the old name (#1359).
                                      value={nameField.value || ''}
                                      onChange={(text) => {
                                        // A selection has already written its name (and id).
                                        if (
                                          text ===
                                          getValues(`education_entries.${index}.institution_name`)
                                        ) {
                                          return
                                        }
                                        nameField.onChange(text)
                                        // Typed away from the catalog pick: it is no longer
                                        // that university, so no longer verified either.
                                        if (getValues(`education_entries.${index}.university_id`)) {
                                          universityField.onChange(null)
                                          setValue(`education_entries.${index}.is_verified`, false, {
                                            shouldValidate: false,
                                          })
                                        }
                                      }}
                                      onUniversitySelect={(university: University) => {
                                        universityField.onChange(university.id)
                                        nameField.onChange(university.name)
                                        setValue(`education_entries.${index}.is_verified`, true, {
                                          shouldValidate: false,
                                        })
                                        setManualMode(false)
                                      }}
                                      onSearch={handleUniversitySearch}
                                      results={
                                        (searchUniversitiesQuery.data?.universities ||
                                          []) as University[]
                                      }
                                      loading={searchUniversitiesQuery.isLoading}
                                      searchError={searchUniversitiesQuery.error?.message}
                                      placeholder="Search for institution..."
                                      error={
                                        entryErrors?.institution_name?.message ||
                                        entryErrors?.university_id?.message
                                      }
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onPress={() => {
                                        setManualMode(true)
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
                                      size="sm"
                                      variant="outline"
                                      onPress={() => {
                                        setManualMode(false)
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
                  <Stack gap={8}>
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
                                    <FieldError
                                      message={entryErrors?.custom_degree_type?.message}
                                    />
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
                  <Stack gap={8}>
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
                  </Stack>

                  {/* GPA */}
                  <Stack gap={8}>
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
                  </Stack>

                  {/* Start and End Dates */}
                  <Stack gap={8}>
                    <Row gap={12}>
                      <Stack gap={8} style={{ flex: 1 }}>
                        <Controller
                          name={`education_entries.${index}.start_date`}
                          control={control}
                          render={({ field }) => (
                            <MonthPicker
                              value={field.value}
                              onChange={(value) => field.onChange(value ?? undefined)}
                              error={entryErrors?.start_date?.message}
                              label="Start Date"
                            />
                          )}
                        />
                      </Stack>
                      <Stack gap={8} style={{ flex: 1 }}>
                        <Controller
                          name={`education_entries.${index}.end_date`}
                          control={control}
                          render={({ field }) => (
                            <MonthPicker
                              value={field.value}
                              onChange={(value) => field.onChange(value ?? undefined)}
                              disabled={watch(`education_entries.${index}.is_current`)}
                              error={entryErrors?.end_date?.message}
                              label="End Date"
                            />
                          )}
                        />
                      </Stack>
                    </Row>

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
                          <Row gap={8} align="center">
                            <Checkbox checked={isCurrent} onChange={handleChange} />
                            <Label onPress={() => handleChange(!isCurrent)}>
                              Currently enrolled
                            </Label>
                          </Row>
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
                                <MonthPicker
                                  value={expectedField.value}
                                  onChange={(value) => expectedField.onChange(value ?? undefined)}
                                  error={entryErrors?.expected_graduation_date?.message}
                                  label="Expected Graduation Date"
                                />
                              )}
                            />
                          )}
                        </>
                      )}
                    />
                  </Stack>

                  {/* Description */}
                  <Stack gap={8}>
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
                            style={{ minHeight: 80 }}
                          />
                          <FieldError message={entryErrors?.description?.message} />
                        </>
                      )}
                    />
                  </Stack>
                </Stack>
              </View>
            )
          })}

          {fields.length === 0 && (
            <Stack style={{ padding: 16 }} align="center" gap={8}>
              <Text style={{ color: colors.text[theme].secondary }}>
                No education entries added yet
              </Text>
            </Stack>
          )}
        </Stack>

        {saveError && (
          <Stack role="alert" style={errorBannerStyle}>
            <Text style={{ color: colors.error[700] }}>{saveError}</Text>
          </Stack>
        )}

        {/* Action Buttons */}
        <Row justify="flex-end" gap={12} style={{ paddingTop: 16 }}>
          <Button
            variant="outline"
            disabled={!isDirty}
            onPress={() => setShowCancelDialog(true)}
            style={{ opacity: !isDirty ? 0.5 : 1 }}
          >
            Cancel
          </Button>
          <Button
            variant="filled"
            color="primary"
            onPress={handleSubmit(onSubmit)}
            disabled={!isDirty || isLoading}
            style={{ opacity: !isDirty || isLoading ? 0.5 : 1 }}
          >
            {isSyncing ? 'Saving...' : 'Save Changes'}
          </Button>
        </Row>

        {/* Cancel Confirmation Modal */}
        <Modal visible={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
          <ModalHeader
            title="Discard Changes?"
            description="You have unsaved changes. Are you sure you want to discard them?"
            onClose={() => setShowCancelDialog(false)}
          />
          <ModalActions
            orientation="right"
            primaryAction={{
              label: 'Discard Changes',
              color: 'error',
              onPress: () => {
                if (originalDataRef.current) {
                  keepFormAfterFailedSaveRef.current = false
                  setSaveError(null)
                  setRemovedEntryIds([])
                  reset(originalDataRef.current)
                  setShowCancelDialog(false)
                }
              },
            }}
            secondaryAction={{
              label: 'Keep Editing',
              onPress: () => setShowCancelDialog(false),
            }}
          />
        </Modal>
      </Stack>
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
  const { theme } = useThemeContext()
  const [open, setOpen] = useState(false)
  const [contentWidth, setContentWidth] = useState<number | undefined>()
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  )

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (disabled) return
      setOpen(nextOpen)
      if (nextOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setContentWidth(rect.width)
      }
    },
    [disabled]
  )

  const handleSelect = useCallback(
    (nextValue: string | undefined) => {
      onValueChange(nextValue)
      setOpen(false)
    },
    [onValueChange]
  )

  const displayLabel = selectedOption?.label ?? placeholder ?? 'Select'

  const popoverContent = (
    <PopoverContent>
      <ScrollView style={{ maxHeight: 280 }}>
        <Stack gap={4} style={{ minWidth: contentWidth ?? 220, maxWidth: 320 }}>
          {allowClear && (
            <Button
              size="sm"
              variant="text"
              onPress={() => handleSelect(undefined)}
              disabled={disabled}
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
                size="sm"
                variant={isSelected ? 'light' : 'text'}
                color={isSelected ? 'primary' : 'gray'}
                onPress={() => handleSelect(option.value)}
                disabled={disabled}
              >
                {option.label}
              </Button>
            )
          })}
        </Stack>
      </ScrollView>
    </PopoverContent>
  )

  return (
    <Stack gap={8}>
      <Popover
        open={open}
        onOpenChange={handleOpenChange}
        content={popoverContent}
        placement="bottom-start"
        width="trigger"
      >
        <Button
          variant="outline"
          iconEnd={ChevronDown}
          disabled={disabled}
          style={{
            borderColor: error ? colors.error[500] : colors.border[theme].default,
          }}
          onPress={() => handleOpenChange(!open)}
        >
          {displayLabel}
        </Button>
      </Popover>
      {error && <Text style={{ color: colors.error[600] }}>{error}</Text>}
    </Stack>
  )
}
