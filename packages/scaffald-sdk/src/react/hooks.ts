import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query'
import { useScaffald } from './provider.js'
import type {
  Job,
  JobListParams,
  JobListResponse,
  CreateJobParams,
  Application,
  CreateApplicationParams,
  UpdateApplicationParams,
  WithdrawApplicationParams,
  UserProfile,
  OrganizationProfile,
  EmployerProfile,
  Industry,
  IndustryListResponse,
  Organization,
  OrganizationSettings,
  ListMembersParams,
  InviteMemberParams,
  ListDocumentsParams,
  CreateDocumentUploadParams,
  UpdateSettingsParams,
  MembersListResponse,
  DocumentsListResponse,
  InvitationResponse,
  DocumentUploadSession,
  OpenJobsCountResponse,
  ListTeamsParams,
  CreateTeamParams,
  UpdateTeamParams,
  ArchiveTeamParams,
  AddTeamMemberParams,
  UpdateTeamMemberParams,
  RemoveTeamMemberParams,
  InviteTeamMemberParams,
  CreateJobAssignmentParams,
  TeamsListResponse,
  TeamResponse,
  TeamMembersListResponse,
  TeamMemberResponse,
  TeamInvitationsListResponse,
  TeamInvitationResponse,
  RespondToInvitationWithTokenParams,
  RespondToInvitationWithTokenResponse,
  TeamJobAssignmentsListResponse,
  TeamJobAssignmentResponse,
  DeleteResponse,
  RolesListResponse,
  PrerequisitesCheckResponse,
  CompletePrerequisitesParams,
  CompletePrerequisitesResponse,
  ApiKey,
  ApiKeyCreated,
  CreateApiKeyParams,
  UpdateApiKeyParams,
  GetUsageParams,
  ApiKeyUsageStats,
  RevokeApiKeyResponse,
  CreateWebhookParams,
  UpdateWebhookParams,
  ListDeliveriesParams,
  WebhooksListResponse,
  WebhookResponse,
  WebhookCreatedResponse,
  DeliveriesListResponse,
  RetryDeliveryResponse,
  DeleteWebhookResponse,
  EventTypesResponse,
} from '../index.js'

// ===== Jobs Hooks =====

/**
 * Hook to fetch a list of jobs
 *
 * @example
 * ```tsx
 * function JobsList() {
 *   const { data, isLoading } = useJobs({ limit: 20, status: 'published' })
 *
 *   if (isLoading) return <div>Loading...</div>
 *
 *   return (
 *     <div>
 *       {data?.data.map(job => (
 *         <div key={job.id}>{job.title}</div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useJobs(
  params?: JobListParams,
  options?: Omit<UseQueryOptions<JobListResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['jobs', params],
    queryFn: () => client.jobs.list(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Hook to fetch a single job by ID
 *
 * @example
 * ```tsx
 * function JobDetail({ jobId }: { jobId: string }) {
 *   const { data: job, isLoading } = useJob(jobId)
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (!job) return <div>Job not found</div>
 *
 *   return <div>{job.title}</div>
 * }
 * ```
 */
