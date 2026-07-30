import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'
import type {
  AcceptSectionParams,
  AcceptSectionResponse,
  AddCommentParams,
  ApplyTemplateParams,
  ApplyTemplateResponse,
  BulkCreateResult,
  ChangeStatusParams,
  ChangeStatusResponse,
  CreateBulkInquiriesParams,
  CreateInquiryParams,
  CreateTemplateParams,
  Inquiry,
  InquiryAuditLog,
  InquiryCapabilityClient,
  InquiryCapabilityResponse,
  InquiryComment,
  InquiryDetails,
  InquiryTemplate,
  SmartDefaults,
  SubmitCapabilityResponseParams,
  UpdateInquiryParams,
  UpdateTemplateParams,
} from './inquiry-capability-types'
import { useScaffaldJobsClient } from '@scf/core/provider'

/**
 * Get templates available for an application's organization
 */
export function useInquiryTemplates(
  applicationId: string | undefined,
  options?: Omit<UseQueryOptions<InquiryTemplate[], Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['inquiries', 'templates', applicationId],
    queryFn: async () => {
      if (!client || !applicationId) throw new Error('Missing client or applicationId')
      return client.inquiries.getTemplates(applicationId)
    },
    enabled: !!client && !!applicationId && options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Create an inquiry template
 */
export function useCreateInquiryTemplateMutation(
  options?: UseMutationOptions<InquiryTemplate, Error, CreateTemplateParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: CreateTemplateParams) => {
      if (!client) throw new Error('Missing client')
      return (client.inquiries as unknown as InquiryCapabilityClient).createTemplate(params)
    },
    ...options,
  })
}

/**
 * Update an inquiry template
 */
export function useUpdateInquiryTemplateMutation(
  options?: UseMutationOptions<InquiryTemplate, Error, UpdateTemplateParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UpdateTemplateParams) => {
      if (!client) throw new Error('Missing client')
      return (client.inquiries as unknown as InquiryCapabilityClient).updateTemplate(params)
    },
    ...options,
  })
}

/**
 * Delete an inquiry template
 */
export function useDeleteInquiryTemplateMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, string>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (templateId: string) => {
      if (!client) throw new Error('Missing client')
      return (client.inquiries as unknown as InquiryCapabilityClient).deleteTemplate(templateId)
    },
    ...options,
  })
}

/**
 * Apply a template and increment usage count
 */
export function useApplyInquiryTemplateMutation(
  options?: UseMutationOptions<ApplyTemplateResponse, Error, ApplyTemplateParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: ApplyTemplateParams) => {
      if (!client) throw new Error('Missing client')
      return (client.inquiries as unknown as InquiryCapabilityClient).applyTemplate(params)
    },
    ...options,
  })
}

/**
 * Get smart defaults derived from the associated job
 */
export function useInquirySmartDefaults(
  applicationId: string | undefined,
  options?: Omit<UseQueryOptions<SmartDefaults, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['inquiries', 'smart-defaults', applicationId],
    queryFn: async () => {
      if (!client || !applicationId) throw new Error('Missing client or applicationId')
      return (client.inquiries as unknown as InquiryCapabilityClient).getSmartDefaults(applicationId)
    },
    enabled: !!client && !!applicationId && options?.enabled !== false,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  })
}

/**
 * Create a new inquiry
 */
export function useCreateInquiryMutation(
  options?: UseMutationOptions<Inquiry, Error, CreateInquiryParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: CreateInquiryParams) => {
      if (!client) throw new Error('Missing client')
      return (client.inquiries as unknown as InquiryCapabilityClient).create(params)
    },
    ...options,
  })
}

/**
 * Create inquiries for multiple applications in bulk
 */
export function useCreateBulkInquiriesMutation(
  options?: UseMutationOptions<BulkCreateResult, Error, CreateBulkInquiriesParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: CreateBulkInquiriesParams) => {
      if (!client) throw new Error('Missing client')
      return (client.inquiries as unknown as InquiryCapabilityClient).createBulk(params)
    },
    ...options,
  })
}

