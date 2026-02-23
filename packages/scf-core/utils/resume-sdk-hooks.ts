/**
 * React hooks for Resume SDK
 * Provides query and mutation hooks for resume upload, AI parsing, and wizard state
 */

import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  UploadResumeParams,
  UploadResumeResponse,
  ParseResumeParams,
  ParseResumeResponse,
  HasUploadedResumeResponse,
  ResumeWizardState,
  SaveResumeSectionParams,
  SaveResumeSectionResponse,
  UpdateResumeProgressParams,
  UpdateResumeProgressResponse,
} from '@scaffald/sdk'

export function useHasUploadedResume(
  options?: Omit<UseQueryOptions<HasUploadedResumeResponse, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  return useQuery<HasUploadedResumeResponse, Error>({
    queryKey: ['resume', 'has-uploaded'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.resume.hasUploaded()
    },
    enabled: !!client && options?.enabled !== false,
    ...options,
  })
}

export function useUploadResumeMutation(
  options?: UseMutationOptions<UploadResumeResponse, Error, UploadResumeParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation<UploadResumeResponse, Error, UploadResumeParams>({
    mutationFn: async (params: UploadResumeParams) => {
      if (!client) throw new Error('Missing client')
      return client.resume.upload(params)
    },
    ...options,
  })
}

export function useParseResumeMutation(
  options?: UseMutationOptions<ParseResumeResponse, Error, ParseResumeParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation<ParseResumeResponse, Error, ParseResumeParams>({
    mutationFn: async (params: ParseResumeParams) => {
      if (!client) throw new Error('Missing client')
      return client.resume.parse(params)
    },
    ...options,
  })
}

export function useResumeWizardState(
  resumeId: string,
  options?: Omit<
    UseQueryOptions<ResumeWizardState | null, Error>,
    'queryKey' | 'queryFn'
  >
) {
  const client = useScaffaldJobsClient()
  return useQuery<ResumeWizardState | null, Error>({
    queryKey: ['resume', 'wizard-state', resumeId],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.resume.getWizardState(resumeId)
    },
    enabled: !!client && !!resumeId && options?.enabled !== false,
    ...options,
  })
}

export function useSaveResumeSectionMutation(
  options?: UseMutationOptions<SaveResumeSectionResponse, Error, SaveResumeSectionParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation<SaveResumeSectionResponse, Error, SaveResumeSectionParams>({
    mutationFn: async (params: SaveResumeSectionParams) => {
      if (!client) throw new Error('Missing client')
      return client.resume.saveSection(params)
    },
    ...options,
  })
}

export function useUpdateResumeProgressMutation(
  options?: UseMutationOptions<UpdateResumeProgressResponse, Error, UpdateResumeProgressParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation<UpdateResumeProgressResponse, Error, UpdateResumeProgressParams>({
    mutationFn: async (params: UpdateResumeProgressParams) => {
      if (!client) throw new Error('Missing client')
      return client.resume.updateProgress(params)
    },
    ...options,
  })
}