export function useJob(id: string, options?: Omit<UseQueryOptions<Job>, 'queryKey' | 'queryFn'>) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['jobs', id],
    queryFn: () => client.jobs.retrieve(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Hook to fetch similar jobs
 *
 * @example
 * ```tsx
 * function SimilarJobs({ jobId }: { jobId: string }) {
 *   const { data } = useSimilarJobs(jobId, 5)
 *
 *   return (
 *     <div>
 *       {data?.data.map(job => (
 *         <div key={job.id}>{job.title}</div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useSimilarJobs(
  id: string,
  limit?: number,
  options?: Omit<UseQueryOptions<JobListResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['jobs', id, 'similar', limit],
    queryFn: () => client.jobs.similar(id, limit),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes (changes less frequently)
    ...options,
  })
}

/**
 * Hook to fetch job filter options
 *
 * @example
 * ```tsx
 * function JobFilters() {
 *   const { data: filters } = useJobFilterOptions()
 *
 *   return (
 *     <select>
 *       {filters?.industries.map(industry => (
 *         <option key={industry.value}>{industry.label}</option>
 *       ))}
 *     </select>
 *   )
 * }
 * ```
 */
export function useJobFilterOptions(options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['jobs', 'filterOptions'],
    queryFn: () => client.jobs.filterOptions(),
    staleTime: 30 * 60 * 1000, // 30 minutes (rarely changes)
    ...options,
  })
}

/**
 * Hook to create a new job
 *
 * @example
 * ```tsx
 * function CreateJobForm() {
 *   const createJob = useCreateJob()
 *
 *   const handleSubmit = async (data: CreateJobParams) => {
 *     await createJob.mutateAsync(data)
 *   }
 *
 *   return <form onSubmit={handleSubmit}>...</form>
 * }
 * ```
 */
export function useCreateJob(
  options?: Omit<UseMutationOptions<Job, Error, CreateJobParams>, 'mutationFn'>
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: CreateJobParams) => client.jobs.create(params),
    onSuccess: (data) => {
      // Invalidate jobs list
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      // Set the cache for the new job
      queryClient.setQueryData(['jobs', data.id], data)
    },
    ...options,
  })
}

/**
 * Hook to update an existing job
 *
 * @example
 * ```tsx
 * function EditJobForm({ jobId }: { jobId: string }) {
 *   const updateJob = useUpdateJob(jobId)
 *
 *   const handleSubmit = async (data: CreateJobParams) => {
 *     await updateJob.mutateAsync(data)
 *   }
 *
 *   return <form onSubmit={handleSubmit}>...</form>
 * }
 * ```
 */
export function useUpdateJob(
  id: string,
  options?: Omit<UseMutationOptions<Job, Error, CreateJobParams>, 'mutationFn'>
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: CreateJobParams) => client.jobs.update(id, params),
    onSuccess: (data) => {
      // Invalidate jobs list
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      // Update the cache for this specific job
      queryClient.setQueryData(['jobs', id], data)
    },
    ...options,
  })
}

/**
 * Hook to delete a job
 *
 * @example
 * ```tsx
 * function DeleteJobButton({ jobId }: { jobId: string }) {
 *   const deleteJob = useDeleteJob(jobId)
 *
 *   return (
 *     <button onClick={() => deleteJob.mutate()}>
 *       Delete Job
 *     </button>
 *   )
 * }
 * ```
 */
export function useDeleteJob(
  id: string,
  options?: Omit<UseMutationOptions<void, Error, void>, 'mutationFn'>
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => client.jobs.delete(id),
    onSuccess: () => {
      // Invalidate jobs list
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['jobs', id] })
    },
    ...options,
  })
}

// ===== Applications Hooks =====

/**
 * Hook to fetch a single application by ID
 *
 * @example
 * ```tsx
 * function ApplicationDetail({ applicationId }: { applicationId: string }) {
 *   const { data: application } = useApplication(applicationId)
 *
 *   return <div>{application?.status}</div>
 * }
 * ```
 */
export function useApplication(
  id: string,
  options?: Omit<UseQueryOptions<Application>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['applications', id],
    queryFn: () => client.applications.retrieve(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * Hook to create a new application
 *
 * @example
 * ```tsx
 * function ApplyButton({ jobId }: { jobId: string }) {
 *   const createApplication = useCreateApplication()
 *
 *   const handleApply = async () => {
 *     await createApplication.mutateAsync({
 *       jobId,
 *       currentLocation: 'San Francisco',
 *     })
 *   }
 *
 *   return <button onClick={handleApply}>Apply</button>
 * }
 * ```
 */
export function useCreateApplication(
  options?: Omit<UseMutationOptions<Application, Error, CreateApplicationParams>, 'mutationFn'>
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: CreateApplicationParams) => client.applications.create(params),
    onSuccess: (data) => {
      // Invalidate applications list (if we had one)
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      // Set the cache for the new application
      queryClient.setQueryData(['applications', data.id], data)
    },
    ...options,
  })
}

/**
 * Hook to update an existing application
 *
 * @example
 * ```tsx
 * function UpdateApplicationForm({ applicationId }: { applicationId: string }) {
 *   const updateApplication = useUpdateApplication(applicationId)
 *
 *   const handleSubmit = async (data: UpdateApplicationParams) => {
 *     await updateApplication.mutateAsync(data)
 *   }
 *
 *   return <form onSubmit={handleSubmit}>...</form>
 * }
 * ```
 */
export function useUpdateApplication(
  id: string,
  options?: Omit<UseMutationOptions<Application, Error, UpdateApplicationParams>, 'mutationFn'>
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: UpdateApplicationParams) => client.applications.update(id, params),
    onSuccess: (data) => {
      // Update the cache for this specific application
      queryClient.setQueryData(['applications', id], data)
      // Invalidate applications list
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
    ...options,
  })
}

/**
 * Hook to withdraw an application
 *
 * @example
 * ```tsx
 * function WithdrawButton({ applicationId }: { applicationId: string }) {
 *   const withdrawApplication = useWithdrawApplication(applicationId)
 *
 *   const handleWithdraw = async () => {
 *     await withdrawApplication.mutateAsync({
 *       reason: 'Accepted another offer',
 *     })
 *   }
 *
 *   return <button onClick={handleWithdraw}>Withdraw</button>
 * }
 * ```
 */
export function useWithdrawApplication(
  id: string,
  options?: Omit<UseMutationOptions<Application, Error, WithdrawApplicationParams>, 'mutationFn'>
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: WithdrawApplicationParams = {}) =>
      client.applications.withdraw(id, params),
    onSuccess: (data) => {
      // Update the cache for this specific application
      queryClient.setQueryData(['applications', id], data)
      // Invalidate applications list
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
    ...options,
  })
}

// ===== Profiles Hooks =====

/**
 * Hook to fetch a user profile
 *
 * @example
 * ```tsx
 * function UserProfile({ username }: { username: string }) {
 *   const { data: profile } = useUserProfile(username)
 *
 *   return <div>{profile?.displayName}</div>
 * }
 * ```
 */
export function useUserProfile(
  username: string,
  options?: Omit<UseQueryOptions<UserProfile>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['profiles', 'user', username],
    queryFn: () => client.profiles.getUser(username),
    enabled: !!username,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  })
}

/**
 * Hook to fetch an organization profile
 *
 * @example
 * ```tsx
 * function OrganizationPage({ slug }: { slug: string }) {
 *   const { data: org } = useOrganizationProfile(slug)
 *
 *   return <div>{org?.name}</div>
 * }
 * ```
 */
export function useOrganizationProfile(
  slug: string,
  options?: Omit<UseQueryOptions<OrganizationProfile>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['profiles', 'organization', slug],
    queryFn: () => client.profiles.getOrganization(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
    ...options,
  })
}

/**
 * Hook to fetch an employer profile
 *
 * @example
 * ```tsx
 * function EmployerPage({ slug }: { slug: string }) {
 *   const { data: employer } = useEmployerProfile(slug)
 *
 *   return <div>{employer?.name}</div>
 * }
 * ```
 */
export function useEmployerProfile(
  slug: string,
  options?: Omit<UseQueryOptions<EmployerProfile>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['profiles', 'employer', slug],
    queryFn: () => client.profiles.getEmployer(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
    ...options,
  })
}

// ===== Industries Hooks =====

/**
 * Hook to fetch all industries
 *
 * @example
 * ```tsx
 * function IndustryPicker() {
 *   const { data: industries, isLoading } = useIndustries()
 *
 *   if (isLoading) return <div>Loading...</div>
 *
 *   return (
 *     <select>
 *       {industries?.data.map(ind => (
 *         <option key={ind.id} value={ind.slug}>
 *           {ind.name}
 *         </option>
 *       ))}
 *     </select>
 *   )
 * }
 * ```
 */
export function useIndustries(
  options?: Omit<UseQueryOptions<IndustryListResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['industries'],
    queryFn: () => client.industries.list(),
    staleTime: 60 * 60 * 1000, // 1 hour (rarely changes)
    ...options,
  })
}

/**
 * Hook to fetch a single industry by slug
 *
 * @example
 * ```tsx
 * function IndustryDetail({ slug }: { slug: string }) {
 *   const { data: industry, isLoading } = useIndustry(slug)
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (!industry) return <div>Industry not found</div>
 *
 *   return (
 *     <div>
 *       <h1>{industry.name}</h1>
 *       <p>{industry.description}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useIndustry(
  slug: string,
  options?: Omit<UseQueryOptions<Industry | null>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['industries', slug],
    queryFn: () => client.industries.retrieve(slug),
    enabled: !!slug,
    staleTime: 60 * 60 * 1000, // 1 hour (rarely changes)
    ...options,
  })
}

// ===== Organizations Hooks =====

/**
 * Hook to fetch an organization by ID
 *
 * @example
 * ```tsx
 * function OrganizationDetail({ orgId }: { orgId: string }) {
 *   const { data: org, isLoading } = useOrganization(orgId)
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (!org) return <div>Organization not found</div>
 *
 *   return (
 *     <div>
 *       <h1>{org.name}</h1>
 *       <p>{org.description}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useOrganization(
  id: string,
  options?: Omit<UseQueryOptions<Organization>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['organizations', id],
    queryFn: () => client.organizations.retrieve(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  })
}

/**
 * Hook to fetch organization open jobs count
 *
 * @example
 * ```tsx
 * function OrganizationJobCount({ orgId }: { orgId: string }) {
 *   const { data } = useOrganizationJobsCount(orgId)
 *   return <div>{data?.count} open positions</div>
 * }
 * ```
 */
export function useOrganizationJobsCount(
  id: string,
  options?: Omit<UseQueryOptions<OpenJobsCountResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['organizations', id, 'jobs-count'],
    queryFn: () => client.organizations.getOpenJobsCount(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Hook to fetch organization members
 *
 * @example
 * ```tsx
 * function MembersList({ orgId }: { orgId: string }) {
 *   const { data: members } = useOrganizationMembers(orgId, { search: 'john' })
 *
 *   return (
 *     <ul>
 *       {members?.data.map(member => (
 *         <li key={member.userId}>{member.profile?.display_name}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useOrganizationMembers(
  id: string,
  params?: ListMembersParams,
  options?: Omit<UseQueryOptions<MembersListResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['organizations', id, 'members', params],
    queryFn: () => client.organizations.listMembers(id, params),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Hook to invite a member to an organization
 *
 * @example
 * ```tsx
 * function InviteMemberButton({ orgId }: { orgId: string }) {
 *   const inviteMember = useInviteOrganizationMember()
 *
 *   const handleInvite = () => {
 *     inviteMember.mutate({
 *       id: orgId,
 *       params: { email: 'john@example.com', roleName: 'member' }
 *     })
 *   }
 *
 *   return <button onClick={handleInvite}>Invite Member</button>
 * }
 * ```
 */
export function useInviteOrganizationMember(
  options?: Omit<
    UseMutationOptions<InvitationResponse, Error, { id: string; params: InviteMemberParams }>,
    'mutationFn'
  >
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, params }) => client.organizations.inviteMember(id, params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organizations', variables.id, 'members'] })
    },
    ...options,
  })
}

/**
 * Hook to fetch organization documents
 *
 * @example
 * ```tsx
 * function DocumentsList({ orgId }: { orgId: string }) {
 *   const { data: docs } = useOrganizationDocuments(orgId, { category: 'contracts' })
 *
 *   return (
 *     <ul>
 *       {docs?.data.map(doc => (
 *         <li key={doc.id}>{doc.name}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useOrganizationDocuments(
  id: string,
  params?: ListDocumentsParams,
  options?: Omit<UseQueryOptions<DocumentsListResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['organizations', id, 'documents', params],
    queryFn: () => client.organizations.listDocuments(id, params),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * Hook to create a document upload session
 *
 * @example
 * ```tsx
 * function UploadDocument({ orgId }: { orgId: string }) {
 *   const createUpload = useCreateDocumentUpload()
 *
 *   const handleUpload = async (file: File) => {
 *     const session = await createUpload.mutateAsync({
 *       id: orgId,
 *       params: {
 *         name: file.name,
 *         fileName: file.name,
 *         mimeType: file.type,
 *         fileSize: file.size,
 *         category: 'general'
 *       }
 *     })
 *     // Upload to session.uploadUrl
 *   }
 *
 *   return <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
 * }
 * ```
 */
export function useCreateDocumentUpload(
  options?: Omit<
    UseMutationOptions<
      DocumentUploadSession,
      Error,
      { id: string; params: CreateDocumentUploadParams }
    >,
    'mutationFn'
  >
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, params }) => client.organizations.createDocumentUploadSession(id, params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organizations', variables.id, 'documents'] })
    },
    ...options,
  })
}

/**
 * Hook to fetch organization settings
 *
 * @example
 * ```tsx
 * function SettingsView({ orgId }: { orgId: string }) {
 *   const { data: settings } = useOrganizationSettings(orgId)
 *
 *   return (
 *     <div>
 *       <p>Timezone: {settings?.timezone}</p>
 *       <p>MFA Enforced: {settings?.enforce_mfa ? 'Yes' : 'No'}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useOrganizationSettings(
  id: string,
  options?: Omit<UseQueryOptions<OrganizationSettings>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['organizations', id, 'settings'],
    queryFn: () => client.organizations.getSettings(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  })
}

/**
 * Hook to update organization settings
 *
 * @example
 * ```tsx
 * function SettingsForm({ orgId }: { orgId: string }) {
 *   const updateSettings = useUpdateOrganizationSettings()
 *
 *   const handleSave = () => {
 *     updateSettings.mutate({
 *       id: orgId,
 *       params: { timezone: 'America/Los_Angeles', enforceMfa: true }
 *     })
 *   }
 *
 *   return <button onClick={handleSave}>Save Settings</button>
 * }
 * ```
 */
export function useUpdateOrganizationSettings(
  options?: Omit<
    UseMutationOptions<OrganizationSettings, Error, { id: string; params: UpdateSettingsParams }>,
    'mutationFn'
  >
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, params }) => client.organizations.updateSettings(id, params),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['organizations', variables.id, 'settings'], data)
      queryClient.invalidateQueries({ queryKey: ['organizations', variables.id] })
    },
    ...options,
  })
}

