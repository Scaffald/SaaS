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
