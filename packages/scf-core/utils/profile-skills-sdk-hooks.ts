/**
 * React Query hooks for Scaffald SDK Skills endpoints
 * Provides hooks for soft skills, hard skills, and multi-taxonomy skills
 */

import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  GetSoftSkillsParams,
  GetSoftSkillsResponse,
  UpdateSoftSkillsParams,
  UpdateSoftSkillsResponse,
  GetSoftSkillsHistoryResponse,
  GetSoftSkillsComparisonResponse,
  GetSkillIndustriesResponse,
  SearchParentSkillsParams,
  SearchParentSkillsResponse,
  GetSkillChildrenParams,
  GetSkillChildrenResponse,
  GetSkillDetailsParams,
  GetSkillDetailsResponse,
  GetUserSkillsResponse,
  AddUserSkillParams,
  UpdateUserSkillParams,
  RemoveUserSkillParams,
  GetUserSkillsMTResponse,
  AddSkillMTParams,
  UpdateSkillMTParams,
  RemoveSkillMTParams,
  GetPrimaryIndustryResponse,
  UpdatePrimaryIndustryParams,
  GetSkillsLegacyResponse,
  UpdateSkillsLegacyParams,
  SuccessResponse,
} from '@scaffald/sdk'

// ============================================================================
// SOFT SKILLS QUERY HOOKS
// ============================================================================

export function useSoftSkills(
  params?: GetSoftSkillsParams,
  options?: Omit<UseQueryOptions<GetSoftSkillsResponse, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['scaffald', 'skills', 'soft', params],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skills.getSoftSkills(params)
    },
    enabled: !!client && options?.enabled !== false,
    ...options,
  })
}

export function useSoftSkillsHistory(
  options?: Omit<UseQueryOptions<GetSoftSkillsHistoryResponse, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['scaffald', 'skills', 'soft', 'history'],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skills.getSoftSkillsHistory()
    },
    enabled: !!client && options?.enabled !== false,
    ...options,
  })
}

export function useSoftSkillsComparison(
  options?: Omit<UseQueryOptions<GetSoftSkillsComparisonResponse, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['scaffald', 'skills', 'soft', 'comparison'],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skills.getSoftSkillsComparison()
    },
    enabled: !!client && options?.enabled !== false,
    ...options,
  })
}

// ============================================================================
// SOFT SKILLS MUTATION HOOKS
// ============================================================================

export function useUpdateSoftSkillsMutation(
  options?: UseMutationOptions<UpdateSoftSkillsResponse, Error, UpdateSoftSkillsParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: UpdateSoftSkillsParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skills.updateSoftSkills(params)
    },
    ...options,
  })
}

// ============================================================================
// HARD SKILLS QUERY HOOKS (Hierarchical)
// ============================================================================

export function useIndustries(
  options?: Omit<UseQueryOptions<GetSkillIndustriesResponse, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['scaffald', 'skills', 'industries'],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skills.getIndustries()
    },
    enabled: !!client && options?.enabled !== false,
    ...options,
  })
}

export function useSkillChildren(
  params: GetSkillChildrenParams,
  options?: Omit<UseQueryOptions<GetSkillChildrenResponse, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['scaffald', 'skills', 'children', params.parentId],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skills.getSkillChildren(params)
    },
    enabled: !!client && !!params.parentId && options?.enabled !== false,
    ...options,
  })
}

export function useSkillDetails(
  params: GetSkillDetailsParams,
  options?: Omit<UseQueryOptions<GetSkillDetailsResponse, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['scaffald', 'skills', 'details', params.skillId],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skills.getSkillDetails(params)
    },
    enabled: !!client && !!params.skillId && options?.enabled !== false,
    ...options,
  })
}

export function useUserSkills(
  options?: Omit<UseQueryOptions<GetUserSkillsResponse, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['scaffald', 'skills', 'user'],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skills.getUserSkills()
    },
    enabled: !!client && options?.enabled !== false,
    ...options,
  })
}

// ============================================================================
// HARD SKILLS MUTATION HOOKS
// ============================================================================

export function useSearchParentSkillsMutation(
  options?: UseMutationOptions<SearchParentSkillsResponse, Error, SearchParentSkillsParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: SearchParentSkillsParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skills.searchParentSkills(params)
    },
    ...options,
  })
}

export function useAddUserSkillMutation(
  options?: UseMutationOptions<SuccessResponse, Error, AddUserSkillParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: AddUserSkillParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skills.addUserSkill(params)
    },
    ...options,
  })
}

export function useUpdateUserSkillMutation(
  options?: UseMutationOptions<SuccessResponse, Error, UpdateUserSkillParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: UpdateUserSkillParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skills.updateUserSkill(params)
    },
    ...options,
  })
}

export function useRemoveUserSkillMutation(
  options?: UseMutationOptions<SuccessResponse, Error, RemoveUserSkillParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: RemoveUserSkillParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skills.removeUserSkill(params)
    },
    ...options,
  })
}

// ============================================================================
// MULTI-TAXONOMY SKILLS QUERY HOOKS
// ============================================================================

export function useUserSkillsMultiTaxonomy(
  options?: Omit<UseQueryOptions<GetUserSkillsMTResponse, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['scaffald', 'skills', 'multi-taxonomy'],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skills.getUserSkillsMultiTaxonomy()
    },
    enabled: !!client && options?.enabled !== false,
    ...options,
  })
}

export function usePrimaryIndustry(
  options?: Omit<UseQueryOptions<GetPrimaryIndustryResponse, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['scaffald', 'skills', 'primary-industry'],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skills.getPrimaryIndustry()
    },
    enabled: !!client && options?.enabled !== false,
    ...options,
  })
}

// ============================================================================
// MULTI-TAXONOMY SKILLS MUTATION HOOKS
// ============================================================================

export function useAddSkillMultiTaxonomyMutation(
  options?: UseMutationOptions<SuccessResponse, Error, AddSkillMTParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: AddSkillMTParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skills.addSkillMultiTaxonomy(params)
    },
    ...options,
  })
}

export function useUpdateSkillMultiTaxonomyMutation(
  options?: UseMutationOptions<SuccessResponse, Error, UpdateSkillMTParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: UpdateSkillMTParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skills.updateSkillMultiTaxonomy(params)
    },
    ...options,
  })
}

export function useRemoveSkillMultiTaxonomyMutation(
  options?: UseMutationOptions<SuccessResponse, Error, RemoveSkillMTParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: RemoveSkillMTParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skills.removeSkillMultiTaxonomy(params)
    },
    ...options,
  })
}

export function useUpdatePrimaryIndustryMutation(
  options?: UseMutationOptions<SuccessResponse, Error, UpdatePrimaryIndustryParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: UpdatePrimaryIndustryParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skills.updatePrimaryIndustry(params)
    },
    ...options,
  })
}

// ============================================================================
// LEGACY SKILLS HOOKS (Backwards Compatibility)
// ============================================================================

// useSkillsLegacy / useUpdateSkillsLegacyMutation were removed here. They called
// GET and PATCH /v1/profiles/skills/legacy, which return 404 — that route has
// never been registered on the api function. The only consumer was SkillsWidget,
// which is now on useSkillsWidget({ userId }); see #603 for why that also fixed
// the widget showing the *viewer's* skills on someone else's profile.
//
// The corresponding SDK methods (client.skills.getSkillsLegacy /
// updateSkillsLegacy) still exist in the @scaffald/sdk submodule and are now
// unreferenced; removing them needs its own PR + pointer bump there.

