import { api } from '@app/core/utils/api'
import type { InquiryCreateInput } from '@app/schemas'
import {
  Button,
  CustomCheckbox,
  Input,
  ScrollView,
  Separator,
  Sheet,
  Text,
  XStack,
  YStack,
} from '@app/ui'
import { Check, Info } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Controller, FormProvider } from 'react-hook-form'
import { Platform } from 'react-native'
import { Adapt, Select, Switch, TextArea } from 'tamagui'
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

  const toast = useToastController()
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
  } = api.inquiries.getTemplatesForApplication.useQuery(
    { applicationId },
    { enabled: Boolean(applicationId) }
  )

  const templates = templatesData ?? []
  type TemplateRow = {
    id: string
    name: string
    description: string | null
    usage_count: number | null
    last_used_at: string | null
  }
  const templateList = templates as TemplateRow[]

  const createTemplateMutation = api.inquiries.createTemplate.useMutation()
  const applyTemplateMutation = api.inquiries.applyTemplate.useMutation()
  const deleteTemplateMutation = api.inquiries.deleteTemplate.useMutation()

  const { data: smartDefaultsData, isLoading: isSmartDefaultsLoading } =
    api.inquiries.getSmartDefaults.useQuery(
      { applicationId },
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
        toast.show('Template applied', {
          message: 'Inquiry form has been updated with saved terms.',
        })
      }
    } catch (error) {
      toast.show('Unable to apply template', {
        message: getErrorMessage(error, 'Please try again.'),
      })
    }
  }, [selectedTemplateId, applyTemplateMutation, applicationId, form, toast, getErrorMessage])

  const handleSaveTemplate = useCallback(async () => {
    const trimmedName = templateName.trim()
    const trimmedDescription = templateDescription.trim()

    if (!trimmedName) {
      toast.show('Template name required', {
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

      toast.show('Template saved', {
        message: 'You can reuse it for future inquiries.',
      })
      setTemplateName('')
      setTemplateDescription('')
      setSaveTemplateOpen(false)
      refetchTemplates()
    } catch (error) {
      toast.show('Unable to save template', {
        message: getErrorMessage(error, 'Please try again.'),
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
        toast.show('Template deleted', {
          message: 'Removed from your organization templates.',
        })
        if (selectedTemplateId === templateId) {
          setSelectedTemplateId(null)
        }
        refetchTemplates()
      } catch (error) {
        toast.show('Unable to delete template', {
          message: getErrorMessage(error, 'Please try again.'),
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
        <XStack items="center" gap="$2">
          <Text fontWeight="600" fontSize="$4">
            {label}
          </Text>
          {isAutoFilled && (
            <XStack px="$2" py="$1" bg="$green3" rounded="$2">
              <Text fontSize="$2" color="$green11" fontWeight="600">
                Auto-filled
              </Text>
            </XStack>
          )}
        </XStack>
      )
    },
    [autoFilledFields]
  )

  return (
    <>
      <FormProvider {...form}>
        <XStack gap="$4" flex={1} $sm={{ flexDirection: 'column' }}>
          {/* Main Form */}
          <YStack flex={1} gap="$4">
            <ScrollView>
              <YStack gap="$6" p="$4" $sm={{ gap: '$8', p: '$3' }}>
                {/* Templates Section */}
                <YStack
                  gap="$3"
                  p="$3"
                  borderWidth={1}
                  borderColor="$borderColor"
                  bg="$background"
                  rounded="$4"
                >
                  <XStack
                    justify="space-between"
                    items="center"
                    gap="$3"
                    $sm={{ flexDirection: 'column' }}
                  >
                    <YStack>
                      <Text fontSize="$6" fontWeight="700">
                        Templates
                      </Text>
                      <Text fontSize="$3" color="$color11">
                        Reuse saved inquiry terms for this organization.
                      </Text>
                    </YStack>
                    <XStack gap="$2" $sm={{ width: '100%' }}>
                      <Button
                        size="$3"
                        variant="outlined"
                        onPress={() => setSaveTemplateOpen(true)}
                        disabled={createTemplateMutation.isLoading}
                        $sm={{ flex: 1 }}
                      >
                        Save current
                      </Button>
                      <Button
                        size="$3"
                        variant="outlined"
                        onPress={() => setManageTemplatesOpen(true)}
                        $sm={{ flex: 1 }}
                      >
                        Manage
                      </Button>
                    </XStack>
                  </XStack>

                  <XStack gap="$2" $sm={{ flexDirection: 'column' }}>
                    <YStack flex={1}>
                      <Select
                        value={selectedTemplateId ?? undefined}
                        onValueChange={setSelectedTemplateId}
                      >
                        <Select.Trigger disabled={templates.length === 0 || isTemplatesLoading}>
                          <Select.Value
                            placeholder={
                              templates.length === 0 ? 'No templates yet' : 'Choose a template'
                            }
                          />
                        </Select.Trigger>
                        <Adapt when="sm" platform="touch">
                          <Sheet modal dismissOnSnapToBottom>
                            <Sheet.Frame>
                              <Sheet.ScrollView>
                                <Adapt.Contents />
                              </Sheet.ScrollView>
                            </Sheet.Frame>
                            <Sheet.Overlay />
                          </Sheet>
                        </Adapt>
                        <Select.Content zIndex={200000}>
                          <Select.ScrollUpButton />
                          <Select.Viewport>
                            {templateOptions.map((template) => (
                              <Select.Item
                                key={template.id}
                                value={template.id}
                                index={template.index}
                              >
                                <Select.ItemText>{template.name}</Select.ItemText>
                                <Select.ItemIndicator marginLeft="auto">
                                  <Check size={16} />
                                </Select.ItemIndicator>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                          <Select.ScrollDownButton />
                        </Select.Content>
                      </Select>
                    </YStack>

                    <Button
                      size="$3"
                      onPress={handleApplyTemplate}
                      disabled={!selectedTemplateId || applyTemplateMutation.isLoading}
                      $sm={{ width: '100%' }}
                    >
                      {applyTemplateMutation.isLoading ? 'Applying…' : 'Apply template'}
                    </Button>
                  </XStack>

                  {isTemplatesLoading && (
                    <Text fontSize="$3" color="$color11">
                      Loading templates…
                    </Text>
                  )}
                  {!isTemplatesLoading && templates.length === 0 && (
                    <Text fontSize="$3" color="$color11">
                      Save templates to quickly reuse standard employment terms.
                    </Text>
                  )}
                </YStack>

                {/* Smart Defaults Banner */}
                {mode === 'create' && (
                  <YStack
                    gap="$3"
                    p="$3"
                    borderWidth={1}
                    borderColor="$borderColor"
                    bg="$background"
                    rounded="$4"
                  >
                    <XStack
                      justify="space-between"
                      items="center"
                      gap="$3"
                      $sm={{ flexDirection: 'column' }}
                    >
                      <YStack gap="$1" flex={1}>
                        <Text fontSize="$6" fontWeight="700">
                          Smart defaults
                        </Text>
                        {isSmartDefaultsLoading ? (
                          <Text fontSize="$3" color="$color11">
                            Loading job-based recommendations…
                          </Text>
                        ) : smartDefaultsFieldCount > 0 ? (
                          <Text fontSize="$3" color="$color11">
                            {smartDefaultsApplied
                              ? `Applied ${smartDefaultsFieldCount} field${smartDefaultsFieldCount === 1 ? '' : 's'} from ${smartDefaultsSourceDescription}.`
                              : `Prefill ${smartDefaultsFieldCount} field${smartDefaultsFieldCount === 1 ? '' : 's'} from ${smartDefaultsSourceDescription}.`}
                          </Text>
                        ) : (
                          <Text fontSize="$3" color="$color11">
                            No defaults available for this job yet.
                          </Text>
                        )}
                      </YStack>
                      <XStack gap="$2" $sm={{ width: '100%' }}>
                        <Button
                          variant="outlined"
                          onPress={handleClearSmartDefaults}
                          disabled={!smartDefaultsApplied}
                          $sm={{ flex: 1 }}
                        >
                          Clear
                        </Button>
                        <Button
                          onPress={() => handleApplySmartDefaults({ force: true })}
                          disabled={smartDefaultsFieldCount === 0}
                          $sm={{ flex: 1 }}
                        >
                          {smartDefaultsApplied ? 'Reapply defaults' : 'Apply defaults'}
                        </Button>
                      </XStack>
                    </XStack>
                    {smartDefaultsFieldLabels.length > 0 && (
                      <XStack gap="$2" flexWrap="wrap">
                        {smartDefaultsFieldLabels.map((label) => (
                          <YStack key={label} px="$2" py="$1" bg="$gray3" rounded="$3">
                            <Text fontSize="$2" color="$color11">
                              {label}
                            </Text>
                          </YStack>
                        ))}
                      </XStack>
                    )}
                  </YStack>
                )}

                {/* Employment Section */}
                <YStack gap="$4">
                  <XStack items="center" gap="$2">
                    <Text fontSize="$6" fontWeight="700">
                      Employment
                    </Text>
                  </XStack>

                  {/* Employment Type */}
                  <YStack gap="$2">
                    {renderSmartLabel('Employment type', 'employmentType')}
                    <Controller
                      control={control}
                      name="employmentType"
                      render={({ field }) => (
                        <XStack gap="$2" $sm={{ flexDirection: 'column' }}>
                          {EMPLOYMENT_TYPE_OPTIONS.map((option) => {
                            const isSelected = field.value === option.value
                            return (
                              <Button
                                key={option.value}
                                flex={1}
                                theme={isSelected ? 'blue' : 'gray'}
                                variant={isSelected ? undefined : 'outlined'}
                                onPress={() => field.onChange(option.value)}
                                size="$4"
                                $sm={{ height: 48 }}
                              >
                                {option.label}
                              </Button>
                            )
                          })}
                        </XStack>
                      )}
                    />
                    <XStack items="center" gap="$2">
                      <Controller
                        control={control}
                        name="employmentTypeNegotiable"
                        render={({ field }) => (
                          <CustomCheckbox
                            checked={!field.value}
                            onCheckedChange={(checked) => field.onChange(!checked)}
                            size="medium"
                          />
                        )}
                      />
                      <Text fontSize="$3" color="$color11">
                        Non-negotiable
                      </Text>
                    </XStack>
                  </YStack>

                  {/* Work Schedule */}
                  <YStack gap="$2">
                    {renderSmartLabel('Work schedule', 'workSchedule')}
                    <Controller
                      control={control}
                      name="workSchedule"
                      render={({ field }) => (
                        <XStack gap="$2" $sm={{ flexDirection: 'column' }}>
                          {WORK_SCHEDULE_OPTIONS.map((option) => {
                            const isSelected = field.value === option.value
                            return (
                              <Button
                                key={option.value}
                                flex={1}
                                theme={isSelected ? 'blue' : 'gray'}
                                variant={isSelected ? undefined : 'outlined'}
                                onPress={() => field.onChange(option.value)}
                                size="$4"
                                $sm={{ height: 48 }}
                              >
                                {option.label}
                              </Button>
                            )
                          })}
                        </XStack>
                      )}
                    />
                    <XStack items="center" gap="$2">
                      <Controller
                        control={control}
                        name="workScheduleNegotiable"
                        render={({ field }) => (
                          <CustomCheckbox
                            checked={!field.value}
                            onCheckedChange={(checked) => field.onChange(!checked)}
                            size="medium"
                          />
                        )}
                      />
                      <Text fontSize="$3" color="$color11">
                        Non-negotiable
                      </Text>
                    </XStack>
                  </YStack>

                  {/* Schedule Shifts */}
                  <YStack gap="$2">
                    <XStack justify="space-between" items="center">
                      <Text fontWeight="600" fontSize="$4">
                        Schedule shifts
                      </Text>
                      <Controller
                        control={control}
                        name="scheduleShifts"
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            size="$4"
                          />
                        )}
                      />
                    </XStack>
                  </YStack>

                  {/* Working Hours */}
                  <YStack gap="$2">
                    {renderSmartLabel('Working hours', [
                      'workingHoursStart',
                      'workingHoursEnd',
                      'workingHoursTimezone',
                    ])}
                    <XStack gap="$2" $sm={{ flexDirection: 'column' }}>
                      <YStack gap="$2" flex={1}>
                        <Controller
                          control={control}
                          name="workingHoursTimezone"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <Select.Trigger>
                                <Select.Value placeholder="Time zone" />
                              </Select.Trigger>
                              <Adapt when="sm" platform="touch">
                                <Sheet modal dismissOnSnapToBottom>
                                  <Sheet.Frame>
                                    <Sheet.ScrollView>
                                      <Adapt.Contents />
                                    </Sheet.ScrollView>
                                  </Sheet.Frame>
                                  <Sheet.Overlay />
                                </Sheet>
                              </Adapt>
                              <Select.Content zIndex={200000}>
                                <Select.Viewport>
                                  {TIMEZONE_OPTIONS.map((option, index) => (
                                    <Select.Item
                                      key={option.value}
                                      value={option.value}
                                      index={index}
                                    >
                                      <Select.ItemText>{option.label}</Select.ItemText>
                                      <Select.ItemIndicator marginLeft="auto">
                                        <Check size={16} />
                                      </Select.ItemIndicator>
                                    </Select.Item>
                                  ))}
                                </Select.Viewport>
                              </Select.Content>
                            </Select>
                          )}
                        />
                      </YStack>
                      <YStack gap="$2" flex={1}>
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
                          <Text fontSize="$2" color="$red10">
                            {errors.workingHoursStart.message}
                          </Text>
                        )}
                      </YStack>
                      <YStack gap="$2" flex={1}>
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
                          <Text fontSize="$2" color="$red10">
                            {errors.workingHoursEnd.message}
                          </Text>
                        )}
                      </YStack>
                    </XStack>
                    <XStack items="center" gap="$2">
                      <Controller
                        control={control}
                        name="workingHoursNegotiable"
                        render={({ field }) => (
                          <CustomCheckbox
                            checked={!field.value}
                            onCheckedChange={(checked) => field.onChange(!checked)}
                            size="medium"
                          />
                        )}
                      />
                      <Text fontSize="$3" color="$color11">
                        Non-negotiable
                      </Text>
                    </XStack>
                  </YStack>

                  {/* Workdays */}
                  <YStack gap="$2">
                    {renderSmartLabel('Workdays', 'workdays')}
                    <Controller
                      control={control}
                      name="workdays"
                      render={({ field }) => (
                        <XStack gap="$2" flexWrap="wrap" $sm={{ gap: '$3' }}>
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
                                size="$3"
                                px="$3"
                                rounded="$10"
                                $sm={{ height: 48, px: '$4' }}
                              >
                                {day.label}
                              </Button>
                            )
                          })}
                        </XStack>
                      )}
                    />
                    <XStack items="center" gap="$2">
                      <Controller
                        control={control}
                        name="workdaysNegotiable"
                        render={({ field }) => (
                          <CustomCheckbox
                            checked={!field.value}
                            onCheckedChange={(checked) => field.onChange(!checked)}
                            size="medium"
                          />
                        )}
                      />
                      <Text fontSize="$3" color="$color11">
                        Non-negotiable
                      </Text>
                    </XStack>
                  </YStack>

                  {/* Date of Employment */}
                  <YStack gap="$2">
                    {renderSmartLabel('Date of employment', 'employmentStartDate')}
                    <XStack gap="$2" $sm={{ flexDirection: 'column' }}>
                      <YStack gap="$2" flex={1}>
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
                                <Text fontSize="$2" color="$red10">
                                  {errors.employmentStartDate.message}
                                </Text>
                              )}
                            </>
                          )}
                        />
                      </YStack>
                      <YStack gap="$2" flex={1}>
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
                                <Text fontSize="$2" color="$red10">
                                  {errors.employmentEndDate.message}
                                </Text>
                              )}
                            </>
                          )}
                        />
                        <Text fontSize="$2" color="$color11">
                          End date is not mandatory
                        </Text>
                      </YStack>
                    </XStack>
                    <XStack items="center" gap="$2">
                      <Controller
                        control={control}
                        name="employmentDatesNegotiable"
                        render={({ field }) => (
                          <CustomCheckbox
                            checked={!field.value}
                            onCheckedChange={(checked) => field.onChange(!checked)}
                            size="medium"
                          />
                        )}
                      />
                      <Text fontSize="$3" color="$color11">
                        Non-negotiable
                      </Text>
                    </XStack>
                  </YStack>
                </YStack>

                <Separator />

                {/* Compensation Section */}
                <YStack gap="$4">
                  <XStack items="center" gap="$2">
                    <Text fontSize="$6" fontWeight="700">
                      Compensation
                    </Text>
                  </XStack>

                  {/* Rate Type */}
                  <YStack gap="$2">
                    {renderSmartLabel('Rate', ['rateType', 'rateMinCents', 'rateMaxCents'])}
                    <XStack gap="$2" $sm={{ flexDirection: 'column' }}>
                      <YStack gap="$2" flex={2}>
                        <Controller
                          control={control}
                          name="rateType"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <Select.Trigger>
                                <Select.Value placeholder="Type" />
                              </Select.Trigger>
                              <Adapt when="sm" platform="touch">
                                <Sheet modal dismissOnSnapToBottom>
                                  <Sheet.Frame>
                                    <Sheet.ScrollView>
                                      <Adapt.Contents />
                                    </Sheet.ScrollView>
                                  </Sheet.Frame>
                                  <Sheet.Overlay />
                                </Sheet>
                              </Adapt>
                              <Select.Content zIndex={200000}>
                                <Select.Viewport>
                                  {RATE_TYPE_OPTIONS.map((option, index) => (
                                    <Select.Item
                                      key={option.value}
                                      value={option.value}
                                      index={index}
                                    >
                                      <Select.ItemText>{option.label}</Select.ItemText>
                                      <Select.ItemIndicator marginLeft="auto">
                                        <Check size={16} />
                                      </Select.ItemIndicator>
                                    </Select.Item>
                                  ))}
                                </Select.Viewport>
                              </Select.Content>
                            </Select>
                          )}
                        />
                      </YStack>
                      <YStack gap="$2" flex={1}>
                        <XStack items="center" gap="$1">
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
                        </XStack>
                        {errors.rateMinCents && (
                          <Text fontSize="$2" color="$red10">
                            {errors.rateMinCents.message}
                          </Text>
                        )}
                      </YStack>
                      <YStack gap="$2" flex={1}>
                        <Text fontSize="$3" color="$color11">
                          to
                        </Text>
                        <XStack items="center" gap="$1">
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
                        </XStack>
                        {errors.rateMaxCents && (
                          <Text fontSize="$2" color="$red10">
                            {errors.rateMaxCents.message}
                          </Text>
                        )}
                      </YStack>
                    </XStack>
                    <Text fontSize="$2" color="$color11">
                      Add a range or a single rate
                    </Text>
                    <XStack items="center" gap="$2">
                      <Controller
                        control={control}
                        name="rateNegotiable"
                        render={({ field }) => (
                          <CustomCheckbox
                            checked={!field.value}
                            onCheckedChange={(checked) => field.onChange(!checked)}
                            size="medium"
                          />
                        )}
                      />
                      <Text fontSize="$3" color="$color11">
                        Non-negotiable
                      </Text>
                    </XStack>
                  </YStack>
                </YStack>

                <Separator />

                {/* Capabilities Section */}
                <YStack gap="$4">
                  <XStack items="center" gap="$2">
                    <Text fontSize="$6" fontWeight="700">
                      Capabilities
                    </Text>
                  </XStack>

                  {/* Endurance */}
                  <YStack gap="$2">
                    <XStack justify="space-between" items="center">
                      <XStack items="center" gap="$2">
                        <Text fontWeight="600" fontSize="$4">
                          Endurance
                        </Text>
                        <Button
                          size="$2"
                          circular
                          chromeless
                          icon={Info}
                          aria-label="Endurance info"
                        />
                      </XStack>
                      <Controller
                        control={control}
                        name="enduranceRequired"
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            size="$4"
                          />
                        )}
                      />
                    </XStack>
                  </YStack>
                </YStack>

                <Separator />

                {/* Other Section */}
                <YStack gap="$4">
                  <XStack items="center" gap="$2">
                    <Text fontSize="$6" fontWeight="700">
                      Other
                    </Text>
                  </XStack>

                  {/* Willing to Travel */}
                  <YStack gap="$2">
                    <XStack justify="space-between" items="center">
                      <Text fontWeight="600" fontSize="$4">
                        Willing to travel
                      </Text>
                      <Controller
                        control={control}
                        name="willingToTravel"
                        render={({ field }) => (
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                            size="$4"
                          />
                        )}
                      />
                    </XStack>
                    {watchedValues.willingToTravel && (
                      <YStack gap="$2">
                        <XStack items="center" gap="$1">
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
                        </XStack>
                      </YStack>
                    )}
                  </YStack>

                  {/* Willing to Work Overtime */}
                  <YStack gap="$2">
                    <XStack justify="space-between" items="center">
                      <Text fontWeight="600" fontSize="$4">
                        Willing to work overtime
                      </Text>
                      <Controller
                        control={control}
                        name="willingToWorkOvertime"
                        render={({ field }) => (
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                            size="$4"
                          />
                        )}
                      />
                    </XStack>
                  </YStack>

                  {/* Has Driver's License */}
                  <YStack gap="$2">
                    <XStack justify="space-between" items="center">
                      <Text fontWeight="600" fontSize="$4">
                        Has driver's license
                      </Text>
                      <Controller
                        control={control}
                        name="hasDriversLicense"
                        render={({ field }) => (
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                            size="$4"
                          />
                        )}
                      />
                    </XStack>
                  </YStack>

                  {/* Additional Notes */}
                  <YStack gap="$2">
                    <Text fontWeight="600" fontSize="$4">
                      Additional note
                    </Text>
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
                      <Text fontSize="$2" color="$red10">
                        {errors.additionalNotes.message}
                      </Text>
                    )}
                  </YStack>
                </YStack>
              </YStack>
            </ScrollView>

            {/* Form Actions */}
            <XStack
              gap="$3"
              p="$4"
              bg="$background"
              borderTopWidth={1}
              borderTopColor="$borderColor"
              justify="flex-end"
              $sm={{ flexDirection: 'column-reverse' }}
            >
              {onCancel && (
                <Button
                  variant="outlined"
                  onPress={onCancel}
                  disabled={isSubmitting}
                  $sm={{ height: 48, flex: 1 }}
                >
                  Cancel
                </Button>
              )}
              {mode === 'create' && (
                <>
                  <Button
                    variant="outlined"
                    onPress={onSaveDraft}
                    disabled={isSubmitting}
                    $sm={{ height: 48, flex: 1 }}
                  >
                    Save Draft
                  </Button>
                  <Button
                    onPress={onSubmit}
                    disabled={isSubmitting}
                    theme="blue"
                    $sm={{ height: 48, flex: 1 }}
                  >
                    {isSubmitting ? 'Sending...' : 'Continue'}
                  </Button>
                </>
              )}
              {mode === 'edit' && (
                <Button
                  onPress={onSubmit}
                  disabled={isSubmitting}
                  theme="blue"
                  $sm={{ height: 48, flex: 1 }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </XStack>
          </YStack>

          {/* Help Sidebar */}
          <YStack
            width={300}
            p="$4"
            bg="$color2"
            borderLeftWidth={1}
            borderLeftColor="$borderColor"
            $sm={{ display: 'none' }}
          >
            <InquiryHelpSidebar />
          </YStack>
        </XStack>
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
        <Sheet.Frame p="$4" gap="$4">
          <Text fontSize="$6" fontWeight="700">
            Save template
          </Text>
          <Text fontSize="$3" color="$color11">
            Capture the current inquiry terms as a reusable template.
          </Text>
          <YStack gap="$2">
            <Text fontWeight="600">Template name</Text>
            <Input
              placeholder="E.g., Standard day shift"
              value={templateName}
              onChangeText={setTemplateName}
            />
          </YStack>
          <YStack gap="$2">
            <Text fontWeight="600">Description (optional)</Text>
            <TextArea
              placeholder="Describe when to use this template..."
              value={templateDescription}
              onChangeText={setTemplateDescription}
              numberOfLines={4}
            />
          </YStack>
          <XStack gap="$3" justify="flex-end">
            <Button
              variant="outlined"
              onPress={() => setSaveTemplateOpen(false)}
              disabled={createTemplateMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              theme="blue"
              onPress={handleSaveTemplate}
              disabled={createTemplateMutation.isLoading}
            >
              {createTemplateMutation.isLoading ? 'Saving…' : 'Save template'}
            </Button>
          </XStack>
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
        <Sheet.Frame p="$4" gap="$4">
          <Text fontSize="$6" fontWeight="700">
            Manage templates
          </Text>
          {templates.length === 0 ? (
            <Text fontSize="$3" color="$color11">
              No templates saved yet. Create one from the inquiry form.
            </Text>
          ) : (
            <Sheet.ScrollView>
              <YStack gap="$3" py="$2">
                {templateList.map((template) => {
                  const templateId = template.id
                  const usageCount = template.usage_count ?? 0
                  const lastUsedAt = template.last_used_at ?? null
                  return (
                    <YStack
                      key={templateId}
                      p="$3"
                      gap="$2"
                      borderWidth={1}
                      borderColor="$borderColor"
                      rounded="$4"
                      bg="$background"
                    >
                      <XStack
                        gap="$3"
                        items="center"
                        justify="space-between"
                        $sm={{ flexDirection: 'column' }}
                      >
                        <YStack flex={1} gap="$1">
                          <Text fontSize="$4" fontWeight="600">
                            {template.name}
                          </Text>
                          {template.description && (
                            <Text fontSize="$3" color="$color11">
                              {template.description}
                            </Text>
                          )}
                          <Text fontSize="$2" color="$color11">
                            {usageCount} use{usageCount === 1 ? '' : 's'} ·{' '}
                            {lastUsedAt ? new Date(lastUsedAt).toLocaleDateString() : 'Never used'}
                          </Text>
                        </YStack>
                        <Button
                          size="$3"
                          variant="outlined"
                          color="$red11"
                          borderColor="$red8"
                          onPress={() => handleDeleteTemplate(templateId)}
                          disabled={
                            deleteTemplateMutation.isLoading && deletingTemplateId === templateId
                          }
                        >
                          Delete
                        </Button>
                      </XStack>
                    </YStack>
                  )
                })}
              </YStack>
            </Sheet.ScrollView>
          )}
        </Sheet.Frame>
      </Sheet>
    </>
  )
}
