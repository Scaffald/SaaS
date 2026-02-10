import { useMultipleInquiries } from '@scf/core/utils/inquiries-sdk-hooks'
import { Button, ScrollView, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { useMemo } from 'react'
import { ComparisonColumn, type InquiryComparisonRecord } from './ComparisonColumn'

interface InquiryComparisonViewProps {
  inquiryIds: string[]
  onClose?: () => void
  onRemoveInquiry?: (inquiryId: string) => void
}

export function InquiryComparisonView({
  inquiryIds,
  onClose,
  onRemoveInquiry,
}: InquiryComparisonViewProps) {
  const { data, isLoading, error } = useMultipleInquiries(inquiryIds)
  const inquiries = data as InquiryComparisonRecord[] | undefined

  const differences = useMemo(() => {
    if (!inquiries || inquiries.length < 2) return new Set<string>()

    const diffFields = new Set<string>()

    const compare = (key: string, getValue: (record: InquiryComparisonRecord) => unknown) => {
      const serialized = inquiries.map((record) => serializeValue(getValue(record)))
      if (new Set(serialized).size > 1) {
        diffFields.add(key)
      }
    }

    compare('employmentType', (record) => record.inquiry.employment_type)
    compare('workSchedule', (record) => record.inquiry.work_schedule)
    compare(
      'workingHours',
      (record) => `${record.inquiry.working_hours_start}-${record.inquiry.working_hours_end}`
    )
    compare('workingHoursTimezone', (record) => record.inquiry.working_hours_timezone)
    compare('workdays', (record) => (record.inquiry.workdays ?? []).join(','))
    compare('employmentStartDate', (record) => record.inquiry.employment_start_date)
    compare('workScheduleNegotiable', (record) => record.inquiry.work_schedule_negotiable)
    compare('workingHoursNegotiable', (record) => record.inquiry.working_hours_negotiable)
    compare('employmentDatesNegotiable', (record) => record.inquiry.employment_dates_negotiable)
    compare(
      'rate',
      (record) =>
        `${record.inquiry.rate_type}-${record.inquiry.rate_min_cents}-${record.inquiry.rate_max_cents}`
    )
    compare('rateNegotiable', (record) => record.inquiry.rate_negotiable)
    compare('willingToTravel', (record) => record.inquiry.willing_to_travel)
    compare('willingToWorkOvertime', (record) => record.inquiry.willing_to_work_overtime)
    compare('hasDriversLicense', (record) => record.inquiry.has_drivers_license)

    // Capabilities
    const capabilityNames = new Set<string>()
    for (const record of inquiries) {
      if (record.capabilityResponses) {
        for (const response of record.capabilityResponses) {
          capabilityNames.add(response.capability_name)
        }
      }
    }

    for (const name of capabilityNames) {
      const serialized = inquiries.map((record) => {
        const response = record.capabilityResponses?.find(
          (entry: InquiryComparisonRecord['capabilityResponses'][number]) =>
            entry.capability_name === name
        )
        const value =
          response?.response_value !== null && response?.response_value !== undefined
            ? response.response_value.toString()
            : (response?.response_text ?? 'Not answered')
        return serializeValue(value)
      })
      if (new Set(serialized).size > 1) {
        diffFields.add(`capability:${name}`)
      }
    }

    return diffFields
  }, [inquiries])

  const summary = useMemo(() => {
    if (!inquiries) return null
    const statuses = new Set(inquiries.map((record) => record.inquiry.status))
    return {
      uniqueStatuses: statuses,
    }
  }, [inquiries])

  if (isLoading) {
    return (
      <Stack padding="$4" alignItems="center" gap="$4">
        <Text>Loading inquiries for comparison...</Text>
      </Stack>
    )
  }

  if (error || !inquiries || inquiries.length === 0) {
    return (
      <Stack padding="$4" alignItems="center" gap="$4">
        <Text color="$red10">Failed to load inquiries for comparison</Text>
        {onClose && (
          <Button variant="outlined" onPress={onClose}>
            Close
          </Button>
        )}
      </Stack>
    )
  }

  return (
    <Stack gap="$4" padding="$4" flex={1}>
      {/* Header */}
      <Row justifyContent="space-between" alignItems="center">
        <Stack gap="$1">
          <Text fontSize="$8" fontWeight="600">
            Compare Inquiries
          </Text>
          <Text fontSize="$3" color="$color11">
            Comparing {inquiries.length} candidate{inquiries.length !== 1 ? 's' : ''}
          </Text>
          {summary && summary.uniqueStatuses.size > 1 && (
            <Text fontSize="$2" color="$color10">
              Highlighted rows indicate differing terms between candidates.
            </Text>
          )}
        </Stack>
        {onClose && (
          <Button variant="outlined" onPress={onClose}>
            Close
          </Button>
        )}
      </Row>

      {/* Comparison Grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Row gap="$4" paddingBottom="$4" style={{ minWidth: '100%' }}>
          {inquiries.map((inquiryData) => (
            <ComparisonColumn
              key={inquiryData.inquiry.id}
              inquiryData={inquiryData}
              width={400}
              highlightDifferences={differences}
              canRemove={Boolean(onRemoveInquiry) && inquiryIds.length > 2}
              onRemove={onRemoveInquiry}
            />
          ))}
        </Row>
      </ScrollView>
    </Stack>
  )
}

function serializeValue(value: unknown) {
  if (value === null || value === undefined) return 'null'
  if (Array.isArray(value)) return JSON.stringify(value)
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