// ===== OAuth Hook =====

/**
 * Hook to manage OAuth authentication state
 *
 * @example
 * ```tsx
 * function AuthButton() {
 *   const { isAuthenticated, login, logout } = useScaffaldAuth({
 *     clientId: 'your_client_id',
 *     redirectUri: 'https://yourapp.com/callback',
 *   })
 *
 *   if (isAuthenticated) {
 *     return <button onClick={logout}>Logout</button>
 *   }
 *
 *   return <button onClick={login}>Login</button>
 * }
 * ```
 */
export function useScaffaldAuth(config: {
  clientId: string
  clientSecret?: string
  redirectUri: string
  scope?: string[]
  baseUrl?: string
}) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [accessToken, setAccessToken] = React.useState<string | null>(null)

  React.useEffect(() => {
    const token = localStorage.getItem('scaffald_access_token')
    if (token) {
      setAccessToken(token)
      setIsAuthenticated(true)
    }
  }, [])

  const login = async () => {
    const { OAuthClient } = await import('../auth/oauth.js')

    const oauth = new OAuthClient({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
      baseUrl: config.baseUrl,
    })

    const { url, state, codeVerifier } = await oauth.getAuthorizationUrl({
      scope: config.scope || ['read:jobs', 'write:applications'],
    })

    // Store state and code verifier
    sessionStorage.setItem('oauth_state', state)
    sessionStorage.setItem('oauth_code_verifier', codeVerifier)

    // Redirect to authorization URL
    window.location.href = url
  }

  const logout = async () => {
    if (accessToken) {
      try {
        const { OAuthClient } = await import('../auth/oauth.js')

        const oauth = new OAuthClient({
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          redirectUri: config.redirectUri,
          baseUrl: config.baseUrl,
        })

        await oauth.revokeToken(accessToken, 'access_token')
      } catch (error) {
        console.error('Token revocation failed:', error)
      }
    }

    localStorage.removeItem('scaffald_access_token')
    localStorage.removeItem('scaffald_refresh_token')
    setAccessToken(null)
    setIsAuthenticated(false)
  }

  return {
    isAuthenticated,
    accessToken,
    login,
    logout,
  }
}

