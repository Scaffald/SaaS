import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query'
import { useScaffald } from './provider.js'
import type {
  JobListParams,
  JobListResponse,
  JobResponse,
  SimilarJobsParams,
  SimilarJobsResponse,
  FilterOptionsResponse,
} from '../resources/jobs.js'
import type {
  CreateQuickApplicationInput,
  CreateFullApplicationInput,
  UpdateApplicationInput,
  WithdrawApplicationInput,
  ApplicationResponse,
} from '../resources/applications.js'
import type {
  ProfileResponse,
  OrganizationResponse,
  EmployerResponse,
} from '../resources/profiles.js'
import type {
  MagicLinkRequest,
  MagicLinkResponse,
  UserRolesResponse,
  SessionResponse,
} from '../resources/auth.js'
import type {
  APIKeyListParams,
  APIKeyListResponse,
  APIKeyResponse,
  CreatedAPIKeyResponse,
  APIKeyCreateParams,
  APIKeyUpdateParams,
  APIKeyUsageResponse,
  APIKeyRevokeResponse,
} from '../resources/api-keys.js'

/**
 * Authentication Hooks
 */

/**
 * Hook to request a magic link for authentication
 *
 * This is a public endpoint (no authentication required).
 * Use this to send magic link emails for login/signup.
 *
 * @example
 * ```tsx
 * function MagicLinkForm() {
 *   const requestMagicLink = useMagicLink()
 *
 *   const handleSubmit = (email: string) => {
 *     requestMagicLink.mutate({
 *       email,
 *       redirectTo: 'https://app.example.com/auth/callback'
 *     }, {
 *       onSuccess: (data) => {
 *         if (data.data.mode === 'signup') {
 *           console.log('New user - check your email!')
 *         } else {
 *           console.log('Welcome back - check your email!')
 *         }
 *       }
 *     })
 *   }
 *
 *   return (
 *     <form onSubmit={(e) => {
 *       e.preventDefault()
 *       handleSubmit(email)
 *     }}>
 *       <input type="email" value={email} onChange={...} />
 *       <button disabled={requestMagicLink.isPending}>
 *         {requestMagicLink.isPending ? 'Sending...' : 'Send Magic Link'}
 *       </button>
 *       {requestMagicLink.error && <p>Error: {requestMagicLink.error.message}</p>}
 *     </form>
 *   )
 * }
 * ```
 */
export function useMagicLink(): UseMutationResult<
  MagicLinkResponse,
  Error,
  MagicLinkRequest
> {
  const client = useScaffald()

  return useMutation({
    mutationFn: (input) => client.auth.requestMagicLink(input),
  })
}

/**
 * Hook to get the current user's roles
 *
 * Requires authentication. Use this to check user permissions.
 *
 * @example
 * ```tsx
 * function UserPermissions() {
 *   const { data, isLoading } = useRoles()
 *
 *   if (isLoading) return <div>Loading roles...</div>
 *
 *   const isAdmin = data?.data.roles.includes('admin')
 *   const isModerator = data?.data.roles.includes('moderator')
 *
 *   return (
 *     <div>
 *       <p>User ID: {data?.data.userId}</p>
 *       <ul>
 *         {data?.data.roles.map(role => <li key={role}>{role}</li>)}
 *       </ul>
 *       {isAdmin && <AdminPanel />}
 *       {isModerator && <ModeratorTools />}
 *     </div>
 *   )
 * }
 * ```
 */
