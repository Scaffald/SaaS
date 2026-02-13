import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import type * as React from 'react'
import { ScaffaldProvider, useScaffald } from '../react/provider'
import {
  useJobs,
  useJob,
  useSimilarJobs,
  useJobFilterOptions,
  useCreateJob,
  useUpdateJob,
  useDeleteJob,
  useApplication,
  useCreateApplication,
  useUpdateApplication,
  useWithdrawApplication,
  useUserProfile,
  useOrganizationProfile,
  useEmployerProfile,
} from '../react/hooks'

describe('React Hooks', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    })
  })

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <ScaffaldProvider
        config={{ apiKey: 'test_api_key', baseUrl: 'https://api.scaffald.com' }}
        queryClient={queryClient}
      >
        {children}
      </ScaffaldProvider>
    )
  }

  describe('Provider', () => {
    it('should provide Scaffald client via context', () => {
      const { result } = renderHook(() => useScaffald(), { wrapper: createWrapper() })

      expect(result.current).toBeDefined()
      expect(result.current.jobs).toBeDefined()
      expect(result.current.applications).toBeDefined()
      expect(result.current.profiles).toBeDefined()
    })

    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useScaffald())
      }).toThrow('useScaffald must be used within a ScaffaldProvider')
    })
  })

  describe('Jobs Hooks', () => {
    describe('useJobs', () => {
      it('should fetch jobs list', async () => {
        const { result } = renderHook(() => useJobs({ limit: 10 }), { wrapper: createWrapper() })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toBeDefined()
        expect(result.current.data?.data).toHaveLength(2)
        expect(result.current.data?.data[0].title).toBe('Software Engineer')
      })

      it('should use correct query key', () => {
        const { result } = renderHook(() => useJobs({ limit: 10, status: 'published' }), { wrapper: createWrapper() })

        expect(result.current.queryKey).toEqual(['jobs', { limit: 10, status: 'published' }])
      })
    })

    describe('useJob', () => {
      it('should fetch single job', async () => {
        const { result } = renderHook(() => useJob('job_123'), { wrapper: createWrapper() })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toBeDefined()
        expect(result.current.data?.id).toBe('job_123')
        expect(result.current.data?.title).toBe('Software Engineer')
      })

      it('should not fetch when id is empty', () => {
        const { result } = renderHook(() => useJob(''), { wrapper: createWrapper() })

        expect(result.current.fetchStatus).toBe('idle')
      })
    })

    describe('useSimilarJobs', () => {
      it('should fetch similar jobs', async () => {
        const { result } = renderHook(() => useSimilarJobs('job_123', { limit: 5 }), { wrapper: createWrapper() })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toBeDefined()
        expect(result.current.data?.data).toHaveLength(2)
      })
    })

    describe('useJobFilterOptions', () => {
      it('should fetch filter options', async () => {
        const { result } = renderHook(() => useJobFilterOptions(), { wrapper: createWrapper() })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toBeDefined()
        expect(result.current.data?.industries).toBeDefined()
      })
    })

    describe('useCreateJob', () => {
      it('should create a new job', async () => {
        const { result } = renderHook(() => useCreateJob(), { wrapper: createWrapper() })

        result.current.mutate({
          title: 'Senior Developer',
          description: 'We are hiring',
          employmentType: 'full-time',
          experienceLevel: 'senior',
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toBeDefined()
        expect(result.current.data?.id).toBe('job_new_123')
      })

      it('should invalidate jobs list on success', async () => {
        const { result } = renderHook(() => useCreateJob(), { wrapper: createWrapper() })

        // First fetch jobs list
        const { result: jobsResult } = renderHook(() => useJobs(), { wrapper: createWrapper() })
        await waitFor(() => expect(jobsResult.current.isSuccess).toBe(true))
        const initialDataUpdatedAt = jobsResult.current.dataUpdatedAt

        // Create new job
        result.current.mutate({
          title: 'Senior Developer',
          description: 'We are hiring',
          employmentType: 'full-time',
          experienceLevel: 'senior',
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        // Jobs list should be invalidated - check that dataUpdatedAt changed
        await waitFor(
          () => expect(jobsResult.current.dataUpdatedAt).not.toBe(initialDataUpdatedAt),
          { timeout: 3000 }
        )
      })
    })

    describe('useUpdateJob', () => {
      it('should update an existing job', async () => {
        const { result } = renderHook(() => useUpdateJob('job_123'), { wrapper: createWrapper() })

        result.current.mutate({
          title: 'Updated Title',
          description: 'Updated description',
          employmentType: 'full-time',
          experienceLevel: 'senior',
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toBeDefined()
        expect(result.current.data?.title).toBe('Updated Title')
      })
    })

    describe('useDeleteJob', () => {
      it('should delete a job', async () => {
        const { result } = renderHook(() => useDeleteJob('job_123'), { wrapper: createWrapper() })

        result.current.mutate()

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
      })

      it('should remove job from cache on success', async () => {
        // First fetch the job
        const { result: jobResult } = renderHook(() => useJob('job_123'), { wrapper: createWrapper() })
        await waitFor(() => expect(jobResult.current.isSuccess).toBe(true))

        // Delete the job
        const { result: deleteResult } = renderHook(() => useDeleteJob('job_123'), { wrapper: createWrapper() })
        deleteResult.current.mutate()

        await waitFor(() => expect(deleteResult.current.isSuccess).toBe(true))

        // Job should be removed from cache
        const cachedJob = queryClient.getQueryData(['jobs', 'job_123'])
        expect(cachedJob).toBeUndefined()
      })
    })
  })

  describe('Applications Hooks', () => {
    describe('useApplication', () => {
      it('should fetch single application', async () => {
        const { result } = renderHook(() => useApplication('app_123'), { wrapper: createWrapper() })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toBeDefined()
        expect(result.current.data?.id).toBe('app_123')
        expect(result.current.data?.status).toBe('submitted')
      })
    })

    describe('useCreateApplication', () => {
      it('should create a new application', async () => {
        const { result } = renderHook(() => useCreateApplication(), { wrapper: createWrapper() })

        result.current.mutate({
          jobId: 'job_123',
          currentLocation: 'San Francisco',
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toBeDefined()
        expect(result.current.data?.id).toBe('app_new_123')
      })
    })

    describe('useUpdateApplication', () => {
      it('should update an application', async () => {
        const { result } = renderHook(() => useUpdateApplication('app_123'), { wrapper: createWrapper() })

        result.current.mutate({
          currentLocation: 'New York',
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toBeDefined()
        expect(result.current.data?.currentLocation).toBe('New York')
      })
    })

    describe('useWithdrawApplication', () => {
      it('should withdraw an application', async () => {
        const { result } = renderHook(() => useWithdrawApplication('app_123'), { wrapper: createWrapper() })

        result.current.mutate({
          reason: 'Accepted another offer',
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toBeDefined()
        expect(result.current.data?.status).toBe('withdrawn')
      })

      it('should work without reason', async () => {
        const { result } = renderHook(() => useWithdrawApplication('app_123'), { wrapper: createWrapper() })

        result.current.mutate()

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
      })
    })
  })

  describe('Profiles Hooks', () => {
    describe('useUserProfile', () => {
      it('should fetch user profile', async () => {
        const { result } = renderHook(() => useUserProfile('johndoe'), { wrapper: createWrapper() })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toBeDefined()
        expect(result.current.data?.username).toBe('johndoe')
        expect(result.current.data?.displayName).toBe('John Doe')
      })
    })

    describe('useOrganizationProfile', () => {
      it('should fetch organization profile', async () => {
        const { result } = renderHook(() => useOrganizationProfile('acme-corp'), { wrapper: createWrapper() })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toBeDefined()
        expect(result.current.data?.slug).toBe('acme-corp')
        expect(result.current.data?.name).toBe('ACME Corporation')
      })
    })

    describe('useEmployerProfile', () => {
      it('should fetch employer profile', async () => {
        const { result } = renderHook(() => useEmployerProfile('tech-startup'), { wrapper: createWrapper() })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toBeDefined()
        expect(result.current.data?.slug).toBe('tech-startup')
        expect(result.current.data?.name).toBe('Tech Startup Inc')
      })
    })
  })
})