// ===== Teams Hooks =====

/**
 * Hook to list teams
 */
export function useTeams(
  params?: ListTeamsParams,
  options?: Omit<UseQueryOptions<TeamsListResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['teams', params],
    queryFn: () => client.teams.list(params),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  })
}

/**
 * Hook to retrieve a specific team
 */
export function useTeam(
  id: string,
  options?: Omit<UseQueryOptions<TeamResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['teams', id],
    queryFn: () => client.teams.retrieve(id),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  })
}

/**
 * Hook to create a team
 */
export function useCreateTeam(
  options?: Omit<UseMutationOptions<TeamResponse, Error, CreateTeamParams>, 'mutationFn'>
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: CreateTeamParams) => client.teams.create(params),
    onSuccess: (_data, _variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
    ...options,
  })
}

/**
 * Hook to update a team
 */
export function useUpdateTeam(
  options?: Omit<
    UseMutationOptions<TeamResponse, Error, { id: string; params: UpdateTeamParams }>,
    'mutationFn'
  >
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: UpdateTeamParams }) =>
      client.teams.update(id, params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
    ...options,
  })
}

/**
 * Hook to archive a team
 */
export function useArchiveTeam(
  options?: Omit<
    UseMutationOptions<TeamResponse, Error, { id: string; params?: ArchiveTeamParams }>,
    'mutationFn'
  >
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params?: ArchiveTeamParams }) =>
      client.teams.archive(id, params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
    ...options,
  })
}

/**
 * Hook to list team members
 */