export function useRoles(): UseQueryResult<UserRolesResponse> {
  const client = useScaffald()

  return useQuery({
    queryKey: ['auth', 'roles'],
    queryFn: () => client.auth.getRoles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook to get the current session information
 *
 * Requires authentication. Returns user info and token details.
 *
 * @example
 * ```tsx
 * function SessionInfo() {
 *   const { data, isLoading } = useSession()
 *
 *   if (isLoading) return <div>Loading session...</div>
 *   if (!data) return <div>Not authenticated</div>
 *
 *   const expiresInMinutes = Math.floor(data.data.session.expiresIn / 60)
 *   const isExpiringSoon = expiresInMinutes < 5
 *
 *   return (
 *     <div>
 *       <h3>Welcome, {data.data.user.email}</h3>
 *       <p>Email verified: {data.data.user.emailVerified ? 'Yes' : 'No'}</p>
 *       <p>Session expires in {expiresInMinutes} minutes</p>
 *       {isExpiringSoon && <button>Refresh Session</button>}
 *     </div>
 *   )
 * }
 * ```
 */
export function useSession(): UseQueryResult<SessionResponse> {
  const client = useScaffald()

  return useQuery({
    queryKey: ['auth', 'session'],
    queryFn: () => client.auth.getSession(),
    staleTime: 2 * 60 * 1000, // 2 minutes (refresh frequently to catch expiration)
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // Only retry once on failure (auth errors shouldn't retry much)
  })
}

/**
 * Jobs Hooks
 */

/**
 * Hook to list jobs with filtering and pagination
 *
 * @example
 * ```tsx
 * function JobsList() {
 *   const { data, isLoading, error } = useJobs({
 *     status: 'published',
 *     limit: 20,
 *     remoteOption: 'remote'
 *   })
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *
 *   return (
 *     <div>
 *       {data.data.map(job => (
 *         <JobCard key={job.id} job={job} />
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useJobs(params?: JobListParams): UseQueryResult<JobListResponse> {
  const client = useScaffald()

  return useQuery({
    queryKey: ['jobs', params],
    queryFn: () => client.jobs.list(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

/**
 * Hook to get a single job by ID
 *
 * @example
 * ```tsx
 * function JobDetail({ jobId }: { jobId: string }) {
 *   const { data, isLoading } = useJob(jobId)
 *
 *   if (isLoading) return <div>Loading...</div>
 *
 *   return <div>{data.data.title}</div>
 * }
 * ```
 */
export function useJob(id: string): UseQueryResult<JobResponse> {
  const client = useScaffald()

  return useQuery({
    queryKey: ['jobs', id],
    queryFn: () => client.jobs.retrieve(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

/**
 * Hook to get similar jobs
 *
 * @example
 * ```tsx
 * function SimilarJobs({ jobId }: { jobId: string }) {
 *   const { data } = useSimilarJobs(jobId, { limit: 5 })
 *
 *   return (
 *     <div>
 *       <h3>Similar Jobs</h3>
 *       {data?.data.map(job => <JobCard key={job.id} job={job} />)}
 *     </div>
 *   )
 * }
 * ```
 */
export function useSimilarJobs(
  id: string,
  params?: SimilarJobsParams
): UseQueryResult<SimilarJobsResponse> {
  const client = useScaffald()

  return useQuery({
    queryKey: ['jobs', id, 'similar', params],
    queryFn: () => client.jobs.similar(id, params),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

/**
 * Hook to get job filter options
 *
 * @example
 * ```tsx
 * function JobFilters() {
 *   const { data } = useJobFilterOptions()
 *
 *   return (
 *     <select>
 *       {data?.data.employmentTypes.map(type => (
 *         <option key={type} value={type}>{type}</option>
 *       ))}
 *     </select>
 *   )
 * }
 * ```
 */
export function useJobFilterOptions(): UseQueryResult<FilterOptionsResponse> {
  const client = useScaffald()

  return useQuery({
    queryKey: ['jobs', 'filter-options'],
    queryFn: () => client.jobs.filterOptions(),
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  })
}

/**
 * Applications Hooks
 */

/**
 * Hook to list applications (requires authentication)
 *
 * @example
 * ```tsx
 * function MyApplications() {
 *   const { data, isLoading } = useApplications()
 *
 *   if (isLoading) return <div>Loading...</div>
 *
 *   return (
 *     <div>
 *       {data?.data.map(app => (
 *         <ApplicationCard key={app.id} application={app} />
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useApplications(): UseQueryResult<{ data: ApplicationResponse['data'][] }> {
  // const client = useScaffald() // TODO: Implement when list applications endpoint is available

  return useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      // This would call a list applications endpoint when available
      // For now, return empty array as placeholder
      return { data: [] }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to create a quick application
 *
 * @example
 * ```tsx
 * function QuickApplyButton({ jobId }: { jobId: string }) {
 *   const createApplication = useCreateQuickApplication()
 *
 *   const handleApply = () => {
 *     createApplication.mutate({
 *       jobId,
 *       currentLocation: 'San Francisco, CA',
 *       availableStartDate: '2025-03-01'
 *     })
 *   }
 *
 *   return (
 *     <button onClick={handleApply} disabled={createApplication.isPending}>
 *       {createApplication.isPending ? 'Applying...' : 'Quick Apply'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useCreateQuickApplication(): UseMutationResult<
  ApplicationResponse,
  Error,
  CreateQuickApplicationInput
> {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input) => client.applications.createQuick(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

/**
 * Hook to create a full application
 *
 * @example
 * ```tsx
 * function ApplicationForm({ jobId }: { jobId: string }) {
 *   const createApplication = useCreateFullApplication()
 *
 *   const onSubmit = (formData) => {
 *     createApplication.mutate({
 *       jobId,
 *       ...formData
 *     })
 *   }
 *
 *   return <form onSubmit={handleSubmit(onSubmit)}>...</form>
 * }
 * ```
 */
export function useCreateFullApplication(): UseMutationResult<
  ApplicationResponse,
  Error,
  CreateFullApplicationInput
> {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input) => client.applications.createFull(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

/**
 * Hook to get application by ID
 *
 * @example
 * ```tsx
 * function ApplicationStatus({ applicationId }: { applicationId: string }) {
 *   const { data } = useApplication(applicationId)
 *
 *   return <div>Status: {data?.data.status}</div>
 * }
 * ```
 */
export function useApplication(id: string): UseQueryResult<ApplicationResponse> {
  const client = useScaffald()

  return useQuery({
    queryKey: ['applications', id],
    queryFn: () => client.applications.retrieve(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to update an application
 *
 * @example
 * ```tsx
 * function EditApplication({ applicationId }: { applicationId: string }) {
 *   const updateApplication = useUpdateApplication(applicationId)
 *
 *   const handleUpdate = (updates) => {
 *     updateApplication.mutate(updates)
 *   }
 *
 *   return <button onClick={handleUpdate}>Update</button>
 * }
 * ```
 */
export function useUpdateApplication(
  id: string
): UseMutationResult<ApplicationResponse, Error, UpdateApplicationInput> {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input) => client.applications.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', id] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
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
 *   return (
 *     <button onClick={() => withdrawApplication.mutate({ reason: 'Found another opportunity' })}>
 *       Withdraw Application
 *     </button>
 *   )
 * }
 * ```
 */
export function useWithdrawApplication(
  id: string
): UseMutationResult<ApplicationResponse, Error, WithdrawApplicationInput | undefined> {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input) => client.applications.withdraw(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', id] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

/**
 * Profiles Hooks
 */

/**
 * Hook to get user profile
 *
 * @example
 * ```tsx
 * function UserProfile({ username }: { username: string }) {
 *   const { data } = useUserProfile(username)
 *
 *   return (
 *     <div>
 *       <h1>{data?.data.full_name}</h1>
 *       <p>{data?.data.bio}</p>
 *       <ul>
 *         {data?.data.skills.map(skill => <li key={skill}>{skill}</li>)}
 *       </ul>
 *     </div>
 *   )
 * }
 * ```
 */
export function useUserProfile(username: string): UseQueryResult<ProfileResponse> {
  const client = useScaffald()

  return useQuery({
    queryKey: ['profiles', 'user', username],
    queryFn: () => client.profiles.getUser(username),
    enabled: !!username,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}

/**
 * Hook to get organization profile
 *
 * @example
 * ```tsx
 * function OrganizationPage({ slug }: { slug: string }) {
 *   const { data } = useOrganization(slug)
 *
 *   return (
 *     <div>
 *       <h1>{data?.data.name}</h1>
 *       <p>{data?.data.description}</p>
 *       <p>{data?.data.job_count} open positions</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useOrganization(slug: string): UseQueryResult<OrganizationResponse> {
  const client = useScaffald()

  return useQuery({
    queryKey: ['profiles', 'organization', slug],
    queryFn: () => client.profiles.getOrganization(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}

/**
 * Hook to get employer profile
 *
 * @example
 * ```tsx
 * function EmployerPage({ slug }: { slug: string }) {
 *   const { data } = useEmployer(slug)
 *
 *   return (
 *     <div>
 *       <h1>{data?.data.name}</h1>
 *       <p>{data?.data.active_jobs_count} active jobs</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useEmployer(slug: string): UseQueryResult<EmployerResponse> {
  const client = useScaffald()

  return useQuery({
    queryKey: ['profiles', 'employer', slug],
    queryFn: () => client.profiles.getEmployer(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}

/**
 * API Keys Hooks
 */

/**
 * Hook to list all API keys for the organization
 *
 * Requires authentication with API key or access token.
 * Only organization admins can manage API keys.
 *
 * @example
 * ```tsx
 * function APIKeysList() {
 *   const { data, isLoading } = useAPIKeys({ limit: 50 })
 *
 *   if (isLoading) return <div>Loading API keys...</div>
 *
 *   return (
 *     <div>
 *       {data?.data.map(key => (
 *         <div key={key.id}>
 *           <h3>{key.name}</h3>
 *           <code>{key.key_prefix}...</code>
 *           <p>Scopes: {key.scopes.join(', ')}</p>
 *           <p>Status: {key.is_active ? 'Active' : 'Inactive'}</p>
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useAPIKeys(params?: APIKeyListParams): UseQueryResult<APIKeyListResponse> {
  const client = useScaffald()

  return useQuery({
    queryKey: ['api-keys', params],
    queryFn: () => client.apiKeys.list(params),
    staleTime: 1 * 60 * 1000, // 1 minute - API keys change less frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to get a single API key by ID
 *
 * Returns metadata only (not the full key).
 * The full key is only shown once during creation.
 *
 * @example
 * ```tsx
 * function APIKeyDetails({ keyId }: { keyId: string }) {
 *   const { data, isLoading } = useAPIKey(keyId)
 *
 *   if (isLoading) return <div>Loading...</div>
 *
 *   return (
 *     <div>
 *       <h2>{data?.data.name}</h2>
 *       <p>Prefix: {data?.data.key_prefix}...</p>
 *       <p>Tier: {data?.data.rate_limit_tier}</p>
 *       <p>Created: {new Date(data?.data.created_at).toLocaleString()}</p>
 *       <p>Last used: {data?.data.last_used_at || 'Never'}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useAPIKey(id: string): UseQueryResult<APIKeyResponse> {
  const client = useScaffald()

  return useQuery({
    queryKey: ['api-keys', id],
    queryFn: () => client.apiKeys.retrieve(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to create a new API key
 *
 * ⚠️ IMPORTANT: The full API key is only returned once during creation.
 * Make sure to save it immediately!
 *
 * @example
 * ```tsx
 * function CreateAPIKeyForm() {
 *   const createKey = useCreateAPIKey()
 *   const [savedKey, setSavedKey] = useState<string | null>(null)
 *
 *   const handleCreate = () => {
 *     createKey.mutate({
 *       name: 'Production Integration',
 *       scopes: ['read:jobs', 'read:applications'],
 *       environment: 'live',
 *       rate_limit_tier: 'pro'
 *     }, {
 *       onSuccess: (data) => {
 *         // ⚠️ Save this key immediately - it will never be shown again!
 *         setSavedKey(data.data.key)
 *         alert('Copy this key now: ' + data.data.key)
 *       }
 *     })
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={handleCreate} disabled={createKey.isPending}>
 *         {createKey.isPending ? 'Creating...' : 'Create API Key'}
 *       </button>
 *       {savedKey && (
 *         <div>
 *           <p>⚠️ Save this key securely - it will only be shown once!</p>
 *           <code>{savedKey}</code>
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function useCreateAPIKey(): UseMutationResult<
  CreatedAPIKeyResponse,
  Error,
  APIKeyCreateParams
> {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params) => client.apiKeys.create(params),
    onSuccess: () => {
      // Invalidate list to show new key
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })
}

/**
 * Hook to update an API key
 *
 * Can update name, scopes, or active status.
 * Only organization admins can update API keys.
 *
 * @example
 * ```tsx
 * function UpdateAPIKeyScopes({ keyId }: { keyId: string }) {
 *   const updateKey = useUpdateAPIKey()
 *
 *   const handleAddWritePermissions = () => {
 *     updateKey.mutate({
 *       id: keyId,
 *       scopes: ['read:jobs', 'write:jobs', 'read:applications', 'write:applications']
 *     }, {
 *       onSuccess: () => {
 *         console.log('Scopes updated successfully')
 *       }
 *     })
 *   }
 *
 *   const handleDeactivate = () => {
 *     updateKey.mutate({
 *       id: keyId,
 *       is_active: false
 *     })
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={handleAddWritePermissions}>Add Write Permissions</button>
 *       <button onClick={handleDeactivate}>Deactivate Key</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useUpdateAPIKey(): UseMutationResult<
  APIKeyResponse,
  Error,
  { id: string } & APIKeyUpdateParams
> {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...params }) => client.apiKeys.update(id, params),
    onSuccess: (_, variables) => {
      // Invalidate both the specific key and the list
      queryClient.invalidateQueries({ queryKey: ['api-keys', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })
}

/**
 * Hook to revoke an API key
 *
 * ⚠️ This is permanent and cannot be undone!
 * The key will immediately stop working for all API calls.
 *
 * @example
 * ```tsx
 * function RevokeAPIKeyButton({ keyId, keyName }: { keyId: string, keyName: string }) {
 *   const revokeKey = useRevokeAPIKey()
 *
 *   const handleRevoke = () => {
 *     if (!confirm(`Are you sure you want to revoke "${keyName}"? This cannot be undone.`)) {
 *       return
 *     }
 *
 *     revokeKey.mutate(keyId, {
 *       onSuccess: (data) => {
 *         console.log(data.data.message)
 *       }
 *     })
 *   }
 *
 *   return (
 *     <button
 *       onClick={handleRevoke}
 *       disabled={revokeKey.isPending}
 *       className="danger"
 *     >
 *       {revokeKey.isPending ? 'Revoking...' : 'Revoke Key'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useRevokeAPIKey(): UseMutationResult<APIKeyRevokeResponse, Error, string> {
  const client = useScaffald()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => client.apiKeys.revoke(id),
    onSuccess: (_, id) => {
      // Remove from cache and invalidate list
      queryClient.removeQueries({ queryKey: ['api-keys', id] })
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })
}

/**
 * Hook to get API key usage statistics
 *
 * Returns request counts, error rates, response times, and detailed logs.
 *
 * @example
 * ```tsx
 * function APIKeyUsageChart({ keyId }: { keyId: string }) {
 *   const [timeRange, setTimeRange] = useState(30)
 *   const { data, isLoading } = useAPIKeyUsage(keyId, timeRange)
 *
 *   if (isLoading) return <div>Loading usage data...</div>
 *
 *   return (
 *     <div>
 *       <select value={timeRange} onChange={e => setTimeRange(Number(e.target.value))}>
 *         <option value={7}>Last 7 days</option>
 *         <option value={30}>Last 30 days</option>
 *         <option value={90}>Last 90 days</option>
 *       </select>
 *
 *       <div>
 *         <h3>Statistics</h3>
 *         <p>Total requests: {data?.data.total_requests}</p>
 *         <p>Success rate: {100 - parseFloat(data?.data.error_rate || '0')}%</p>
 *         <p>Avg response time: {data?.data.avg_response_time_ms}ms</p>
 *       </div>
 *
 *       <div>
 *         <h3>Recent Requests</h3>
 *         {data?.data.usage.map((req, i) => (
 *           <div key={i}>
 *             {req.method} {req.endpoint}: {req.status_code} ({req.response_time_ms}ms)
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 */
export function useAPIKeyUsage(id: string, days: number = 30): UseQueryResult<APIKeyUsageResponse> {
  const client = useScaffald()

  return useQuery({
    queryKey: ['api-keys', id, 'usage', days],
    queryFn: () => client.apiKeys.getUsage(id, days),
    enabled: !!id && days > 0 && days <= 90,
    staleTime: 5 * 60 * 1000, // 5 minutes - usage data can be slightly stale
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}
