import { useMemo } from 'react'
import { YStack, XStack, Text, ScrollView, Separator, Button } from '@app/ui'
import { api } from '@app/core/utils/api'
import { ComparisonColumn, type InquiryComparisonRecord } from './ComparisonColumn'

interface InquiryComparisonViewProps {
  inquiryIds: string[]
  onClose?: () => void
}

export function InquiryComparisonView({ inquiryIds, onClose }: InquiryComparisonViewProps) {
  const {
    data,
    isLoading,
    error,
  } = api.inquiries.getMultiple.useQuery({
    inquiryIds,
  })
  const inquiries = data as InquiryComparisonRecord[] | undefined

  // Calculate differences for highlighting
  const differences = useMemo(() => {
    if (!inquiries || inquiries.length < 2) return new Set<string>()

    const diffFields = new Set<string>()

    // Compare employment type
    const employmentTypes = inquiries.map((i) => i.inquiry.employment_type)
    if (new Set(employmentTypes).size > 1) {
      diffFields.add('employmentType')
    }

    // Compare work schedule
    const workSchedules = inquiries.map((i) => i.inquiry.work_schedule)
    if (new Set(workSchedules).size > 1) {
      diffFields.add('workSchedule')
    }

    // Compare working hours
    const workingHours = inquiries.map(
      (i) => `${i.inquiry.working_hours_start}-${i.inquiry.working_hours_end}`
    )
    if (new Set(workingHours).size > 1) {
      diffFields.add('workingHours')
    }

    // Compare rate
    const rates = inquiries.map(
      (i) => `${i.inquiry.rate_type}-${i.inquiry.rate_min_cents}-${i.inquiry.rate_max_cents}`
    )
    if (new Set(rates).size > 1) {
      diffFields.add('rate')
    }

    return diffFields
  }, [inquiries])

  if (isLoading) {
    return (
      <YStack p="$4" items="center" gap="$4">
        <Text>Loading inquiries for comparison...</Text>
      </YStack>
    )
  }

  if (error || !inquiries || inquiries.length === 0) {
    return (
      <YStack p="$4" items="center" gap="$4">
        <Text color="$red10">Failed to load inquiries for comparison</Text>
        {onClose && (
          <Button variant="outlined" onPress={onClose}>
            Close
          </Button>
        )}
      </YStack>
    )
  }

  return (
    <YStack gap="$4" p="$4" flex={1}>
      {/* Header */}
      <XStack justify="space-between" items="center">
        <YStack gap="$1">
          <Text fontSize="$8" fontWeight="600">
            Compare Inquiries
          </Text>
          <Text fontSize="$3" color="$color11">
            Comparing {inquiries.length} candidate{inquiries.length !== 1 ? 's' : ''}
          </Text>
        </YStack>
        {onClose && (
          <Button variant="outlined" onPress={onClose}>
            Close
          </Button>
        )}
      </XStack>

      {/* Comparison Grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <XStack gap="$4" pb="$4" style={{ minWidth: '100%' }}>
          {inquiries.map((inquiryData) => (
            <ComparisonColumn
              key={inquiryData.inquiry.id}
              inquiryData={inquiryData}
              width={400}
              highlightDifferences={differences}
            />
          ))}
        </XStack>
      </ScrollView>
    </YStack>
  )
}

