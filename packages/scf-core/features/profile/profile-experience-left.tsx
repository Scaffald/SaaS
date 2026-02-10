import { ControlledAddressForm } from '@scf/core/forms'
import { api } from '@scf/core/utils/api'
import {
  Button,
  ConfirmationDialog,
  CustomCheckbox,
  DashboardWidget,
  MonthYearPicker,
  ResponsiveSelect,
} from '@unicornlove/beyond-ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Check, CheckCircle, Plus, X } from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { H4, Input, Label, Spinner, Text, TextArea, Row, Stack } from '@unicornlove/beyond-ui'
import {
  CAREER_LEVEL_OPTIONS,
  createNewExperienceEntry,
  EMPLOYMENT_TYPE_OPTIONS,
  type ExperienceProfileFormData,
  experienceProfileDefaults,
  experienceProfileSchema,
} from './config'

/**
 * Experience entry from API response
 * Based on experienceEntrySchema from the router
 */
type ExperienceEntry = {
  id?: string
  user_id?: string
  organization_id?: string | null
  job_title: string
  company_name: string
  employment_type?: string | null
  location?: string | object | null
  is_remote: boolean
  start_date?: string | null
  end_date?: string | null
  is_current: boolean
  description?: string | null
  created_at?: string
  updated_at?: string
}
import { useExperienceEdit } from './contexts/experience-edit-context'
import { invalidateProfileQueries } from './utils/profile-sync'
import {
  completeProfileSync,
  failProfileSync,
  resetProfileSyncError,
  startProfileSync,
  useAdaptiveProfileSync,
} from './utils/profile-sync-store'

type ExperienceEntries = NonNullable<ExperienceProfileFormData['experience_entries']>

// API response types from tRPC router
type ExperienceApiResponse = ExperienceEntry[]
type ExperienceSummaryApiResponse = { career_level: string | null }

interface SaveExperienceInput {
  career_level: ExperienceProfileFormData['career_level'] | null
  experience_entries: ExperienceEntries
}

interface SaveExperienceContext {
  previousExperience?: ExperienceApiResponse | undefined
  previousSummary?: ExperienceSummaryApiResponse | undefined
}

/**
 * Profile Experience Left Component
 * Form for managing work experience history
 */
