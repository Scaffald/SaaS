/**
 * CMS SDK hooks for welcome slides.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  CreateWelcomeSlideParams,
  ListWelcomeSlidesParams,
  UpdateWelcomeSlideParams,
} from '@scaffald/sdk'

/** Get active welcome slides (public) */
export function useActiveWelcomeSlides(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['cms', 'welcomeSlides', 'active'],
    queryFn: async () => {
      if (!client) throw new Error('Missing SDK client')
      return client.cms.getActiveWelcomeSlides()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/** List welcome slides (office role, supports include_inactive) */
export function useWelcomeSlidesList(params?: ListWelcomeSlidesParams) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['cms', 'welcomeSlides', 'list', params?.include_inactive],
    queryFn: async () => {
      if (!client) throw new Error('Missing SDK client')
      return client.cms.listWelcomeSlides(params)
    },
    enabled: !!client,
    staleTime: 1 * 60 * 1000,
  })
}

/** Get single welcome slide by ID (office role) */
export function useWelcomeSlide(id: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['cms', 'welcomeSlides', id],
    queryFn: async () => {
      if (!client || !id) throw new Error('Missing client or id')
      return client.cms.getWelcomeSlide(id)
    },
    enabled: !!client && !!id && options?.enabled !== false,
  })
}

/** Create welcome slide (office role) */
export function useCreateWelcomeSlideMutation(
  options?: UseMutationOptions<
    { slide: import('@scaffald/sdk').WelcomeSlide },
    Error,
    CreateWelcomeSlideParams
  >
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: CreateWelcomeSlideParams) => {
      if (!client) throw new Error('Missing SDK client')
      return client.cms.createWelcomeSlide(params)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms', 'welcomeSlides'] })
    },
    ...options,
  })
}

/** Update welcome slide (office role) */
export function useUpdateWelcomeSlideMutation(
  options?: UseMutationOptions<
    { slide: import('@scaffald/sdk').WelcomeSlide },
    Error,
    UpdateWelcomeSlideParams
  >
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: UpdateWelcomeSlideParams) => {
      if (!client) throw new Error('Missing SDK client')
      return client.cms.updateWelcomeSlide(params)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms', 'welcomeSlides'] })
    },
    ...options,
  })
}

/** Delete welcome slide (office role) */
export function useDeleteWelcomeSlideMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, string>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!client) throw new Error('Missing SDK client')
      return client.cms.deleteWelcomeSlide(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms', 'welcomeSlides'] })
    },
    ...options,
  })
}
