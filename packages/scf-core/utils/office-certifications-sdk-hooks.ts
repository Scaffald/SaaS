/**
 * Office Certifications SDK hooks. Manages certification catalog (admin).
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */

import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  OfficeCertification,
  CreateOfficeCertificationParams,
  UpdateOfficeCertificationParams,
} from '@scaffald/sdk'

export function useCreateOfficeCertificationMutation(
  options?: UseMutationOptions<{ certification: OfficeCertification }, Error, CreateOfficeCertificationParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation<{ certification: OfficeCertification }, Error, CreateOfficeCertificationParams>({
    mutationFn: async (params) => {
      if (!client) throw new Error('Missing client')
      return client.officeCertifications.create(params)
    },
    ...options,
  })
}

export function useUpdateOfficeCertificationMutation(
  options?: UseMutationOptions<{ certification: OfficeCertification }, Error, { id: string; params: UpdateOfficeCertificationParams }>
) {
  const client = useScaffaldJobsClient()
  return useMutation<{ certification: OfficeCertification }, Error, { id: string; params: UpdateOfficeCertificationParams }>({
    mutationFn: async ({ id, params }) => {
      if (!client) throw new Error('Missing client')
      return client.officeCertifications.update(id, params)
    },
    ...options,
  })
}
