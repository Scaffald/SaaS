import { type InquiryCreateInput, inquiryCreateSchema } from '@scf/schemas'
import {
  useCreateInquiryMutation,
  useSendInquiryMutation,
} from '@scf/core/utils/inquiries-sdk-hooks'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@scaffald/ui'
import { useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'

export interface UseInquiryFormOptions {
  applicationId: string
  onSuccess?: (inquiryId: string) => void
}

export interface UseInquiryFormReturn {
  form: ReturnType<typeof useForm<InquiryCreateInput>>
  createMutation: ReturnType<typeof useCreateInquiryMutation>
  sendMutation: ReturnType<typeof useSendInquiryMutation>
  isSubmitting: boolean
  handleSubmit: (data: InquiryCreateInput) => Promise<void>
  handleSaveDraft: (data: InquiryCreateInput) => Promise<void>
  handleSend: (inquiryId: string) => Promise<void>
}

export function useInquiryForm({
  applicationId,
  onSuccess,
}: UseInquiryFormOptions): UseInquiryFormReturn {
  const toast = useToast()

  const form = useForm<InquiryCreateInput>({
    resolver: zodResolver(inquiryCreateSchema),
    mode: 'onChange',
    defaultValues: useMemo(
      () => ({
        applicationId,
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
      }),
      [applicationId]
    ),
  })

  const createMutation = useCreateInquiryMutation({
    onSuccess: () => {
      toast.show({
        title: 'Inquiry created',
        message: 'Your inquiry has been saved as a draft.',
      })
    },
    onError: (error) => {
      toast.show({
        title: 'Failed to create inquiry',
        message: error.message ?? 'Please try again.',
        variant: 'error',
      })
    },
  })

  const sendMutation = useSendInquiryMutation({
    onSuccess: () => {
      toast.show({
        title: 'Inquiry sent',
        message: 'The inquiry has been sent to the candidate.',
      })
    },
    onError: (error) => {
      toast.show({
        title: 'Failed to send inquiry',
        message: error.message ?? 'Please try again.',
        variant: 'error',
      })
    },
  })

  const handleSend = useCallback(
    async (inquiryId: string) => {
      try {
        await sendMutation.mutateAsync(inquiryId)
        onSuccess?.(inquiryId)
      } catch (error) {
        console.error('Failed to send inquiry:', error)
      }
    },
    [sendMutation, onSuccess]
  )

  const handleSubmit = useCallback(
    async (data: InquiryCreateInput) => {
      try {
        const result = await createMutation.mutateAsync(data)
        if (result && 'id' in result && typeof result.id === 'string') {
          await handleSend(result.id)
        }
      } catch (error) {
        console.error('Failed to create inquiry:', error)
      }
    },
    [createMutation, handleSend]
  )

  const handleSaveDraft = useCallback(
    async (data: InquiryCreateInput) => {
      try {
        await createMutation.mutateAsync(data)
      } catch (error) {
        console.error('Failed to save draft:', error)
      }
    },
    [createMutation]
  )

  const isSubmitting = createMutation.isPending || sendMutation.isPending

  return {
    form,
    createMutation,
    sendMutation,
    isSubmitting,
    handleSubmit,
    handleSaveDraft,
    handleSend,
  }
}
