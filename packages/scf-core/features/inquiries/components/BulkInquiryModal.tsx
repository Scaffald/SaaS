import { useCreateBulkInquiriesMutation } from '@scf/core/utils/inquiries-sdk-hooks'
import { type BulkInquiryInput, bulkInquirySchema } from '@scf/schemas'
import {
  Button,
  CustomCheckbox,
  Input,
  ScrollView,
  Separator,
  Sheet,
  Text,
  Row,
  Stack,
} from '@unicornlove/beyond-ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@unicornlove/beyond-ui'
import { useState } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { Progress, TextArea } from '@unicornlove/beyond-ui'
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
    resolver: zodResolver(bulkInquirySchema),
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
      <Sheet modal open={open} onOpenChange={handleClose}>
        <Sheet.Frame>
          <ScrollView>
            <Stack gap={16} padding="md">
              <Text>Bulk Inquiry Results</Text>

              {/* Summary */}
              <Stack gap={12} padding="md" backgroundColor="$color2" borderRadius={16}>
                <Row gap={8} align="center">
                  <Text color="$green10">✓ {bulkResults.successful} Successful</Text>
                </Row>
                {bulkResults.failed > 0 && (
                  <Row gap={8} align="center">
                    <Text color="$red10">✗ {bulkResults.failed} Failed</Text>
                  </Row>
                )}
                <Text color="$gray11">Total: {bulkResults.total} candidates</Text>
              </Stack>

              {/* Failed details */}
              {bulkResults.failed > 0 && (
                <Stack gap={8}>
                  <Text color="$red10">Failed Inquiries</Text>
                  {bulkResults.results
                    .filter((r) => !r.success)
                    .map((result) => (
                      <Stack
                        key={result.applicationId}
                        padding="sm"
                        backgroundColor="$red2"
                        borderRadius={12}
                        gap={4}
                      >
                        <Text>Application: {result.applicationId}</Text>
                        <Text color="$red11">{result.error || 'Unknown error'}</Text>
                      </Stack>
                    ))}
                </Stack>
              )}

              {/* Actions */}
              <Row gap={12} justify="flex-end" paddingTop={8}>
                <Button variant="outline" onPress={handleClose}>
                  Close
                </Button>
              </Row>
            </Stack>
          </ScrollView>
        </Sheet.Frame>
      </Sheet>
    )
  }

  return (
    <Sheet modal open={open} onOpenChange={handleClose}>
      <Sheet.Frame>
        <FormProvider {...form}>
          <Stack padding="md" flex={1}>
            <Row gap={16} flex={1}>
              {/* Main Form */}
              <Stack flex={1} gap={16}>
                <ScrollView>
                  <Stack gap={24} padding="md">
                    {/* Header */}
                    <Stack gap={8}>
                      <Text>Send Inquiry to {applicationIds.length} Candidates</Text>
                      <Text color="$gray11">
                        The same inquiry will be sent to all selected candidates
                      </Text>
                    </Stack>

                    {/* Progress indicator */}
                    {isSubmitting && (
                      <Stack gap={8} padding="md" backgroundColor="$blue2" borderRadius={16}>
                        <Text>Sending inquiries...</Text>
                        <Progress value={75} />
                        <Text color="$gray11">
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
                                flex={1}
                                theme={field.value === 'hourly' ? 'blue' : 'gray'}
                                variant={field.value === 'hourly' ? undefined : 'outlined'}
                                onPress={() => field.onChange('hourly')}
                                size="md"
                              >
                                Hourly
                              </Button>
                              <Button
                                flex={1}
                                theme={field.value === 'salary' ? 'blue' : 'gray'}
                                variant={field.value === 'salary' ? undefined : 'outlined'}
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
                            numberOfLines={4}
                            height={120}
                          />
                        )}
                      />
                    </Stack>

                    {/* Form Actions */}
                    <Row
                      gap={12}
                      padding="md"
                      backgroundColor="$background"
                      borderTopWidth={1}
                      borderTopColor="$borderColor"
                      justify="flex-end"
                    >
                      <Button variant="outline" onPress={handleClose} disabled={isSubmitting}>
                        Cancel
                      </Button>
                      <Button onPress={onSubmit} disabled={isSubmitting} color="primary">
                        {isSubmitting
                          ? 'Sending...'
                          : `Send to ${applicationIds.length} Candidates`}
                      </Button>
                    </Row>
                  </Stack>
                </ScrollView>
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
          </Stack>
        </FormProvider>
      </Sheet.Frame>
      <Sheet.Overlay />
    </Sheet>
  )
}
