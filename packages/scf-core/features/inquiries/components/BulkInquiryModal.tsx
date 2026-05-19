import { useCreateBulkInquiriesMutation } from '@scf/core/utils/inquiries-sdk-hooks'
import { type BulkInquiryInput, bulkInquirySchema } from '@scf/schemas'
import {
  Button,
  Checkbox,
  Input,
  ScrollView,
  Separator,
  Sheet,
  SheetHeader,
  SheetContent,
  SheetFooter,
  Text,
  Row,
  Stack,
  ProgressBarBase,
  TextArea,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@scaffald/ui'
import { useState } from 'react'
import { Controller, FormProvider, type Resolver, useForm } from 'react-hook-form'
import { InquiryHelpSidebar } from './InquiryHelpSidebar'

interface BulkInquiryModalProps {
  open: boolean
  onClose: () => void
  applicationIds: string[]
}

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'permanent', label: 'Permanent' },
  { value: 'temporary', label: 'Temporary' },
] as const

const WORK_SCHEDULE_OPTIONS = [
  { value: 'full_time', label: 'Full time' },
  { value: 'part_time', label: 'Part time' },
  { value: 'day_week', label: 'Day-Week' },
] as const

export function BulkInquiryModal({ open, onClose, applicationIds }: BulkInquiryModalProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const toast = useToast()
  const [showResults, setShowResults] = useState(false)
  const [bulkResults, setBulkResults] = useState<{
    total: number
    successful: number
    failed: number
    results: Array<{
      applicationId: string
      success: boolean
      inquiryId?: string
      error?: string
    }>
  } | null>(null)

  const form = useForm<BulkInquiryInput>({
    // SC-59: cast required for @hookform/resolvers v5 — see useFeedbackForm for context.
    resolver: zodResolver(bulkInquirySchema) as unknown as Resolver<BulkInquiryInput>,
    mode: 'onChange',
    defaultValues: {
      employmentType: undefined,
      employmentTypeNegotiable: true,
      workSchedule: undefined,
      workScheduleNegotiable: true,
      scheduleShifts: false,
      workingHoursStart: undefined,
      workingHoursEnd: undefined,
      workingHoursTimezone: 'America/New_York',
      workingHoursNegotiable: true,
      workdays: [],
      workdaysNegotiable: true,
      employmentStartDate: '',
      employmentEndDate: undefined,
      employmentDatesNegotiable: true,
      rateType: 'hourly',
      rateMinCents: 0,
      rateMaxCents: undefined,
      rateNegotiable: true,
      enduranceRequired: false,
      willingToTravel: undefined,
      travelDistanceMiles: undefined,
      willingToWorkOvertime: undefined,
      hasDriversLicense: undefined,
      additionalNotes: undefined,
    },
  })

  const createBulk = useCreateBulkInquiriesMutation({
    onSuccess: (result) => {
      setBulkResults(result)
      setShowResults(true)

      if (result.failed > 0) {
        toast.show({
          title: 'Bulk inquiry partially completed',
          message: `Successfully sent to ${result.successful} candidates. ${result.failed} failed.`,
        })
      } else {
        toast.show({
          title: 'Bulk inquiry sent',
          message: `Successfully sent inquiry to ${result.successful} candidates.`,
        })
        // Close after successful completion
        setTimeout(() => {
          handleClose()
        }, 2000)
      }
    },
    onError: (error) => {
      toast.show({
        title: 'Failed to send bulk inquiry',
        message: error.message ?? 'Please try again.',
        variant: 'error',
      })
    },
  })

  const { control, handleSubmit, watch } = form

  const watchedValues = watch()
  const isSubmitting = createBulk.isPending

  const onSubmit = handleSubmit(async (data) => {
    await createBulk.mutateAsync({
      applicationIds,
      inquiryData: data as BulkInquiryInput,
    })
  })

  const handleClose = () => {
    if (!isSubmitting) {
      setShowResults(false)
      setBulkResults(null)
      form.reset()
      onClose()
    }
  }

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

  if (showResults && bulkResults) {
    return (
      <Sheet visible={open} onClose={handleClose} height="three-quarters">
        <SheetHeader
          title="Bulk Inquiry Results"
          onClose={handleClose}
        />
        <SheetContent scrollable>
          <Stack gap={16} padding="md">
            {/* Summary */}
            <Stack gap={12} padding="md" style={{ backgroundColor: colors.bg[t].muted }} borderRadius={16}>
              <Row gap={8} align="center">
                <Text style={{ color: t === 'dark' ? colors.green[300] : colors.green[600] }}>✓ {bulkResults.successful} Successful</Text>
              </Row>
              {bulkResults.failed > 0 && (
                <Row gap={8} align="center">
                  <Text style={{ color: t === 'dark' ? colors.error[300] : colors.error[600] }}>✗ {bulkResults.failed} Failed</Text>
                </Row>
              )}
              <Text style={{ color: colors.text[t].secondary }}>Total: {bulkResults.total} candidates</Text>
            </Stack>

            {/* Failed details */}
            {bulkResults.failed > 0 && (
              <Stack gap={8}>
                <Text style={{ color: t === 'dark' ? colors.error[300] : colors.error[600] }}>Failed Inquiries</Text>
                {bulkResults.results
                  .filter((r) => !r.success)
                  .map((result) => (
                    <Stack
                      key={result.applicationId}
                      padding="sm"
                      style={{ backgroundColor: t === 'dark' ? colors.error[900] : colors.error[50] }}
                      borderRadius={12}
                      gap={4}
                    >
                      <Text>Application: {result.applicationId}</Text>
                      <Text style={{ color: t === 'dark' ? colors.error[300] : colors.error[600] }}>{result.error || 'Unknown error'}</Text>
                    </Stack>
                  ))}
              </Stack>
            )}
          </Stack>
        </SheetContent>
        <SheetFooter>
          <Button variant="outline" onPress={handleClose}>
            Close
          </Button>
        </SheetFooter>
      </Sheet>
    )
  }

  return (
    <Sheet visible={open} onClose={handleClose} height="full" maxHeight={0.9}>
      <SheetHeader
        title={`Send Inquiry to ${applicationIds.length} Candidates`}
        onClose={handleClose}
      />
      <SheetContent scrollable={false}>
        <FormProvider {...form}>
          <Stack padding="md" style={{ flex: 1 }}>
            <Row gap={16} style={{ flex: 1 }}>
              {/* Main Form */}
              <Stack style={{ flex: 1 }} gap={16}>
                <ScrollView>
                  <Stack gap={24} padding="md">
                    {/* Header */}
                    <Stack gap={8}>
                      <Text style={{ color: colors.text[t].secondary }}>
                        The same inquiry will be sent to all selected candidates
                      </Text>
                    </Stack>

                    {/* Progress indicator */}
                    {isSubmitting && (
                      <Stack gap={8} padding="md" style={{ backgroundColor: t === 'dark' ? colors.blue[900] : colors.blue[50] }} borderRadius={16}>
                        <Text>Sending inquiries...</Text>
                        <ProgressBarBase value={75} />
                        <Text style={{ color: colors.text[t].secondary }}>
                          Please wait while we send inquiries to all candidates
                        </Text>
                      </Stack>
                    )}

                    {/* Employment Section */}
                    <Stack gap={16}>
                      <Row align="center" gap={8}>
                        <Text>Employment</Text>
                      </Row>

                      {/* Employment Type */}
                      <Stack gap={8}>
                        <Text>Employment type</Text>
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
                                    style={{ flex: 1 }}
                                    color={isSelected ? 'primary' : undefined}
                                    variant={isSelected ? undefined : 'outline'}
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
                              <Checkbox
                                checked={!field.value}
                                onChange={(checked: boolean) => field.onChange(!checked)}
                                size="md"
                              />
                            )}
                          />
                          <Text style={{ color: colors.text[t].secondary }}>Non-negotiable</Text>
                        </Row>
                      </Stack>

                      {/* Work Schedule */}
                      <Stack gap={8}>
                        <Text>Work schedule</Text>
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
                                    style={{ flex: 1 }}
                                    color={isSelected ? 'primary' : undefined}
                                    variant={isSelected ? undefined : 'outline'}
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
                      </Stack>
                    </Stack>

                    <Separator />

                    {/* Compensation Section */}
                    <Stack gap={16}>
                      <Text>Compensation</Text>

                      {/* Rate Type */}
                      <Stack gap={8}>
                        <Text>Rate type</Text>
                        <Controller
                          control={control}
                          name="rateType"
                          render={({ field }) => (
                            <Row gap={8}>
                              <Button
                                style={{ flex: 1 }}
                                color={field.value === 'hourly' ? 'primary' : undefined}
                                variant={field.value === 'hourly' ? undefined : 'outline'}
                                onPress={() => field.onChange('hourly')}
                                size="md"
                              >
                                Hourly
                              </Button>
                              <Button
                                style={{ flex: 1 }}
                                color={field.value === 'salary' ? 'primary' : undefined}
                                variant={field.value === 'salary' ? undefined : 'outline'}
                                onPress={() => field.onChange('salary')}
                                size="md"
                              >
                                Salary
                              </Button>
                            </Row>
                          )}
                        />
                      </Stack>

                      {/* Rate Range */}
                      <Row gap={8}>
                        <Stack gap={8} flex={1}>
                          <Text>Minimum rate</Text>
                          <Controller
                            control={control}
                            name="rateMinCents"
                            render={({ field }) => (
                              <Input
                                placeholder={
                                  watchedValues.rateType === 'hourly' ? '$0.00/hr' : '$0,000/yr'
                                }
                                value={formatCentsToDollars(field.value)}
                                onChangeText={(text) => {
                                  const cents = parseDollarsToCents(text)
                                  field.onChange(cents)
                                }}
                                keyboardType="numeric"
                              />
                            )}
                          />
                        </Stack>
                        <Stack gap={8} flex={1}>
                          <Text>Maximum rate (optional)</Text>
                          <Controller
                            control={control}
                            name="rateMaxCents"
                            render={({ field }) => (
                              <Input
                                placeholder={
                                  watchedValues.rateType === 'hourly' ? '$0.00/hr' : '$0,000/yr'
                                }
                                value={formatCentsToDollars(field.value)}
                                onChangeText={(text) => {
                                  const cents = parseDollarsToCents(text)
                                  field.onChange(cents)
                                }}
                                keyboardType="numeric"
                              />
                            )}
                          />
                        </Stack>
                      </Row>
                    </Stack>

                    <Separator />

                    {/* Other Section */}
                    <Stack gap={16}>
                      <Text>Additional Notes</Text>
                      <Controller
                        control={control}
                        name="additionalNotes"
                        render={({ field }) => (
                          <TextArea
                            placeholder="Add any additional information or requirements..."
                            value={field.value || ''}
                            onChangeText={field.onChange}
                            style={{ minHeight: 120 }}
                          />
                        )}
                      />
                    </Stack>

                  </Stack>
                </ScrollView>
              </Stack>

              {/* Help Sidebar */}
              <Stack
                style={{ width: 300, padding: 16, backgroundColor: colors.bg[t].muted, borderLeftWidth: 1, borderLeftColor: colors.border[t].default }}
              >
                <InquiryHelpSidebar />
              </Stack>
            </Row>
          </Stack>
        </FormProvider>
      </SheetContent>
      <SheetFooter align="space-between">
        <Button variant="outline" onPress={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onPress={onSubmit} disabled={isSubmitting} color="primary">
          {isSubmitting
            ? 'Sending...'
            : `Send to ${applicationIds.length} Candidates`}
        </Button>
      </SheetFooter>
    </Sheet>
  )
}
