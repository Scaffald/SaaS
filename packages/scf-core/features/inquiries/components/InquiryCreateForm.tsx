import {
  useInquiryTemplates,
  useCreateInquiryTemplateMutation,
  useApplyInquiryTemplateMutation,
  useDeleteInquiryTemplateMutation,
  useInquirySmartDefaults,
} from '@scf/core/utils/inquiries-sdk-hooks'
import type { InquiryCreateInput } from '@scf/schemas'
import {
  Button,
  CustomCheckbox,
  Input,
  ResponsiveSelect,
  ScrollView,
  Separator,
  Sheet,
  Text,
  Row,
  Stack,
} from '@unicornlove/beyond-ui'
import { Info } from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Controller, FormProvider } from 'react-hook-form'
import { Platform } from 'react-native'
import { Switch, TextArea } from '@unicornlove/beyond-ui'
import { useInquiryEdit } from '../hooks/useInquiryEdit'
import { useInquiryForm } from '../hooks/useInquiryForm'
import { InquiryHelpSidebar } from './InquiryHelpSidebar'

const SMART_DEFAULT_FIELD_LABELS: Record<string, string> = {
  employmentType: 'Employment type',
  workSchedule: 'Work schedule',
  workingHoursStart: 'Working hours (start)',
  workingHoursEnd: 'Working hours (end)',
  workingHoursTimezone: 'Working hours timezone',
  workdays: 'Workdays',
  employmentStartDate: 'Employment start date',
  rateType: 'Rate type',
  rateMinCents: 'Minimum rate',
  rateMaxCents: 'Maximum rate',
  workScheduleNegotiable: 'Schedule negotiable',
  workingHoursNegotiable: 'Working hours negotiable',
  workdaysNegotiable: 'Workdays negotiable',
  employmentDatesNegotiable: 'Dates negotiable',
  willingToTravel: 'Willing to travel',
  willingToWorkOvertime: 'Willing to work overtime',
}

interface InquiryCreateFormProps {
  applicationId: string
  inquiryId?: string
  initialData?: InquiryCreateInput
  mode?: 'create' | 'edit'
  onSuccess?: (inquiryId: string) => void
  onCancel?: () => void
}

const WORKDAYS = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
] as const

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'permanent', label: 'Permanent' },
  { value: 'temporary', label: 'Temporary' },
] as const

const WORK_SCHEDULE_OPTIONS = [
  { value: 'full_time', label: 'Full time' },
  { value: 'part_time', label: 'Part time' },
  { value: 'day_week', label: 'Day-Week' },
] as const

const RATE_TYPE_OPTIONS = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'salary', label: 'Salary' },
] as const

// Common timezones (simplified list)
const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
]

const getDateInputProps = () => {
  if (Platform.OS === 'web') {
    return { type: 'date' as const }
  }
  return {
    inputMode: 'numeric' as const,
    keyboardType: 'numbers-and-punctuation' as const,
  }
}

const getTimeInputProps = () => {
  if (Platform.OS === 'web') {
    return { type: 'time' as const, step: 300 }
  }
  return {
    inputMode: 'numeric' as const,
    keyboardType: 'numbers-and-punctuation' as const,
  }
}

