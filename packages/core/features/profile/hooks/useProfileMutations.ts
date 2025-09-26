import { useMutation } from '@tanstack/react-query'
import { useSupabase } from '@app/core/utils/supabase/useSupabase'
import { useToastController } from '@app/ui'
import { useRouter } from 'solito/router'
import { isWeb } from '@app/ui'
import {
  persistBasicInfo,
  persistWorkSkills,
  persistTravelCompliance,
  persistContactAvailability,
} from '../mutations/profile-mutations'
import type { BasicInfoFormValues } from '../schemas/basic-info-schema'
import type { WorkSkillsFormValues } from '../schemas/work-skills-schema'
import type { TravelComplianceFormValues } from '../schemas/travel-compliance-schema'
import type { ContactAvailabilityFormValues } from '../schemas/contact-availability-schema'

type UseMutationOptions = {
  onSuccess?: () => void
  updateProfile?: () => Promise<unknown> | void
}

export const useBasicInfoMutation = ({ onSuccess, updateProfile }: UseMutationOptions = {}) => {
  const supabase = useSupabase()
  const toast = useToastController()
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ userId, values }: { userId: string; values: BasicInfoFormValues }) => {
      await persistBasicInfo({ supabase, userId, values, updateProfile })
    },
    onSuccess: () => {
      toast.show('Basic information updated successfully!')
      if (!isWeb) {
        router.back()
      }
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.show('Failed to update basic information', {
        message: error.message,
      })
    },
  })
}

export const useWorkSkillsMutation = ({ onSuccess, updateProfile }: UseMutationOptions = {}) => {
  const supabase = useSupabase()
  const toast = useToastController()
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ userId, values }: { userId: string; values: WorkSkillsFormValues }) => {
      await persistWorkSkills({ supabase, userId, values, updateProfile })
    },
    onSuccess: () => {
      toast.show('Work & skills updated successfully!')
      if (!isWeb) {
        router.back()
      }
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.show('Failed to update work & skills', {
        message: error.message,
      })
    },
  })
}

export const useTravelComplianceMutation = ({
  onSuccess,
  updateProfile,
}: UseMutationOptions = {}) => {
  const supabase = useSupabase()
  const toast = useToastController()
  const router = useRouter()

  return useMutation({
    mutationFn: async ({
      userId,
      values,
    }: { userId: string; values: TravelComplianceFormValues }) => {
      await persistTravelCompliance({ supabase, userId, values, updateProfile })
    },
    onSuccess: () => {
      toast.show('Travel & compliance updated successfully!')
      if (!isWeb) {
        router.back()
      }
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.show('Failed to update travel & compliance', {
        message: error.message,
      })
    },
  })
}

export const useContactAvailabilityMutation = ({
  onSuccess,
  updateProfile,
}: UseMutationOptions = {}) => {
  const supabase = useSupabase()
  const toast = useToastController()
  const router = useRouter()

  return useMutation({
    mutationFn: async ({
      userId,
      values,
    }: { userId: string; values: ContactAvailabilityFormValues }) => {
      await persistContactAvailability({ supabase, userId, values, updateProfile })
    },
    onSuccess: () => {
      toast.show('Contact & availability updated successfully!')
      if (!isWeb) {
        router.back()
      }
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.show('Failed to update contact & availability', {
        message: error.message,
      })
    },
  })
}