export function useTeamMembers(
  teamId: string,
  options?: Omit<UseQueryOptions<TeamMembersListResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['teams', teamId, 'members'],
    queryFn: () => client.teams.listMembers(teamId),
    enabled: !!teamId,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  })
}

/**
 * Hook to add a team member
 */
export function useAddTeamMember(
  options?: Omit<
    UseMutationOptions<TeamMemberResponse, Error, { teamId: string; params: AddTeamMemberParams }>,
    'mutationFn'
  >
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ teamId, params }: { teamId: string; params: AddTeamMemberParams }) =>
      client.teams.addMember(teamId, params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.teamId, 'members'] })
    },
    ...options,
  })
}

/**
 * Hook to update a team member
 */
export function useUpdateTeamMember(
  options?: Omit<
    UseMutationOptions<
      TeamMemberResponse,
      Error,
      { teamId: string; userId: string; params: UpdateTeamMemberParams }
    >,
    'mutationFn'
  >
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      teamId,
      userId,
      params,
    }: {
      teamId: string
      userId: string
      params: UpdateTeamMemberParams
    }) => client.teams.updateMember(teamId, userId, params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.teamId, 'members'] })
    },
    ...options,
  })
}

/**
 * Hook to remove a team member
 */
export function useRemoveTeamMember(
  options?: Omit<
    UseMutationOptions<
      DeleteResponse,
      Error,
      { teamId: string; userId: string; params?: RemoveTeamMemberParams }
    >,
    'mutationFn'
  >
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      teamId,
      userId,
      params,
    }: {
      teamId: string
      userId: string
      params?: RemoveTeamMemberParams
    }) => client.teams.removeMember(teamId, userId, params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.teamId, 'members'] })
    },
    ...options,
  })
}

/**
 * Hook to list team invitations
 */
export function useTeamInvitations(
  teamId: string,
  options?: Omit<UseQueryOptions<TeamInvitationsListResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['teams', teamId, 'invitations'],
    queryFn: () => client.teams.listInvitations(teamId),
    enabled: !!teamId,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  })
}

/**
 * Hook to invite a team member
 */
export function useInviteTeamMember(
  options?: Omit<
    UseMutationOptions<
      TeamInvitationResponse,
      Error,
      { teamId: string; params: InviteTeamMemberParams }
    >,
    'mutationFn'
  >
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ teamId, params }: { teamId: string; params: InviteTeamMemberParams }) =>
      client.teams.inviteMember(teamId, params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.teamId, 'invitations'] })
    },
    ...options,
  })
}

/**
 * Hook to cancel a team invitation
 */
export function useCancelTeamInvitation(
  options?: Omit<
    UseMutationOptions<DeleteResponse, Error, { teamId: string; invitationId: string }>,
    'mutationFn'
  >
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ teamId, invitationId }: { teamId: string; invitationId: string }) =>
      client.teams.cancelInvitation(teamId, invitationId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.teamId, 'invitations'] })
    },
    ...options,
  })
}

/**
 * Hook to resend a team invitation
 */
export function useResendTeamInvitation(
  options?: Omit<
    UseMutationOptions<{ success: boolean }, Error, { teamId: string; invitationId: string }>,
    'mutationFn'
  >
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ teamId, invitationId }: { teamId: string; invitationId: string }) =>
      client.teams.resendInvitation(teamId, invitationId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.teamId, 'invitations'] })
    },
    ...options,
  })
}

/**
 * Hook to list team roles for an organization
 */
export function useTeamRoles(
  organizationId: string,
  options?: Omit<UseQueryOptions<RolesListResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['teams', 'roles', organizationId],
    queryFn: () => client.teams.listRoles(organizationId),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes - roles don't change often
    ...options,
  })
}

/**
 * Hook to list invitations sent to the current user
 *
 * @example
 * ```tsx
 * function MyInvitations() {
 *   const { data, isLoading } = useMyTeamInvitations({ status: 'pending' })
 *
 *   if (isLoading) return <div>Loading...</div>
 *
 *   return (
 *     <div>
 *       <h2>Pending Invitations</h2>
 *       {data?.invitations.map(inv => (
 *         <div key={inv.id}>
 *           {inv.team?.name} - {inv.role?.name}
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useMyTeamInvitations(
  params?: { status?: 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired' },
  options?: Omit<UseQueryOptions<TeamInvitationsListResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['teams', 'invitations', 'mine', params],
    queryFn: () => client.teams.listMyInvitations(params),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  })
}

/**
 * Hook to respond to a team invitation
 *
 * @example
 * ```tsx
 * function InvitationCard({ invitationId }: { invitationId: string }) {
 *   const respondMutation = useRespondToTeamInvitation()
 *
 *   const handleAccept = async () => {
 *     await respondMutation.mutateAsync({
 *       invitationId,
 *       params: { action: 'accept' }
 *     })
 *   }
 *
 *   const handleDecline = async () => {
 *     await respondMutation.mutateAsync({
 *       invitationId,
 *       params: { action: 'decline' }
 *     })
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={handleAccept}>Accept</button>
 *       <button onClick={handleDecline}>Decline</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useRespondToTeamInvitation(
  options?: Omit<
    UseMutationOptions<
      TeamInvitationResponse,
      Error,
      { invitationId: string; params: { action: 'accept' | 'decline' } }
    >,
    'mutationFn'
  >
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invitationId, params }: { invitationId: string; params: { action: 'accept' | 'decline' } }) =>
      client.teams.respondToInvitation(invitationId, params),
    onSuccess: () => {
      // Invalidate my invitations
      queryClient.invalidateQueries({ queryKey: ['teams', 'invitations', 'mine'] })
      // Invalidate teams list (user may now be a member of new team)
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
    ...options,
  })
}

/**
 * Hook to respond to a team invitation using a token (public endpoint)
 *
 * @remarks
 * This hook is used for email invitation links and does not require authentication.
 * The token is validated server-side to identify the invitation.
 *
 * @example
 * ```tsx
 * function AcceptInvitationPage() {
 *   const { token } = useParams()
 *   const { user } = useAuth()
 *   const respondMutation = useRespondToTeamInvitationWithToken()
 *
 *   const handleAccept = async () => {
 *     const { status, teamId } = await respondMutation.mutateAsync({
 *       token,
 *       action: 'accept',
 *       responderId: user?.id
 *     })
 *
 *     if (status === 'accepted') {
 *       // Navigate to team page using your routing constants
 *       // router.push(ROUTES.TEAMS.DETAIL(teamId))
 *     }
 *   }
 *
 *   return <button onClick={handleAccept}>Accept Invitation</button>
 * }
 * ```
 */
