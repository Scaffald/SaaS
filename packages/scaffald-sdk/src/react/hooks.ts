import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
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
export function useJob(
  id: string,
  options?: Omit<UseQueryOptions<Job>, 'queryKey' | 'queryFn'>
) {
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
export function useJobFilterOptions(
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
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
    mutationFn: (params: WithdrawApplicationParams = {}) => client.applications.withdraw(id, params),
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

// Re-export React for the OAuth hook
import * as React from 'react'