export function ProfileExperienceLeft() {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const originalDataRef = useRef<ExperienceProfileFormData | null>(null)
  const syncStatus = useAdaptiveProfileSync(300)
  const isSyncing = syncStatus === 'syncing'
  const { editingEntryId, cancelEditing } = useExperienceEdit()
  const toast = useToast()

  // Queries
  const experienceQuery = api.profile.experience.getExperience.useQuery()
  const experienceSummaryQuery = api.profile.experience.getExperienceSummary.useQuery()
  const utils = api.useContext()

  // Mutations
  const saveExperienceMutation = api.profile.experience.saveExperience.useMutation({
    async onMutate(input: SaveExperienceInput): Promise<SaveExperienceContext> {
      resetProfileSyncError()
      startProfileSync()
      await Promise.all([
        utils.profile.experience.getExperience.cancel(),
        utils.profile.experience.getExperienceSummary.cancel(),
      ])

      const previousExperience = utils.profile.experience.getExperience.getData()
      const previousSummary = utils.profile.experience.getExperienceSummary.getData()

      // Type assertions needed because form data types don't exactly match API response types
      // Form data is compatible but has slightly different optionality
      utils.profile.experience.getExperience.setData(
        undefined,
        input.experience_entries as ExperienceApiResponse
      )
      utils.profile.experience.getExperienceSummary.setData(undefined, {
        career_level: (input.career_level ?? null) as string | null,
      })

      return {
        previousExperience: previousExperience as ExperienceApiResponse | undefined,
        previousSummary: previousSummary as ExperienceSummaryApiResponse | undefined,
      }
    },
    onError: (error: unknown, _input: SaveExperienceInput, context?: SaveExperienceContext) => {
      console.error('Error saving experience:', error)
      if (context?.previousExperience) {
        utils.profile.experience.getExperience.setData(undefined, context.previousExperience)
      }
      if (context?.previousSummary) {
        utils.profile.experience.getExperienceSummary.setData(undefined, context.previousSummary)
      }
      failProfileSync()
      toast.show({
          title: 'Error',
          message: error instanceof Error ? error.message : 'Failed to save experience. Please try again.',
          variant: 'error',
        })
    },
    onSuccess: () => {
      toast.show({
          title: 'Experience Saved',
          message: 'Your work experience has been updated successfully!',
          variant: 'success',
        })
    },
    onSettled: (_data: { success: boolean } | undefined, error: unknown) => {
      if (!error) {
        completeProfileSync()
      }
      void invalidateProfileQueries(utils)
    },
    // Type assertion needed due to tRPC mutation callback type inference limitations
  } as never)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success'>('idle')
  const [saveBanner, setSaveBanner] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const buttonTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
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

  // Load data when queries succeed
  useEffect(() => {
    if (experienceQuery.data && experienceSummaryQuery.data) {
      const formData = {
        career_level: experienceSummaryQuery.data.career_level || undefined,
        experience_entries: (experienceQuery.data as ExperienceEntry[]).map((exp) => {
          // Handle location: prefer location_structured, fallback to location TEXT
          // If location is string, keep as string for backward compatibility
          // ControlledAddressForm will handle conversion to structured format on edit
          const location =
            (exp as ExperienceEntry & { location_structured?: unknown }).location_structured ||
            exp.location ||
            undefined

          // If location is a string and we need structured format, we'll let ControlledAddressForm handle it
          // For now, keep the raw location value (API already transforms it)
          return {
            id: exp.id,
            organization_id: exp.organization_id || undefined,
            job_title: exp.job_title,
            company_name: exp.company_name,
            employment_type: exp.employment_type || undefined,
            location,
            is_remote: exp.is_remote,
            start_date: exp.start_date || undefined,
            end_date: exp.end_date || undefined,
            is_current: exp.is_current,
            description: exp.description || undefined,
          }
        }),
      }
      reset(formData as ExperienceProfileFormData)
      originalDataRef.current = formData as ExperienceProfileFormData
    }
  }, [experienceQuery.data, experienceSummaryQuery.data, reset])

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

  // Handle edit mode - entries are already loaded in form from API
  // When editingEntryId is set, the entry should already exist in form fields
  // The form will display it automatically since all entries are loaded

  const clearTimers = useCallback(() => {
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current)
      bannerTimeoutRef.current = null
    }
    if (buttonTimeoutRef.current) {
      clearTimeout(buttonTimeoutRef.current)
      buttonTimeoutRef.current = null
    }
  }, [])

  const showSuccessFeedback = useCallback(() => {
    setSaveState('success')
    setSaveBanner({ type: 'success', message: 'Changes saved successfully' })

    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current)
    }
    bannerTimeoutRef.current = setTimeout(() => {
      setSaveBanner(null)
      bannerTimeoutRef.current = null
    }, 3000)

    if (buttonTimeoutRef.current) {
      clearTimeout(buttonTimeoutRef.current)
    }
    buttonTimeoutRef.current = setTimeout(() => {
      setSaveState('idle')
      buttonTimeoutRef.current = null
    }, 2000)
  }, [])

  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [clearTimers])

  const onSubmit = async (data: ExperienceProfileFormData) => {
    clearTimers()
    setSaveBanner(null)
    setSaveState('saving')
    try {
      const experienceEntries = (data.experience_entries ?? []) as ExperienceEntries

      await saveExperienceMutation.mutateAsync({
        career_level: data.career_level ?? null,
        experience_entries: experienceEntries,
      })
      showSuccessFeedback()
      // Clear edit mode after successful save
      if (editingEntryId) {
        cancelEditing()
      }
    } catch (error) {
      console.error('Error saving experience:', error)
      setSaveState('idle')
      setSaveBanner({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Failed to save changes. Please try again.',
      })
    }
  }

  const addExperienceEntry = () => {
    append(createNewExperienceEntry())
  }

  // Calculate total years of experience
  const totalExperience = useMemo(() => {
    const entries = watch('experience_entries') || []
    let totalMonths = 0

    for (const entry of entries) {
      if (!entry.start_date || typeof entry.start_date !== 'string') continue

      const start = new Date(entry.start_date)
      const end =
        entry.is_current || !entry.end_date || typeof entry.end_date !== 'string'
          ? new Date()
          : new Date(entry.end_date)

      const months =
        (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
      totalMonths += Math.max(0, months)
    }

    const years = Math.floor(totalMonths / 12)
    const remainingMonths = totalMonths % 12

    return { years, months: remainingMonths }
  }, [watch])

  // Show loading state
  if (experienceQuery.isLoading || experienceSummaryQuery.isLoading) {
    return (
      <DashboardWidget>
        <Stack alignItems="center" justifyContent="center" padding="$8" gap="$4">
          <Spinner size="large" />
          <Text color="$color11">Loading experience data...</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  // Show error state
  if (experienceQuery.isError || experienceSummaryQuery.isError) {
    return (
      <DashboardWidget>
        <Stack alignItems="center" justifyContent="center" padding="$8" gap="$4">
          <Text color="$red10">Failed to load experience data</Text>
          <Button onPress={() => experienceQuery.refetch()}>Retry</Button>
        </Stack>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <H4>Work Experience</H4>

      <Stack gap="$4">
        {/* Experience Summary */}
        <Row gap="$3">
          <Stack gap="$2" flex={1}>
            <Text fontWeight="600">Total Years Experience</Text>
            <Text fontSize="$6" fontWeight="700" color="$blue10">
              {totalExperience.years} years {totalExperience.months} months
            </Text>
          </Stack>

          <Stack gap="$2" flex={1}>
            <Text fontWeight="600">Career Level</Text>
            <Controller
              name="career_level"
              control={control}
              render={({ field }) => (
                <ResponsiveSelect
                  value={field.value || ''}
                  onValueChange={field.onChange}
                  placeholder="Select career level"
                  options={CAREER_LEVEL_OPTIONS.map((level) => ({
                    value: level,
                    label: level,
                  }))}
                />
              )}
            />
          </Stack>
        </Row>

        {/* Experience Entries */}
        <Stack gap="$3">
          <Row justifyContent="space-between" alignItems="center">
            <Text fontWeight="600">Work History</Text>
            <Button size="$3" onPress={addExperienceEntry} icon={Plus}>
              Add Experience
            </Button>
          </Row>

          {fields.map((field, index) => (
            <Stack
              key={field.id}
              gap="$3"
              padding="$3"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
            >
              <Row justifyContent="space-between" alignItems="center">
                <Text fontWeight="600">Position {index + 1}</Text>
                <Button size="$2" variant="outlined" onPress={() => remove(index)} icon={X}>
                  Remove
                </Button>
              </Row>

              {/* Job Title and Company */}
              <Row gap="$3">
                <Stack gap="$2" flex={1}>
                  <Text>Job Title *</Text>
                  <Controller
                    name={`experience_entries.${index}.job_title`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="e.g. Electrician"
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
                </Stack>

                <Stack gap="$2" flex={1}>
                  <Text>Company Name *</Text>
                  <Controller
                    name={`experience_entries.${index}.company_name`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="e.g. ABC Construction"
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
                </Stack>
              </Row>

              {/* Employment Type and Location */}
              <Row gap="$3">
                <Stack gap="$2" flex={1}>
                  <Text>Employment Type</Text>
                  <Controller
                    name={`experience_entries.${index}.employment_type`}
                    control={control}
                    render={({ field }) => (
                      <ResponsiveSelect
                        value={field.value || ''}
                        onValueChange={field.onChange}
                        placeholder="Select type"
                        options={EMPLOYMENT_TYPE_OPTIONS.map((type) => ({
                          value: type,
                          label: type,
                        }))}
                      />
                    )}
                  />
                </Stack>

                <Stack gap="$2" flex={1}>
                  <ControlledAddressForm
                    control={control}
                    name={`experience_entries.${index}.location`}
                    setValue={setValue}
                    trigger={trigger}
                    label="Location"
                    placeholder="Search for company location..."
                    required={false}
                    fieldMapping="nested"
                    storeCoordinates={false}
                    mode="hybrid"
                    provider="mapbox"
                    zoomLevel="city"
                    error={errors.experience_entries?.[index]?.location?.message}
                  />
                  {watch(`experience_entries.${index}.is_remote`) && (
                    <Text fontSize="$2" color="$color11">
                      Enter company headquarters location
                    </Text>
                  )}
                  {errors.experience_entries?.[index]?.location && (
                    <Text color="$red10" fontSize="$2">
                      {errors.experience_entries[index]?.location?.message}
                    </Text>
                  )}
                </Stack>
              </Row>

              {/* Remote Work Checkbox */}
              <Controller
                name={`experience_entries.${index}.is_remote`}
                control={control}
                render={({ field }) => {
                  const isRemote = Boolean(field.value)
                  return (
                    <Row gap="$2" alignItems="center">
                      <CustomCheckbox
                        checked={isRemote}
                        onCheckedChange={field.onChange}
                        testID={`remote-${index}`}
                        aria-label="Remote work"
                      />
                      <Label cursor="pointer" onPress={() => field.onChange(!isRemote)}>
                        Remote Work
                      </Label>
                    </Row>
                  )
                }}
              />

              {/* Start and End Dates */}
              <Row gap="$3">
                <Stack gap="$2" flex={1}>
                  <Controller
                    name={`experience_entries.${index}.start_date`}
                    control={control}
                    render={({ field }) => (
                      <MonthYearPicker
                        value={field.value ? new Date(field.value) : null}
                        onChange={(date) => {
                          // Store as YYYY-MM-DD format (first day of month)
                          const dateStr = date ? date.toISOString().split('T')[0] : null
                          field.onChange(dateStr || undefined)
                        }}
                        error={errors.experience_entries?.[index]?.start_date?.message}
                        label="Start Date"
                      />
                    )}
                  />
                </Stack>

                <Stack gap="$2" flex={1}>
                  <Controller
                    name={`experience_entries.${index}.end_date`}
                    control={control}
                    render={({ field }) => (
                      <MonthYearPicker
                        value={field.value ? new Date(field.value) : null}
                        onChange={(date) => {
                          // Store as YYYY-MM-DD format (first day of month)
                          const dateStr = date ? date.toISOString().split('T')[0] : null
                          field.onChange(dateStr || undefined)
                        }}
                        disabled={watch(`experience_entries.${index}.is_current`)}
                        error={errors.experience_entries?.[index]?.end_date?.message}
                        label="End Date"
                      />
                    )}
                  />
                </Stack>
              </Row>

              {/* Currently Working Checkbox */}
              <Controller
                name={`experience_entries.${index}.is_current`}
                control={control}
                render={({ field }) => {
                  const isCurrent = Boolean(field.value)
                  return (
                    <Row gap="$2" alignItems="center">
                      <CustomCheckbox
                        checked={isCurrent}
                        onCheckedChange={field.onChange}
                        testID={`current-${index}`}
                        aria-label="Currently work here"
                      />
                      <Label cursor="pointer" onPress={() => field.onChange(!isCurrent)}>
                        I currently work here
                      </Label>
                    </Row>
                  )
                }}
              />

              {/* Description */}
              <Stack gap="$2">
                <Text>Job Description</Text>
                <Controller
                  name={`experience_entries.${index}.description`}
                  control={control}
                  render={({ field }) => (
                    <TextArea
                      placeholder="Describe your responsibilities and duties..."
                      value={field.value || ''}
                      onChangeText={field.onChange}
                      minHeight={80}
                    />
                  )}
                />
              </Stack>
            </Stack>
          ))}

          {fields.length === 0 && (
            <Stack padding="$4" alignItems="center" gap="$2">
              <Text color="$color11">No work experience added yet</Text>
            </Stack>
          )}
        </Stack>

        {/* Save Feedback */}
        {saveBanner && (
          <Stack
            marginTop="$4"
            padding="$3"
            gap="$2"
            borderWidth={1}
            borderColor={saveBanner.type === 'success' ? '$green7' : '$red7'}
            backgroundColor={saveBanner.type === 'success' ? '$green3' : '$red3'}
            borderRadius="$4"
          >
            <Row gap="$2" alignItems="center">
              {saveBanner.type === 'success' ? (
                <CheckCircle size={18} color="$green10" />
              ) : (
                <AlertTriangle size={18} color="$red10" />
              )}
              <Text fontWeight="600" color={saveBanner.type === 'success' ? '$green11' : '$red11'}>
                {saveBanner.message}
              </Text>
            </Row>
          </Stack>
        )}

        {/* Action Buttons */}
        <Row justifyContent="flex-end" gap="$3" paddingTop="$4">
          {(editingEntryId || isDirty) && (
            <Button
              variant="outlined"
              disabled={!isDirty && !editingEntryId}
              onPress={() => {
                if (editingEntryId) {
                  cancelEditing()
                  if (originalDataRef.current) {
                    reset(originalDataRef.current)
                  }
                } else {
                  setShowCancelDialog(true)
                }
              }}
              opacity={!isDirty && !editingEntryId ? 0.5 : 1}
            >
              Cancel
            </Button>
          )}
          <Button
            variant="primary"
            onPress={handleSubmit(onSubmit)}
            disabled={!isDirty || saveState === 'saving'}
            opacity={!isDirty || saveState === 'saving' ? 0.5 : 1}
          >
            {saveState === 'success' ? (
              <Row gap="$2" alignItems="center">
                <Check size={18} color="$green10" />
                <Text color="$green10">Saved!</Text>
              </Row>
            ) : isSyncing && saveState === 'saving' ? (
              <Row gap="$2" alignItems="center">
                <Spinner size="small" color="$color12" />
                <Text>Saving...</Text>
              </Row>
            ) : editingEntryId ? (
              'Update Experience'
            ) : (
              'Save Changes'
            )}
          </Button>
        </Row>

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
              if (editingEntryId) {
                cancelEditing()
              }
            }
          }}
        />
      </Stack>
    </DashboardWidget>
  )
}
