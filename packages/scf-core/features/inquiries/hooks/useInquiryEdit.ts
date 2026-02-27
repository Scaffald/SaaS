import { type InquiryCreateInput, type InquiryUpdateInput, inquiryCreateSchema } from '@scf/schemas'
import { useUpdateInquiryMutation } from '@scf/core/utils/inquiries-sdk-hooks'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@scaffald/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'

export interface UseInquiryEditOptions {
  inquiryId: string
  initialData?: InquiryCreateInput
  onSuccess?: () => void
}

export interface UseInquiryEditReturn {
  form: ReturnType<typeof useForm<InquiryCreateInput>>
  updateMutation: ReturnType<typeof useUpdateInquiryMutation>
  isSubmitting: boolean
  handleSubmit: (data: InquiryCreateInput) => Promise<void>
}

export function useInquiryEdit({
  inquiryId,
  initialData,
  onSuccess,
}: UseInquiryEditOptions): UseInquiryEditReturn {
  const toast = useToast()
  const queryClient = useQueryClient()

  const form = useForm<InquiryCreateInput>({
    resolver: zodResolver(inquiryCreateSchema),
    mode: 'onChange',
    defaultValues: useMemo(
      () =>
        initialData || {
          applicationId: '',
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
      [initialData]
    ),
  })

  // Pre-populate form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset(initialData)
    }
  }, [initialData, form])

  const updateMutation = useUpdateInquiryMutation({
    onSuccess: () => {
      toast.show({
        title: 'Inquiry updated',
        message: 'The inquiry has been updated. The candidate will be notified if terms changed.',
      })
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
      onSuccess?.()
    },
    onError: (error) => {
      toast.show({
        title: 'Failed to update inquiry',
        message: error.message ?? 'Please try again.',
        variant: 'error',
      })
    },
  })

  const handleSubmit = useCallback(
    async (data: InquiryCreateInput) => {
      if (!inquiryId) {
        // No-op if no inquiryId
        return
      }
      try {
        // Convert InquiryCreateInput to InquiryUpdateInput
        const updateData: InquiryUpdateInput = {
          id: inquiryId,
          ...data,
        }
        await updateMutation.mutateAsync(updateData)
      } catch (error) {
        console.error('Failed to update inquiry:', error)
      }
    },
    [inquiryId, updateMutation]
  )

  const isSubmitting = updateMutation.isPending

  return {
    form,
    updateMutation,
    isSubmitting,
    handleSubmit,
  }
}