export function useRespondToTeamInvitationWithToken(
  options?: Omit<
    UseMutationOptions<RespondToInvitationWithTokenResponse, Error, RespondToInvitationWithTokenParams>,
    'mutationFn'
  >
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: RespondToInvitationWithTokenParams) =>
      client.teams.respondToInvitationWithToken(params),
    onSuccess: () => {
      // Invalidate my invitations (user may now see fewer pending invitations)
      queryClient.invalidateQueries({ queryKey: ['teams', 'invitations', 'mine'] })
      // Invalidate teams list (user may now be a member of new team)
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
    ...options,
  })
}

/**
 * Hook to list team job assignments
 */
export function useTeamJobAssignments(
  teamId: string,
  options?: Omit<UseQueryOptions<TeamJobAssignmentsListResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['teams', teamId, 'jobs'],
    queryFn: () => client.teams.listJobAssignments(teamId),
    enabled: !!teamId,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  })
}

/**
 * Hook to create a team job assignment
 */
export function useCreateTeamJobAssignment(
  options?: Omit<
    UseMutationOptions<
      TeamJobAssignmentResponse,
      Error,
      { teamId: string; params: CreateJobAssignmentParams }
    >,
    'mutationFn'
  >
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ teamId, params }: { teamId: string; params: CreateJobAssignmentParams }) =>
      client.teams.createJobAssignment(teamId, params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.teamId, 'jobs'] })
    },
    ...options,
  })
}

/**
 * Hook to delete a team job assignment
 */
export function useDeleteTeamJobAssignment(
  options?: Omit<
    UseMutationOptions<DeleteResponse, Error, { teamId: string; assignmentId: string }>,
    'mutationFn'
  >
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ teamId, assignmentId }: { teamId: string; assignmentId: string }) =>
      client.teams.deleteJobAssignment(teamId, assignmentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.teamId, 'jobs'] })
    },
    ...options,
  })
}

// ===== Prerequisites Hooks =====

/**
 * Hook to check prerequisites completion status
 *
 * @example
 * ```typescript
 * const { data: prerequisites, isLoading } = usePrerequisites()
 *
 * if (!prerequisites?.isComplete) {
 *   // Redirect to onboarding page
 *   // Example: router.push(ROUTES.ONBOARDING.path)
 * }
 * ```
 */
export function usePrerequisites(
  options?: Omit<UseQueryOptions<PrerequisitesCheckResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['prerequisites'],
    queryFn: () => client.prerequisites.check(),
    staleTime: 5 * 60 * 1000, // 5 minutes - prerequisites don't change often
    ...options,
  })
}

/**
 * Hook to complete prerequisites
 *
 * @example
 * ```typescript
 * const completeMutation = useCompletePrerequisites({
 *   onSuccess: () => {
 *     // Redirect to dashboard after completion
 *     // Example: router.push(ROUTES.DASHBOARD.path)
 *   }
 * })
 *
 * // Submit prerequisites
 * await completeMutation.mutateAsync({
 *   first_name: 'John',
 *   last_name: 'Doe',
 *   address: {
 *     street: '123 Main St',
 *     city: 'San Francisco',
 *     state: 'CA',
 *     zip: '94102',
 *     country: 'US'
 *   },
 *   user_types: ['worker'],
 *   industry_id: 'ind_123',
 *   accepts_privacy_policy: true,
 *   accepts_terms_of_service: true
 * })
 * ```
 */
export function useCompletePrerequisites(
  options?: Omit<
    UseMutationOptions<CompletePrerequisitesResponse, Error, CompletePrerequisitesParams>,
    'mutationFn'
  >
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: CompletePrerequisitesParams) => client.prerequisites.complete(params),
    onSuccess: () => {
      // Invalidate prerequisites to refetch the new status
      queryClient.invalidateQueries({ queryKey: ['prerequisites'] })
      // Also invalidate user profile data as it was updated
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
    },
    ...options,
  })
}

// ===== API Keys Hooks =====

