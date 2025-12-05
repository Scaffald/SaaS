import { api } from '@scf/core/utils/api'
import { type InquiryCreateInput, type InquiryUpdateInput, inquiryCreateSchema } from '@scf/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToastController } from '@tamagui/toast'
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
  updateMutation: ReturnType<typeof api.inquiries.update.useMutation>
  isSubmitting: boolean
  handleSubmit: (data: InquiryCreateInput) => Promise<void>
}

export function useInquiryEdit({
  inquiryId,
  initialData,
  onSuccess,
}: UseInquiryEditOptions): UseInquiryEditReturn {
  const toast = useToastController()
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

  const updateMutation = api.inquiries.update.useMutation({
    onSuccess: () => {
      toast.show('Inquiry updated', {
        message: 'The inquiry has been updated. The candidate will be notified if terms changed.',
      })
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [['inquiries', 'getByApplication']] })
      onSuccess?.()
    },
    onError: (error: { message?: string }) => {
      toast.show('Failed to update inquiry', {
        message: error.message ?? 'Please try again.',
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