export function InquiryCreateForm({
  applicationId,
  inquiryId,
  initialData,
  mode = 'create',
  onSuccess,
  onCancel,
}: InquiryCreateFormProps) {
  // Always call both hooks to satisfy React hooks rules, then use the appropriate one
  const editHook = useInquiryEdit({
    inquiryId: inquiryId || '',
    initialData,
    onSuccess: () => inquiryId && onSuccess?.(inquiryId),
  })

  const createHook = useInquiryForm({
    applicationId,
    onSuccess,
  })

  // Use edit hook if in edit mode, otherwise use create hook
  const hookResult = mode === 'edit' && inquiryId ? editHook : createHook

  // Extract form handlers - edit hook doesn't have handleSaveDraft
  const { form, handleSubmit, isSubmitting } = hookResult
  const handleSaveDraft =
    'handleSaveDraft' in hookResult
      ? hookResult.handleSaveDraft
      : async () => {
          // No-op for edit mode - save draft not applicable
        }

  const toast = useToast()
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [manageTemplatesOpen, setManageTemplatesOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null)
  const [smartDefaultsApplied, setSmartDefaultsApplied] = useState(false)
  const smartDefaultsAutoApplied = useRef(false)

  const {
    data: templatesData,
    isLoading: isTemplatesLoading,
    refetch: refetchTemplates,
  } = useInquiryTemplates(applicationId, {
    enabled: Boolean(applicationId),
  })

  const templates = templatesData ?? []
  type TemplateRow = {
    id: string
    name: string
    description: string | null
    usage_count: number | null
    last_used_at: string | null
  }
  const templateList = templates as TemplateRow[]

  const createTemplateMutation = useCreateInquiryTemplateMutation()
  const applyTemplateMutation = useApplyInquiryTemplateMutation()
  const deleteTemplateMutation = useDeleteInquiryTemplateMutation()

  const { data: smartDefaultsData, isLoading: isSmartDefaultsLoading } = useInquirySmartDefaults(
    applicationId,
    {
      enabled: mode === 'create',
    }
  )

  const templateOptions = useMemo(
    () =>
      templateList.map((template, index) => ({
        id: template.id,
        name: template.name,
        description: template.description ?? '',
        usageCount: template.usage_count ?? 0,
        index,
      })),
    [templateList]
  )

  const smartDefaults = smartDefaultsData?.defaults ?? null
  const smartDefaultFields = (smartDefaultsData?.fields ?? []) as string[]
  const smartDefaultsFieldLabels = useMemo<string[]>(
    () => smartDefaultFields.map((field) => SMART_DEFAULT_FIELD_LABELS[field] ?? field),
    [smartDefaultFields]
  )
  const smartDefaultsFieldCount = smartDefaultFields.length
  const smartDefaultsSourceDescription = useMemo(() => {
    if (!smartDefaultsData?.job) {
      return 'job posting'
    }
    return smartDefaultsData.job.title ?? 'job posting'
  }, [smartDefaultsData])
  const autoFilledFields = useMemo(() => {
    if (!smartDefaultsApplied) {
      return new Set<string>()
    }
    return new Set<string>(smartDefaultFields)
  }, [smartDefaultsApplied, smartDefaultFields])

  const getErrorMessage = useCallback((error: unknown, fallback: string) => {
    if (error instanceof Error) {
      return error.message
    }
    if (typeof error === 'string') {
      return error
    }
    return fallback
  }, [])

  const handleApplyTemplate = useCallback(async () => {
    if (!selectedTemplateId) {
      return
    }

    try {
      const result = await applyTemplateMutation.mutateAsync({
        templateId: selectedTemplateId,
        applicationId,
      })

      if (result?.templateData) {
        form.reset({
          applicationId,
          ...result.templateData,
        } as InquiryCreateInput)
        toast.show({
          title: 'Template applied',
          message: 'Inquiry form has been updated with saved terms.',
        })
      }
    } catch (error) {
      toast.show({
        title: 'Unable to apply template',
        message: getErrorMessage(error, 'Please try again.'),
        variant: 'error',
      })
    }
  }, [selectedTemplateId, applyTemplateMutation, applicationId, form, toast, getErrorMessage])

  const handleSaveTemplate = useCallback(async () => {
    const trimmedName = templateName.trim()
    const trimmedDescription = templateDescription.trim()

    if (!trimmedName) {
      toast.show({
        title: 'Template name required',
        message: 'Please enter a name before saving.',
      })
      return
    }

    const { applicationId: _omitted, ...templateData } = form.getValues()

    try {
      await createTemplateMutation.mutateAsync({
        applicationId,
        name: trimmedName,
        description: trimmedDescription ? trimmedDescription : undefined,
        templateData,
      })

      toast.show({
        title: 'Template saved',
        message: 'You can reuse it for future inquiries.',
        variant: 'success',
      })
      setTemplateName('')
      setTemplateDescription('')
      setSaveTemplateOpen(false)
      refetchTemplates()
    } catch (error) {
      toast.show({
        title: 'Unable to save template',
        message: getErrorMessage(error, 'Please try again.'),
        variant: 'error',
      })
    }
  }, [
    templateName,
    templateDescription,
    form,
    createTemplateMutation,
    applicationId,
    toast,
    refetchTemplates,
    getErrorMessage,
  ])

  const handleDeleteTemplate = useCallback(
    async (templateId: string) => {
      try {
        setDeletingTemplateId(templateId)
        await deleteTemplateMutation.mutateAsync({ templateId })
        toast.show({
          title: 'Template deleted',
          message: 'Removed from your organization templates.',
        })
        if (selectedTemplateId === templateId) {
          setSelectedTemplateId(null)
        }
        refetchTemplates()
      } catch (error) {
        toast.show({
          title: 'Unable to delete template',
          message: getErrorMessage(error, 'Please try again.'),
          variant: 'error',
        })
      } finally {
        setDeletingTemplateId(null)
      }
    },
    [deleteTemplateMutation, toast, selectedTemplateId, refetchTemplates, getErrorMessage]
  )

  const handleApplySmartDefaults = useCallback(
    (options?: { force?: boolean }) => {
      if (!smartDefaults || Object.keys(smartDefaults).length === 0) {
        return
      }
      const nextValues: InquiryCreateInput = {
        ...form.getValues(),
        ...smartDefaults,
      }
      if (options?.force) {
        form.reset(nextValues)
      } else {
        form.reset(nextValues, {
          keepDirty: true,
          keepDirtyValues: true,
        })
      }
      setSmartDefaultsApplied(true)
    },
    [form, smartDefaults]
  )

  const handleClearSmartDefaults = useCallback(() => {
    form.reset()
    setSmartDefaultsApplied(false)
    smartDefaultsAutoApplied.current = true
  }, [form])

  // Pre-populate form if initialData provided
  useEffect(() => {
    if (initialData && form) {
      form.reset(initialData)
    }
  }, [initialData, form])

  const {
    control,
    handleSubmit: handleFormSubmit,
    watch,
    formState: { errors, isDirty },
  } = form

  const watchedValues = watch()

  const onSubmit = handleFormSubmit(async (data) => {
    await handleSubmit(data)
  })

  const onSaveDraft = handleFormSubmit(async (data) => {
    await handleSaveDraft(data)
  })

  useEffect(() => {
    if (
      mode !== 'create' ||
      smartDefaultsAutoApplied.current ||
      !smartDefaults ||
      smartDefaultFields.length === 0 ||
      isDirty
    ) {
      return
    }
    handleApplySmartDefaults()
    smartDefaultsAutoApplied.current = true
  }, [mode, smartDefaults, smartDefaultFields.length, isDirty, handleApplySmartDefaults])

  // Format cents to dollars for display
  const formatCentsToDollars = (cents: number | undefined): string => {
    if (cents === undefined || cents === null) return ''
    return (cents / 100).toFixed(2)
  }

  // Parse dollars to cents
  const parseDollarsToCents = (value: string): number | undefined => {
    const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ''))
    if (Number.isNaN(parsed)) return undefined
    return Math.round(parsed * 100)
  }

  const renderSmartLabel = useCallback(
    (label: string, fieldKeys: string | string[]) => {
      const keys = Array.isArray(fieldKeys) ? fieldKeys : [fieldKeys]
      const isAutoFilled = keys.some((key) => autoFilledFields.has(key))

      return (
        <Row align="center" gap={8}>
          <Text>{label}</Text>
          {isAutoFilled && (
            <Row
              paddingHorizontal={8}
              paddingVertical={4}
              backgroundColor="$green3"
              borderRadius={8}
            >
              <Text color="$green11">Auto-filled</Text>
            </Row>
          )}
        </Row>
      )
    },
    [autoFilledFields]
  )

  return (
    <>
      <FormProvider {...form}>
        <Row gap={16} flex={1}>
          {/* Main Form */}
          <Stack flex={1} gap={16}>
            <ScrollView>
              <Stack gap={24} padding="md">
                {/* Templates Section */}
                <Stack
                  gap={12}
                  padding="sm"
                  borderWidth={1}
                  borderColor="$borderColor"
                  backgroundColor="$background"
                  borderRadius={16}
                >
                  <Row justify="space-between" align="center" gap={12}>
                    <Stack>
                      <Text>Templates</Text>
                      <Text color="$gray11">Reuse saved inquiry terms for this organization.</Text>
                    </Stack>
                    <Row gap={8}>
                      <Button
                        size="sm"
                        variant="outline"
                        onPress={() => setSaveTemplateOpen(true)}
                        disabled={createTemplateMutation.isPending}
                      >
                        Save current
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onPress={() => setManageTemplatesOpen(true)}
                      >
                        Manage
                      </Button>
                    </Row>
                  </Row>

                  <Row gap={8}>
                    <Stack flex={1}>
                      <ResponsiveSelect
                        value={selectedTemplateId || ''}
                        onValueChange={setSelectedTemplateId}
                        placeholder={
                          templates.length === 0 ? 'No templates yet' : 'Choose a template'
                        }
                        disabled={templates.length === 0 || isTemplatesLoading}
                        options={templateOptions.map((template) => ({
                          value: template.id,
                          label: template.name,
                        }))}
                      />
                    </Stack>

                    <Button
                      size="sm"
                      onPress={handleApplyTemplate}
                      disabled={!selectedTemplateId || applyTemplateMutation.isPending}
                    >
                      {applyTemplateMutation.isPending ? 'Applying…' : 'Apply template'}
                    </Button>
                  </Row>

                  {isTemplatesLoading && <Text color="$gray11">Loading templates…</Text>}
                  {!isTemplatesLoading && templates.length === 0 && (
                    <Text color="$gray11">
                      Save templates to quickly reuse standard employment terms.
                    </Text>
                  )}
                </Stack>

                {/* Smart Defaults Banner */}
                {mode === 'create' && (
                  <Stack
                    gap={12}
                    padding="sm"
                    borderWidth={1}
                    borderColor="$borderColor"
                    backgroundColor="$background"
                    borderRadius={16}
                  >
                    <Row justify="space-between" align="center" gap={12}>
                      <Stack gap={4} flex={1}>
                        <Text>Smart defaults</Text>
                        {isSmartDefaultsLoading ? (
                          <Text color="$gray11">Loading job-based recommendations…</Text>
                        ) : smartDefaultsFieldCount > 0 ? (
                          <Text color="$gray11">
                            {smartDefaultsApplied
                              ? `Applied ${smartDefaultsFieldCount} field${smartDefaultsFieldCount === 1 ? '' : 's'} from ${smartDefaultsSourceDescription}.`
                              : `Prefill ${smartDefaultsFieldCount} field${smartDefaultsFieldCount === 1 ? '' : 's'} from ${smartDefaultsSourceDescription}.`}
                          </Text>
                        ) : (
                          <Text color="$gray11">No defaults available for this job yet.</Text>
                        )}
                      </Stack>
                      <Row gap={8}>
                        <Button
                          variant="outline"
                          onPress={handleClearSmartDefaults}
                          disabled={!smartDefaultsApplied}
                        >
                          Clear
                        </Button>
                        <Button
                          onPress={() => handleApplySmartDefaults({ force: true })}
                          disabled={smartDefaultsFieldCount === 0}
                        >
                          {smartDefaultsApplied ? 'Reapply defaults' : 'Apply defaults'}
                        </Button>
                      </Row>
                    </Row>
                    {smartDefaultsFieldLabels.length > 0 && (
                      <Row gap={8} flexWrap="wrap">
                        {smartDefaultsFieldLabels.map((label) => (
                          <Stack
                            key={label}
                            paddingHorizontal={8}
                            paddingVertical={4}
                            backgroundColor="$gray3"
                            borderRadius={12}
                          >
                            <Text color="$gray11">{label}</Text>
                          </Stack>
                        ))}
                      </Row>
                    )}
                  </Stack>
                )}

                {/* Employment Section */}
                <Stack gap={16}>
                  <Row align="center" gap={8}>
                    <Text>Employment</Text>
                  </Row>

                  {/* Employment Type */}
                  <Stack gap={8}>
                    {renderSmartLabel('Employment type', 'employmentType')}
                    <Controller
                      control={control}
                      name="employmentType"
                      render={({ field }) => (
                        <Row gap={8}>
                          {EMPLOYMENT_TYPE_OPTIONS.map((option) => {
                            const isSelected = field.value === option.value
                            return (
                              <Button
                                key={option.value}
                                flex={1}
                                theme={isSelected ? 'blue' : 'gray'}
                                variant={isSelected ? undefined : 'outlined'}
                                onPress={() => field.onChange(option.value)}
                                size="md"
                              >
                                {option.label}
                              </Button>
                            )
                          })}
                        </Row>
                      )}
                    />
                    <Row align="center" gap={8}>
                      <Controller
                        control={control}
                        name="employmentTypeNegotiable"
                        render={({ field }) => (
                          <CustomCheckbox
                            checked={!field.value}
                            onChange={(checked) => field.onChange(!checked)}
                            size="md"
                          />
                        )}
                      />
                      <Text color="$gray11">Non-negotiable</Text>
                    </Row>
                  </Stack>

                  {/* Work Schedule */}
                  <Stack gap={8}>
                    {renderSmartLabel('Work schedule', 'workSchedule')}
                    <Controller
                      control={control}
                      name="workSchedule"
                      render={({ field }) => (
                        <Row gap={8}>
                          {WORK_SCHEDULE_OPTIONS.map((option) => {
                            const isSelected = field.value === option.value
                            return (
                              <Button
                                key={option.value}
                                flex={1}
                                theme={isSelected ? 'blue' : 'gray'}
                                variant={isSelected ? undefined : 'outlined'}
                                onPress={() => field.onChange(option.value)}
                                size="md"
                              >
                                {option.label}
                              </Button>
                            )
                          })}
                        </Row>
                      )}
                    />
                    <Row align="center" gap={8}>
                      <Controller
                        control={control}
                        name="workScheduleNegotiable"
                        render={({ field }) => (
                          <CustomCheckbox
                            checked={!field.value}
                            onChange={(checked) => field.onChange(!checked)}
                            size="md"
                          />
                        )}
                      />
                      <Text color="$gray11">Non-negotiable</Text>
                    </Row>
                  </Stack>

                  {/* Schedule Shifts */}
                  <Stack gap={8}>
                    <Row justify="space-between" align="center">
                      <Text>Schedule shifts</Text>
                      <Controller
                        control={control}
                        name="scheduleShifts"
                        render={({ field }) => (
                          <Switch checked={field.value} onChange={field.onChange} size="md" />
                        )}
                      />
                    </Row>
                  </Stack>

                  {/* Working Hours */}
                  <Stack gap={8}>
                    {renderSmartLabel('Working hours', [
                      'workingHoursStart',
                      'workingHoursEnd',
                      'workingHoursTimezone',
                    ])}
                    <Row gap={8}>
                      <Stack gap={8} flex={1}>
                        <Controller
                          control={control}
                          name="workingHoursTimezone"
                          render={({ field }) => (
                            <ResponsiveSelect
                              value={field.value || ''}
                              onValueChange={field.onChange}
                              placeholder="Time zone"
                              options={TIMEZONE_OPTIONS.map((option) => ({
                                value: option.value,
                                label: option.label,
                              }))}
                            />
                          )}
                        />
                      </Stack>
                      <Stack gap={8} flex={1}>
                        <Controller
                          control={control}
                          name="workingHoursStart"
                          render={({ field }) => (
                            <Input
                              {...field}
                              placeholder="Start time (e.g., 07:00)"
                              {...getTimeInputProps()}
                            />
                          )}
                        />
                        {errors.workingHoursStart && (
                          <Text color="$red10">{errors.workingHoursStart.message}</Text>
                        )}
                      </Stack>
                      <Stack gap={8} flex={1}>
                        <Controller
                          control={control}
                          name="workingHoursEnd"
                          render={({ field }) => (
                            <Input
                              {...field}
                              placeholder="End time (e.g., 16:00)"
                              {...getTimeInputProps()}
                            />
                          )}
                        />
                        {errors.workingHoursEnd && (
                          <Text color="$red10">{errors.workingHoursEnd.message}</Text>
                        )}
                      </Stack>
                    </Row>
                    <Row align="center" gap={8}>
                      <Controller
                        control={control}
                        name="workingHoursNegotiable"
                        render={({ field }) => (
                          <CustomCheckbox
                            checked={!field.value}
                            onChange={(checked) => field.onChange(!checked)}
                            size="md"
                          />
                        )}
                      />
                      <Text color="$gray11">Non-negotiable</Text>
                    </Row>
                  </Stack>

                  {/* Workdays */}
                  <Stack gap={8}>
                    {renderSmartLabel('Workdays', 'workdays')}
                    <Controller
                      control={control}
                      name="workdays"
                      render={({ field }) => (
                        <Row gap={8} flexWrap="wrap">
                          {WORKDAYS.map((day) => {
                            const isSelected = field.value?.includes(day.value)
                            return (
                              <Button
                                key={day.value}
                                theme={isSelected ? 'blue' : 'gray'}
                                variant={isSelected ? undefined : 'outlined'}
                                onPress={() => {
                                  const current = field.value || []
                                  if (isSelected) {
                                    field.onChange(current.filter((d) => d !== day.value))
                                  } else {
                                    field.onChange([...current, day.value])
                                  }
                                }}
                                size="sm"
                                paddingHorizontal={12}
                                borderRadius="$10"
                              >
                                {day.label}
                              </Button>
                            )
                          })}
                        </Row>
                      )}
                    />
                    <Row align="center" gap={8}>
                      <Controller
                        control={control}
                        name="workdaysNegotiable"
                        render={({ field }) => (
                          <CustomCheckbox
                            checked={!field.value}
                            onChange={(checked) => field.onChange(!checked)}
                            size="md"
                          />
                        )}
                      />
                      <Text color="$gray11">Non-negotiable</Text>
                    </Row>
                  </Stack>

                  {/* Date of Employment */}
                  <Stack gap={8}>
                    {renderSmartLabel('Date of employment', 'employmentStartDate')}
                    <Row gap={8}>
                      <Stack gap={8} flex={1}>
                        <Controller
                          control={control}
                          name="employmentStartDate"
                          render={({ field }) => (
                            <>
                              <Input
                                value={field.value}
                                onChangeText={field.onChange}
                                onBlur={field.onBlur}
                                placeholder="Start date"
                                {...getDateInputProps()}
                              />
                              {errors.employmentStartDate && (
                                <Text color="$red10">{errors.employmentStartDate.message}</Text>
                              )}
                            </>
                          )}
                        />
                      </Stack>
                      <Stack gap={8} flex={1}>
                        <Controller
                          control={control}
                          name="employmentEndDate"
                          render={({ field }) => (
                            <>
                              <Input
                                {...field}
                                placeholder="End date (optional)"
                                {...getDateInputProps()}
                              />
                              {errors.employmentEndDate && (
                                <Text color="$red10">{errors.employmentEndDate.message}</Text>
                              )}
                            </>
                          )}
                        />
                        <Text color="$gray11">End date is not mandatory</Text>
                      </Stack>
                    </Row>
                    <Row align="center" gap={8}>
                      <Controller
                        control={control}
                        name="employmentDatesNegotiable"
                        render={({ field }) => (
                          <CustomCheckbox
                            checked={!field.value}
                            onChange={(checked) => field.onChange(!checked)}
                            size="md"
                          />
                        )}
                      />
                      <Text color="$gray11">Non-negotiable</Text>
                    </Row>
                  </Stack>
                </Stack>

                <Separator />

                {/* Compensation Section */}
                <Stack gap={16}>
                  <Row align="center" gap={8}>
                    <Text>Compensation</Text>
                  </Row>

                  {/* Rate Type */}
                  <Stack gap={8}>
                    {renderSmartLabel('Rate', ['rateType', 'rateMinCents', 'rateMaxCents'])}
                    <Row gap={8}>
                      <Stack gap={8} flex={2}>
                        <Controller
                          control={control}
                          name="rateType"
                          render={({ field }) => (
                            <ResponsiveSelect
                              value={field.value || ''}
                              onValueChange={field.onChange}
                              placeholder="Type"
                              options={RATE_TYPE_OPTIONS.map((option) => ({
                                value: option.value,
                                label: option.label,
                              }))}
                            />
                          )}
                        />
                      </Stack>
                      <Stack gap={8} flex={1}>
                        <Row align="center" gap={4}>
                          <Text>$</Text>
                          <Controller
                            control={control}
                            name="rateMinCents"
                            render={({ field }) => (
                              <Input
                                flex={1}
                                placeholder="30"
                                value={formatCentsToDollars(field.value)}
                                onChangeText={(text) => {
                                  const cents = parseDollarsToCents(text)
                                  field.onChange(cents)
                                }}
                                keyboardType="numeric"
                              />
                            )}
                          />
                        </Row>
                        {errors.rateMinCents && (
                          <Text color="$red10">{errors.rateMinCents.message}</Text>
                        )}
                      </Stack>
                      <Stack gap={8} flex={1}>
                        <Text color="$gray11">to</Text>
                        <Row align="center" gap={4}>
                          <Text>$</Text>
                          <Controller
                            control={control}
                            name="rateMaxCents"
                            render={({ field }) => (
                              <Input
                                flex={1}
                                placeholder="40 (optional)"
                                value={formatCentsToDollars(field.value)}
                                onChangeText={(text) => {
                                  const cents = parseDollarsToCents(text)
                                  field.onChange(cents)
                                }}
                                keyboardType="numeric"
                              />
                            )}
                          />
                        </Row>
                        {errors.rateMaxCents && (
                          <Text color="$red10">{errors.rateMaxCents.message}</Text>
                        )}
                      </Stack>
                    </Row>
                    <Text color="$gray11">Add a range or a single rate</Text>
                    <Row align="center" gap={8}>
                      <Controller
                        control={control}
                        name="rateNegotiable"
                        render={({ field }) => (
                          <CustomCheckbox
                            checked={!field.value}
                            onChange={(checked) => field.onChange(!checked)}
                            size="md"
                          />
                        )}
                      />
                      <Text color="$gray11">Non-negotiable</Text>
                    </Row>
                  </Stack>
                </Stack>

                <Separator />

                {/* Capabilities Section */}
                <Stack gap={16}>
                  <Row align="center" gap={8}>
                    <Text>Capabilities</Text>
                  </Row>

                  {/* Endurance */}
                  <Stack gap={8}>
                    <Row justify="space-between" align="center">
                      <Row align="center" gap={8}>
                        <Text>Endurance</Text>
                        <Button size="xs" chromeless iconStart={Info} aria-label="Endurance info" />
                      </Row>
                      <Controller
                        control={control}
                        name="enduranceRequired"
                        render={({ field }) => (
                          <Switch checked={field.value} onChange={field.onChange} size="md" />
                        )}
                      />
                    </Row>
                  </Stack>
                </Stack>

                <Separator />

                {/* Other Section */}
                <Stack gap={16}>
                  <Row align="center" gap={8}>
                    <Text>Other</Text>
                  </Row>

                  {/* Willing to Travel */}
                  <Stack gap={8}>
                    <Row justify="space-between" align="center">
                      <Text>Willing to travel</Text>
                      <Controller
                        control={control}
                        name="willingToTravel"
                        render={({ field }) => (
                          <Switch
                            checked={field.value ?? false}
                            onChange={field.onChange}
                            size="md"
                          />
                        )}
                      />
                    </Row>
                    {watchedValues.willingToTravel && (
                      <Stack gap={8}>
                        <Row align="center" gap={4}>
                          <Text>up to</Text>
                          <Controller
                            control={control}
                            name="travelDistanceMiles"
                            render={({ field }) => (
                              <Input
                                flex={1}
                                placeholder="50"
                                value={field.value ? field.value.toString() : undefined}
                                onChangeText={(text) => {
                                  const num = Number.parseInt(text, 10)
                                  field.onChange(Number.isNaN(num) ? undefined : num)
                                }}
                                keyboardType="numeric"
                              />
                            )}
                          />
                          <Text>miles</Text>
                        </Row>
                      </Stack>
                    )}
                  </Stack>

                  {/* Willing to Work Overtime */}
                  <Stack gap={8}>
                    <Row justify="space-between" align="center">
                      <Text>Willing to work overtime</Text>
                      <Controller
                        control={control}
                        name="willingToWorkOvertime"
                        render={({ field }) => (
                          <Switch
                            checked={field.value ?? false}
                            onChange={field.onChange}
                            size="md"
                          />
                        )}
                      />
                    </Row>
                  </Stack>

                  {/* Has Driver's License */}
                  <Stack gap={8}>
                    <Row justify="space-between" align="center">
                      <Text>Has driver's license</Text>
                      <Controller
                        control={control}
                        name="hasDriversLicense"
                        render={({ field }) => (
                          <Switch
                            checked={field.value ?? false}
                            onChange={field.onChange}
                            size="md"
                          />
                        )}
                      />
                    </Row>
                  </Stack>

                  {/* Additional Notes */}
                  <Stack gap={8}>
                    <Text>Additional note</Text>
                    <Controller
                      control={control}
                      name="additionalNotes"
                      render={({ field }) => (
                        <TextArea
                          value={field.value ?? ''}
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Add any additional notes..."
                          height={100}
                          maxLength={2000}
                        />
                      )}
                    />
                    {errors.additionalNotes && (
                      <Text color="$red10">{errors.additionalNotes.message}</Text>
                    )}
                  </Stack>
                </Stack>
              </Stack>
            </ScrollView>

            {/* Form Actions */}
            <Row
              gap={12}
              padding="md"
              backgroundColor="$background"
              borderTopWidth={1}
              borderTopColor="$borderColor"
              justify="flex-end"
            >
              {onCancel && (
                <Button variant="outline" onPress={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
              )}
              {mode === 'create' && (
                <>
                  <Button variant="outline" onPress={onSaveDraft} disabled={isSubmitting}>
                    Save Draft
                  </Button>
                  <Button onPress={onSubmit} disabled={isSubmitting} color="primary">
                    {isSubmitting ? 'Sending...' : 'Continue'}
                  </Button>
                </>
              )}
              {mode === 'edit' && (
                <Button onPress={onSubmit} disabled={isSubmitting} color="primary">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </Row>
          </Stack>

          {/* Help Sidebar */}
          <Stack
            width={300}
            padding="md"
            backgroundColor="$color2"
            borderLeftWidth={1}
            borderLeftColor="$borderColor"
          >
            <InquiryHelpSidebar />
          </Stack>
        </Row>
      </FormProvider>

      <Sheet
        modal
        open={saveTemplateOpen}
        onOpenChange={setSaveTemplateOpen}
        snapPoints={[80]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Handle />
        <Sheet.Frame padding="md" gap={16}>
          <Text>Save template</Text>
          <Text color="$gray11">Capture the current inquiry terms as a reusable template.</Text>
          <Stack gap={8}>
            <Text>Template name</Text>
            <Input
              placeholder="E.g., Standard day shift"
              value={templateName}
              onChangeText={setTemplateName}
            />
          </Stack>
          <Stack gap={8}>
            <Text>Description (optional)</Text>
            <TextArea
              placeholder="Describe when to use this template..."
              value={templateDescription}
              onChangeText={setTemplateDescription}
            />
          </Stack>
          <Row gap={12} justify="flex-end">
            <Button
              variant="outline"
              onPress={() => setSaveTemplateOpen(false)}
              disabled={createTemplateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSaveTemplate}
              disabled={createTemplateMutation.isPending}
            >
              {createTemplateMutation.isPending ? 'Saving…' : 'Save template'}
            </Button>
          </Row>
        </Sheet.Frame>
      </Sheet>

      <Sheet
        modal
        open={manageTemplatesOpen}
        onOpenChange={setManageTemplatesOpen}
        snapPoints={[90]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Handle />
        <Sheet.Frame padding="md" gap={16}>
          <Text>Manage templates</Text>
          {templates.length === 0 ? (
            <Text color="$gray11">No templates saved yet. Create one from the inquiry form.</Text>
          ) : (
            <Sheet.ScrollView>
              <Stack gap={12} paddingVertical={8}>
                {templateList.map((template) => {
                  const templateId = template.id
                  const usageCount = template.usage_count ?? 0
                  const lastUsedAt = template.last_used_at ?? null
                  return (
                    <Stack
                      key={templateId}
                      padding="sm"
                      gap={8}
                      borderWidth={1}
                      borderColor="$borderColor"
                      borderRadius={16}
                      backgroundColor="$background"
                    >
                      <Row gap={12} align="center" justify="space-between">
                        <Stack flex={1} gap={4}>
                          <Text>{template.name}</Text>
                          {template.description && (
                            <Text color="$gray11">{template.description}</Text>
                          )}
                          <Text color="$gray11">
                            {usageCount} use{usageCount === 1 ? '' : 's'} ·{' '}
                            {lastUsedAt ? new Date(lastUsedAt).toLocaleDateString() : 'Never used'}
                          </Text>
                        </Stack>
                        <Button
                          size="sm"
                          variant="outline"
                          color="$red11"
                          borderColor="$red8"
                          onPress={() => handleDeleteTemplate(templateId)}
                          disabled={
                            deleteTemplateMutation.isPending && deletingTemplateId === templateId
                          }
                        >
                          Delete
                        </Button>
                      </Row>
                    </Stack>
                  )
                })}
              </Stack>
            </Sheet.ScrollView>
          )}
        </Sheet.Frame>
      </Sheet>
    </>
  )
}
