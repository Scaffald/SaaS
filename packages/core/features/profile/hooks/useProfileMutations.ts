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
import type { GeneralFormValues } from '../schemas/general-schema'
import type { SkillsFormValues } from '../schemas/skills-schema'
import type { BackgroundFormValues } from '../schemas/background-schema'
import type { ContactAvailabilityFormValues } from '../schemas/contact-availability-schema'

type UseMutationOptions = {
  onSuccess?: () => void
  updateProfile?: () => Promise<unknown> | void
}

export const useGeneralMutation = ({ onSuccess, updateProfile }: UseMutationOptions = {}) => {
  const supabase = useSupabase()
  const toast = useToastController()
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ userId, values }: { userId: string; values: GeneralFormValues }) => {
      await persistBasicInfo({ supabase, userId, values, updateProfile })
    },
    onSuccess: () => {
      toast.show('General information updated successfully!')
      if (!isWeb) {
        router.back()
      }
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.show('Failed to update general information', {
        message: error.message,
      })
    },
  })
}

// Backward compatibility
export const useBasicInfoMutation = useGeneralMutation

export const useSkillsMutation = ({ onSuccess, updateProfile }: UseMutationOptions = {}) => {
  const supabase = useSupabase()
  const toast = useToastController()
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ userId, values }: { userId: string; values: SkillsFormValues }) => {
      await persistWorkSkills({ supabase, userId, values, updateProfile })
    },
    onSuccess: () => {
      toast.show('Skills updated successfully!')
      if (!isWeb) {
        router.back()
      }
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.show('Failed to update skills', {
        message: error.message,
      })
    },
  })
}

// Backward compatibility
export const useWorkSkillsMutation = useSkillsMutation

export const useBackgroundMutation = ({ onSuccess, updateProfile }: UseMutationOptions = {}) => {
  const supabase = useSupabase()
  const toast = useToastController()
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ userId, values }: { userId: string; values: BackgroundFormValues }) => {
      await persistTravelCompliance({ supabase, userId, values, updateProfile })
    },
    onSuccess: () => {
      toast.show('Background updated successfully!')
      if (!isWeb) {
        router.back()
      }
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.show('Failed to update background', {
        message: error.message,
      })
    },
  })
}

// Backward compatibility
export const useTravelComplianceMutation = useBackgroundMutation

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