/**
 * Get inquiry by application ID.
 *
 * Resolves to `null` when the application simply has no inquiry yet — a normal
 * state that callers must render as empty rather than as a failure.
 *
 * No `as unknown as InquiryCapabilityClient` cast here: `getByApplication` now
 * exists on the SDK, so this call is type-checked against the real surface. The
 * cast is what let this ship broken — it silenced the missing-method error and
 * the call failed at runtime instead.
 */
export function useInquiryByApplication(
  applicationId: string | undefined,
  options?: Omit<UseQueryOptions<InquiryDetails | null, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['inquiries', 'by-application', applicationId],
    queryFn: async () => {
      if (!client || !applicationId) throw new Error('Missing client or applicationId')
      return client.inquiries.getByApplication(applicationId)
    },
    enabled: !!client && !!applicationId && options?.enabled !== false,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  })
}

/**
 * Get multiple inquiries by IDs for comparison
 */
export function useMultipleInquiries(
  inquiryIds: string[] | undefined,
  options?: Omit<UseQueryOptions<InquiryDetails[], Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['inquiries', 'multiple', inquiryIds],
    queryFn: async () => {
      if (!client || !inquiryIds || inquiryIds.length === 0) {
        throw new Error('Missing client or inquiryIds')
      }
      return (client.inquiries as unknown as InquiryCapabilityClient).getMultiple(inquiryIds)
    },
    enabled: !!client && !!inquiryIds && inquiryIds.length > 0 && options?.enabled !== false,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  })
}

/**
 * Get inquiry history/audit trail
 */
export function useInquiryHistory(
  inquiryId: string | undefined,
  options?: Omit<UseQueryOptions<InquiryAuditLog[], Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['inquiries', 'history', inquiryId],
    queryFn: async () => {
      if (!client || !inquiryId) throw new Error('Missing client or inquiryId')
      return client.inquiries.getHistory(inquiryId)
    },
    enabled: !!client && !!inquiryId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * Send inquiry (change status from draft to sent)
 */
export function useSendInquiryMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, string>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (inquiryId: string) => {
      if (!client) throw new Error('Missing client')
      return (client.inquiries as unknown as InquiryCapabilityClient).send(inquiryId)
    },
    ...options,
  })
}

/**
 * Add comment to an inquiry section
 */
export function useAddInquiryCommentMutation(
  options?: UseMutationOptions<InquiryComment, Error, AddCommentParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: AddCommentParams) => {
      if (!client) throw new Error('Missing client')
      return (client.inquiries as unknown as InquiryCapabilityClient).addComment(params)
    },
    ...options,
  })
}

/**
 * Mark comment as read
 */
export function useMarkCommentReadMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, string>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (commentId: string) => {
      if (!client) throw new Error('Missing client')
      return (client.inquiries as unknown as InquiryCapabilityClient).markCommentRead(commentId)
    },
    ...options,
  })
}

/**
 * Accept a section of the inquiry
 */
export function useAcceptInquirySectionMutation(
  options?: UseMutationOptions<AcceptSectionResponse, Error, AcceptSectionParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: AcceptSectionParams) => {
      if (!client) throw new Error('Missing client')
      return (client.inquiries as unknown as InquiryCapabilityClient).acceptSection(params)
    },
    ...options,
  })
}

/**
 * Submit capability response
 */
export function useSubmitCapabilityResponseMutation(
  options?: UseMutationOptions<InquiryCapabilityResponse, Error, SubmitCapabilityResponseParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: SubmitCapabilityResponseParams) => {
      if (!client) throw new Error('Missing client')
      return (client.inquiries as unknown as InquiryCapabilityClient).submitCapabilityResponse(params)
    },
    ...options,
  })
}

/**
 * Update inquiry fields
 */
export function useUpdateInquiryMutation(
  options?: UseMutationOptions<Inquiry, Error, UpdateInquiryParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UpdateInquiryParams) => {
      if (!client) throw new Error('Missing client')
      return (client.inquiries as unknown as InquiryCapabilityClient).update(params)
    },
    ...options,
  })
}

/**
 * Change inquiry status
 */
export function useChangeInquiryStatusMutation(
  options?: UseMutationOptions<ChangeStatusResponse, Error, ChangeStatusParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: ChangeStatusParams) => {
      if (!client) throw new Error('Missing client')
      return (client.inquiries as unknown as InquiryCapabilityClient).changeStatus(params)
    },
    ...options,
  })
}
