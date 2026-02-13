import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query'
import type {
  AwardResultsViewXPResponse,
  GenerateReportParams,
  GenerateReportResponse,
  GenerateShareTokenParams,
  GenerateShareTokenResponse,
  RevokeShareTokenParams,
  SaveIPIPProgressParams,
  SaveLuscher1Params,
  SaveLuscher2Params,
  SaveLuscherTestSessionParams,
  SaveLuscherTestSessionResponse,
  SaveProgressResponse,
  UpdateCurrentStepParams,
} from '@scaffald/sdk/resources/personality-assessment'
import { useScaffaldJobsClient } from './jobs-sdk-context'

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get assessment status or create new assessment
 * Returns current progress or creates a new assessment if none exists
 */
export function useAssessmentStatus(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['personality-assessment', 'status'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.personalityAssessments.getStatus()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 30 * 1000, // 30 seconds - status changes frequently
  })
}

/**
 * Get IPIP assessment completion status
 */
export function useIPIPStatus(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['personality-assessment', 'ipip', 'status'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.personalityAssessments.getIPIPStatus()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 30 * 1000,
  })
}

/**
 * Get Luscher Test 1 completion status
 */
export function useLuscherTest1Status(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['personality-assessment', 'luscher-1', 'status'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.personalityAssessments.getLuscherTest1Status()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 30 * 1000,
  })
}

/**
 * Get Luscher Test 2 completion status
 */
export function useLuscherTest2Status(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['personality-assessment', 'luscher-2', 'status'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.personalityAssessments.getLuscherTest2Status()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 30 * 1000,
  })
}

/**
 * Get Luscher Test availability (cooldown status)
 */
export function useLuscherTestAvailability(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['personality-assessment', 'luscher', 'availability'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.personalityAssessments.getLuscherTestAvailability()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 60 * 1000, // 1 minute - cooldown changes less frequently
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Save Luscher Test 1 results
 */
export function useSaveLuscher1Mutation(
  options?: UseMutationOptions<SaveProgressResponse, Error, SaveLuscher1Params>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: SaveLuscher1Params) => {
      if (!client) throw new Error('Missing client')
      return client.personalityAssessments.saveLuscher1(params)
    },
    ...options,
    onSuccess: async (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'status'] })
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'luscher-1'] })
      // biome-ignore lint/suspicious/noExplicitAny: Safe callback invocation pattern
      await (options?.onSuccess as any)?.(data, variables, context)
    },
  })
}

/**
 * Save IPIP progress (incremental saves)
 */
export function useSaveIPIPProgressMutation(
  options?: UseMutationOptions<SaveProgressResponse, Error, SaveIPIPProgressParams>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: SaveIPIPProgressParams) => {
      if (!client) throw new Error('Missing client')
      return client.personalityAssessments.saveIPIPProgress(params)
    },
    ...options,
    onSuccess: async (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'status'] })
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'ipip'] })
      // biome-ignore lint/suspicious/noExplicitAny: Safe callback invocation pattern
      await (options?.onSuccess as any)?.(data, variables, context)
    },
  })
}

/**
 * Save Luscher Test 2 results
 */
export function useSaveLuscher2Mutation(
  options?: UseMutationOptions<SaveProgressResponse, Error, SaveLuscher2Params>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: SaveLuscher2Params) => {
      if (!client) throw new Error('Missing client')
      return client.personalityAssessments.saveLuscher2(params)
    },
    ...options,
    onSuccess: async (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'status'] })
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'luscher-2'] })
      // biome-ignore lint/suspicious/noExplicitAny: Safe callback invocation pattern
      await (options?.onSuccess as any)?.(data, variables, context)
    },
  })
}

/**
 * Update current step
 * Used to advance to the next step after cooldown completes
 */
export function useUpdateCurrentStepMutation(
  options?: UseMutationOptions<SaveProgressResponse, Error, UpdateCurrentStepParams>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: UpdateCurrentStepParams) => {
      if (!client) throw new Error('Missing client')
      return client.personalityAssessments.updateCurrentStep(params)
    },
    ...options,
    onSuccess: async (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'status'] })
      // biome-ignore lint/suspicious/noExplicitAny: Safe callback invocation pattern
      await (options?.onSuccess as any)?.(data, variables, context)
    },
  })
}

/**
 * Save unified Luscher test session (both parts + diary + XP + cooldown)
 */
export function useSaveLuscherTestSessionMutation(
  options?: UseMutationOptions<SaveLuscherTestSessionResponse, Error, SaveLuscherTestSessionParams>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: SaveLuscherTestSessionParams) => {
      if (!client) throw new Error('Missing client')
      return client.personalityAssessments.saveLuscherTestSession(params)
    },
    ...options,
    onSuccess: async (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'status'] })
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'luscher'] })
      // biome-ignore lint/suspicious/noExplicitAny: Safe callback invocation pattern
      await (options?.onSuccess as any)?.(data, variables, context)
    },
  })
}

/**
 * Generate AI report from Luscher results
 * This calls OpenAI to generate a personality report
 */
export function useGenerateReportMutation(
  options?: UseMutationOptions<GenerateReportResponse, Error, GenerateReportParams>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: GenerateReportParams) => {
      if (!client) throw new Error('Missing client')
      return client.personalityAssessments.generateReport(params)
    },
    ...options,
    onSuccess: async (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'status'] })
      // biome-ignore lint/suspicious/noExplicitAny: Safe callback invocation pattern
      await (options?.onSuccess as any)?.(data, variables, context)
    },
  })
}

/**
 * Generate share token for IPIP results
 */
export function useGenerateShareTokenMutation(
  options?: UseMutationOptions<
    GenerateShareTokenResponse,
    Error,
    GenerateShareTokenParams | undefined
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params?: GenerateShareTokenParams) => {
      if (!client) throw new Error('Missing client')
      return client.personalityAssessments.generateShareToken(params)
    },
    ...options,
  })
}

/**
 * Revoke share token
 */
export function useRevokeShareTokenMutation(
  options?: UseMutationOptions<SaveProgressResponse, Error, RevokeShareTokenParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: RevokeShareTokenParams) => {
      if (!client) throw new Error('Missing client')
      return client.personalityAssessments.revokeShareToken(params)
    },
    ...options,
  })
}

/**
 * Award XP for viewing results (one-time)
 */
export function useAwardResultsViewXPMutation(
  options?: UseMutationOptions<AwardResultsViewXPResponse, Error, void>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.personalityAssessments.awardResultsViewXP()
    },
    ...options,
  })
}