/**
 * Hook to fetch all API keys for the user's organization
 *
 * @example
 * ```tsx
 * function ApiKeysList() {
 *   const { data: keys, isLoading } = useApiKeys()
 *
 *   if (isLoading) return <div>Loading...</div>
 *
 *   return (
 *     <div>
 *       {keys?.map(key => (
 *         <div key={key.id}>
 *           {key.name} - {key.key_prefix}
 *           <span>Active: {key.is_active ? '✓' : '✗'}</span>
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useApiKeys(options?: Omit<UseQueryOptions<ApiKey[]>, 'queryKey' | 'queryFn'>) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['apiKeys'],
    queryFn: () => client.apiKeys.list(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * Hook to create a new API key
 *
 * @remarks
 * The full API key is only returned once - make sure to save it immediately
 *
 * @example
 * ```tsx
 * function CreateApiKeyButton() {
 *   const createKey = useCreateApiKey()
 *   const [newKey, setNewKey] = useState<string | null>(null)
 *
 *   const handleCreate = async () => {
 *     const result = await createKey.mutateAsync({
 *       name: 'My API Key',
 *       environment: 'live',
 *       scopes: ['read:jobs', 'write:applications'],
 *       rate_limit_tier: 'pro'
 *     })
 *     setNewKey(result.key) // Save this immediately!
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={handleCreate}>Create Key</button>
 *       {newKey && (
 *         <div>
 *           <strong>Save this key (you won't see it again!):</strong>
 *           <code>{newKey}</code>
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function useCreateApiKey(
  options?: Omit<UseMutationOptions<ApiKeyCreated, Error, CreateApiKeyParams>, 'mutationFn'>
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: CreateApiKeyParams) => client.apiKeys.create(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] })
    },
    ...options,
  })
}

/**
 * Hook to update an API key
 *
 * @example
 * ```tsx
 * function UpdateApiKeyForm({ keyId }: { keyId: string }) {
 *   const updateKey = useUpdateApiKey()
 *
 *   const handleUpdate = async () => {
 *     await updateKey.mutateAsync({
 *       id: keyId,
 *       params: {
 *         name: 'Updated Key Name',
 *         scopes: ['read:jobs', 'write:jobs', 'read:applications'],
 *         is_active: true
 *       }
 *     })
 *   }
 *
 *   return <button onClick={handleUpdate}>Update Key</button>
 * }
 * ```
 */
export function useUpdateApiKey(
  options?: Omit<
    UseMutationOptions<ApiKey, Error, { id: string; params: UpdateApiKeyParams }>,
    'mutationFn'
  >
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: UpdateApiKeyParams }) =>
      client.apiKeys.update(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] })
    },
    ...options,
  })
}

/**
 * Hook to revoke an API key
 *
 * @example
 * ```tsx
 * function RevokeApiKeyButton({ keyId }: { keyId: string }) {
 *   const revokeKey = useRevokeApiKey()
 *
 *   const handleRevoke = async () => {
 *     if (confirm('Are you sure you want to revoke this key?')) {
 *       await revokeKey.mutateAsync(keyId)
 *     }
 *   }
 *
 *   return <button onClick={handleRevoke}>Revoke Key</button>
 * }
 * ```
 */
export function useRevokeApiKey(
  options?: Omit<UseMutationOptions<RevokeApiKeyResponse, Error, string>, 'mutationFn'>
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => client.apiKeys.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] })
    },
    ...options,
  })
}

/**
 * Hook to fetch usage statistics for an API key
 *
 * @example
 * ```tsx
 * function ApiKeyUsageStats({ keyId }: { keyId: string }) {
 *   const { data: stats, isLoading } = useApiKeyUsage(keyId, { days: 7 })
 *
 *   if (isLoading) return <div>Loading...</div>
 *
 *   return (
 *     <div>
 *       <h3>Last 7 Days Usage</h3>
 *       <p>Total Requests: {stats?.total_requests}</p>
 *       <p>Success Rate: {100 - parseFloat(stats?.error_rate || '0')}%</p>
 *       <p>Avg Response Time: {stats?.avg_response_time_ms}ms</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useApiKeyUsage(
  id: string,
  params?: GetUsageParams,
  options?: Omit<UseQueryOptions<ApiKeyUsageStats>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['apiKeys', id, 'usage', params],
    queryFn: () => client.apiKeys.getUsage(id, params),
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  })
}

// ===== Webhooks Hooks =====

/**
 * Hook to fetch all webhooks for the user's organization
 *
 * @example
 * ```typescript
 * function WebhooksList() {
 *   const { data: webhooks, isLoading } = useWebhooks()
 *
 *   if (isLoading) return <div>Loading...</div>
 *
 *   return (
 *     <div>
 *       {webhooks?.data.map(webhook => (
 *         <div key={webhook.id}>
 *           {webhook.url} - {webhook.is_active ? 'Active' : 'Inactive'}
 *           <span>Events: {webhook.events.join(', ')}</span>
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useWebhooks(
  options?: Omit<UseQueryOptions<WebhooksListResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['webhooks'],
    queryFn: () => client.webhooks.list(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * Hook to fetch a single webhook by ID
 *
 * @example
 * ```typescript
 * function WebhookDetail({ webhookId }: { webhookId: string }) {
 *   const { data, isLoading } = useWebhook(webhookId)
 *
 *   if (isLoading) return <div>Loading...</div>
 *
 *   return (
 *     <div>
 *       <h3>{data?.data.url}</h3>
 *       <p>Events: {data?.data.events.join(', ')}</p>
 *       <p>Status: {data?.data.is_active ? 'Active' : 'Inactive'}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useWebhook(
  id: string,
  options?: Omit<UseQueryOptions<WebhookResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['webhooks', id],
    queryFn: () => client.webhooks.retrieve(id),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!id,
    ...options,
  })
}

/**
 * Hook to create a new webhook
 *
 * @remarks
 * The webhook secret is only returned once - make sure to save it immediately
 *
 * @example
 * ```typescript
 * function CreateWebhookButton() {
 *   const createWebhook = useCreateWebhook()
 *   const [secret, setSecret] = useState<string | null>(null)
 *
 *   const handleCreate = async () => {
 *     const result = await createWebhook.mutateAsync({
 *       url: 'https://api.example.com/webhooks',
 *       events: ['job.created', 'application.created'],
 *       description: 'Main webhook',
 *       retry_max_attempts: 5,
 *       timeout_ms: 15000
 *     })
 *     setSecret(result.data.secret) // Save this immediately!
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={handleCreate}>Create Webhook</button>
 *       {secret && (
 *         <div>
 *           <strong>Save this secret (you won't see it again!):</strong>
 *           <code>{secret}</code>
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function useCreateWebhook(
  options?: Omit<UseMutationOptions<WebhookCreatedResponse, Error, CreateWebhookParams>, 'mutationFn'>
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: CreateWebhookParams) => client.webhooks.create(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    },
    ...options,
  })
}

/**
 * Hook to update a webhook
 *
 * @example
 * ```typescript
 * function UpdateWebhookForm({ webhookId }: { webhookId: string }) {
 *   const updateWebhook = useUpdateWebhook()
 *
 *   const handleUpdate = async () => {
 *     await updateWebhook.mutateAsync({
 *       id: webhookId,
 *       params: {
 *         events: ['job.created', 'job.published', 'application.created'],
 *         is_active: true
 *       }
 *     })
 *   }
 *
 *   return <button onClick={handleUpdate}>Update Webhook</button>
 * }
 * ```
 */
export function useUpdateWebhook(
  options?: Omit<
    UseMutationOptions<WebhookResponse, Error, { id: string; params: UpdateWebhookParams }>,
    'mutationFn'
  >
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: UpdateWebhookParams }) =>
      client.webhooks.update(id, params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
      queryClient.invalidateQueries({ queryKey: ['webhooks', variables.id] })
    },
    ...options,
  })
}

/**
 * Hook to delete a webhook
 *
 * @example
 * ```typescript
 * function DeleteWebhookButton({ webhookId }: { webhookId: string }) {
 *   const deleteWebhook = useDeleteWebhook()
 *
 *   const handleDelete = async () => {
 *     if (confirm('Are you sure you want to delete this webhook?')) {
 *       await deleteWebhook.mutateAsync(webhookId)
 *     }
 *   }
 *
 *   return <button onClick={handleDelete}>Delete Webhook</button>
 * }
 * ```
 */
export function useDeleteWebhook(
  options?: Omit<UseMutationOptions<DeleteWebhookResponse, Error, string>, 'mutationFn'>
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => client.webhooks.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    },
    ...options,
  })
}

/**
 * Hook to fetch webhook deliveries
 *
 * @example
 * ```typescript
 * function WebhookDeliveries({ webhookId }: { webhookId: string }) {
 *   const { data, isLoading } = useWebhookDeliveries(webhookId, {
 *     status: 'failed',
 *     limit: 50
 *   })
 *
 *   if (isLoading) return <div>Loading...</div>
 *
 *   return (
 *     <div>
 *       <h3>Failed Deliveries</h3>
 *       {data?.data.map(delivery => (
 *         <div key={delivery.id}>
 *           {delivery.event_type} - {delivery.status}
 *           {delivery.error_message && <p>Error: {delivery.error_message}</p>}
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useWebhookDeliveries(
  webhookId: string,
  params?: ListDeliveriesParams,
  options?: Omit<UseQueryOptions<DeliveriesListResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['webhooks', webhookId, 'deliveries', params],
    queryFn: () => client.webhooks.listDeliveries(webhookId, params),
    staleTime: 30 * 1000, // 30 seconds
    enabled: !!webhookId,
    ...options,
  })
}

/**
 * Hook to retry a webhook delivery
 *
 * @example
 * ```typescript
 * function RetryDeliveryButton({ deliveryId }: { deliveryId: string }) {
 *   const retryDelivery = useRetryWebhookDelivery()
 *
 *   const handleRetry = async () => {
 *     const result = await retryDelivery.mutateAsync(deliveryId)
 *     console.log(result.message) // "Delivery scheduled for retry"
 *   }
 *
 *   return <button onClick={handleRetry}>Retry Delivery</button>
 * }
 * ```
 */
export function useRetryWebhookDelivery(
  options?: Omit<UseMutationOptions<RetryDeliveryResponse, Error, string>, 'mutationFn'>
) {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (deliveryId: string) => client.webhooks.retryDelivery(deliveryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    },
    ...options,
  })
}

/**
 * Hook to fetch available webhook event types
 *
 * @example
 * ```typescript
 * function EventTypeSelector() {
 *   const { data: eventTypes, isLoading } = useWebhookEventTypes()
 *
 *   if (isLoading) return <div>Loading...</div>
 *
 *   const jobEvents = eventTypes?.data.filter(e => e.category === 'job')
 *
 *   return (
 *     <select>
 *       {jobEvents?.map(event => (
 *         <option key={event.value} value={event.value}>
 *           {event.label}
 *         </option>
 *       ))}
 *     </select>
 *   )
 * }
 * ```
 */
export function useWebhookEventTypes(
  options?: Omit<UseQueryOptions<EventTypesResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffald()

  return useQuery({
    queryKey: ['webhooks', 'event-types'],
    queryFn: () => client.webhooks.eventTypes(),
    staleTime: 60 * 60 * 1000, // 1 hour (rarely changes)
    ...options,
  })
}

// Re-export React for the OAuth hook
import * as React from 'react'
