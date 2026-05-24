import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const listDisputesQuery = vi.fn()
  const createUploadUrlUseMutation = vi.fn()
  const submitDisputeUseMutation = vi.fn()
  const createUploadUrlMutateAsync = vi.fn()
  const submitDisputeMutateAsync = vi.fn()
  const invalidateListChecks = vi.fn()
  const invalidateGetCheck = vi.fn()
  const invalidateListDisputes = vi.fn()
  const toastShow = vi.fn()
  const storageUpload = vi.fn()

  createUploadUrlUseMutation.mockReturnValue({
    mutateAsync: createUploadUrlMutateAsync,
  })

  submitDisputeUseMutation.mockReturnValue({
    mutateAsync: submitDisputeMutateAsync,
  })

  listDisputesQuery.mockReturnValue({
    data: [],
    isLoading: false,
    refetch: vi.fn(),
  })

  storageUpload.mockResolvedValue({ data: null, error: null })

  return {
    listDisputesQuery,
    createUploadUrlUseMutation,
    submitDisputeUseMutation,
    createUploadUrlMutateAsync,
    submitDisputeMutateAsync,
    invalidateListChecks,
    invalidateGetCheck,
    invalidateListDisputes,
    toastShow,
    storageUpload,
  }
})

// Hook now imports from '@scf/core/utils/background-checks-sdk-hooks':
//   useBackgroundCheckDisputes (replaces listDisputesForCheck.useQuery)
//   useCreateDocumentUploadUrlMutation (replaces createUploadUrl.useMutation)
//   useSubmitBackgroundCheckDisputeMutation (replaces submitDispute.useMutation)
// Cache invalidation is now via @tanstack/react-query's useQueryClient
// (queryClient.invalidateQueries) instead of api.useUtils. Mock that too.
vi.mock('@scf/core/utils/background-checks-sdk-hooks', () => ({
  useBackgroundCheckDisputes: mocks.listDisputesQuery,
  useCreateDocumentUploadUrlMutation: mocks.createUploadUrlUseMutation,
  useSubmitBackgroundCheckDisputeMutation: mocks.submitDisputeUseMutation,
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQueryClient: () => ({
      // Map queryKey shape from useDispute back to legacy invalidate-helper mocks.
      // useDispute uses: ['backgroundChecks', 'list' | 'detail' | 'disputes', ...]
      invalidateQueries: (opts: { queryKey?: unknown[] }) => {
        const second = opts.queryKey?.[1]
        if (second === 'list') mocks.invalidateListChecks()
        else if (second === 'detail') mocks.invalidateGetCheck()
        else if (second === 'disputes') mocks.invalidateListDisputes()
      },
    }),
  }
})

vi.mock('@scf/core/utils/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        uploadToSignedUrl: mocks.storageUpload,
      })),
    },
  },
}))

vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual('@scaffald/ui')
  return {
    ...actual,
    useToast: () => ({
      show: mocks.toastShow,
    }),
  }
})

vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual<typeof import('react-hook-form')>('react-hook-form')
  return {
    ...actual,
    useForm: () => {
      const values: Record<string, string> = {
        reason: '',
        otherReason: '',
        details: '',
      }

      return {
        control: {},
        handleSubmit: (fn: (data: typeof values) => Promise<void> | void) => async () => {
          await fn({ ...values })
        },
        reset: vi.fn((next?: Partial<typeof values>) => {
          Object.assign(values, { reason: '', otherReason: '', details: '', ...next })
        }),
        watch: () => ({ ...values }),
        formState: {
          isDirty: true,
          errors: {},
        },
        setValue: vi.fn((key: keyof typeof values, value: string) => {
          values[key] = value
        }),
        getValues: () => ({ ...values }),
      }
    },
  }
})

const { useDispute } = await import('../useDispute')

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useDispute hook', () => {
  beforeEach(() => {
    mocks.listDisputesQuery.mockClear()
    mocks.createUploadUrlUseMutation.mockClear()
    mocks.submitDisputeUseMutation.mockClear()
    mocks.createUploadUrlMutateAsync.mockReset()
    mocks.submitDisputeMutateAsync.mockReset()
    mocks.invalidateListChecks.mockReset()
    mocks.invalidateGetCheck.mockReset()
    mocks.invalidateListDisputes.mockReset()
    mocks.toastShow.mockReset()
    mocks.storageUpload.mockClear()

    mocks.listDisputesQuery.mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    })

    mocks.createUploadUrlUseMutation.mockReturnValue({
      mutateAsync: mocks.createUploadUrlMutateAsync,
    })

    mocks.submitDisputeUseMutation.mockReturnValue({
      mutateAsync: mocks.submitDisputeMutateAsync,
    })

    mocks.createUploadUrlMutateAsync.mockResolvedValue({
      bucket: 'background-check-documents',
      storagePath: 'user/check/document.pdf',
      token: 'signed-token',
      documentType: 'dispute_supporting_1',
    })

    mocks.submitDisputeMutateAsync.mockResolvedValue({
      id: 'dispute-1',
      status: 'pending',
    })

    mocks.storageUpload.mockResolvedValue({
      data: null,
      error: null,
    })
  })

  it('initialises with default form values', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useDispute({ checkId: 'check-123' }), { wrapper })

    expect(result.current.form.getValues()).toEqual({
      reason: '',
      otherReason: '',
      details: '',
    })
    expect(result.current.attachments).toHaveLength(0)
    expect(result.current.hasActiveDispute).toBe(false)
  })

  it('adds web attachment and clears errors', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useDispute({ checkId: 'check-123' }), { wrapper })

    const file = new File(['test'], 'evidence.pdf', { type: 'application/pdf' })

    await act(async () => {
      await result.current.addAttachment({ files: [file] })
    })

    expect(result.current.attachments).toHaveLength(1)
    expect(result.current.attachmentError).toBeNull()
    expect(result.current.attachments[0]).toMatchObject({
      name: 'evidence.pdf',
      mimeType: 'application/pdf',
      documentType: 'dispute_supporting_1',
    })
  })

  it('submits dispute, uploads attachments, and invalidates caches', async () => {
    const wrapper = createWrapper()

    const { result } = renderHook(() => useDispute({ checkId: 'check-123' }), { wrapper })

    expect(mocks.createUploadUrlUseMutation).toHaveBeenCalled()
    expect(mocks.submitDisputeUseMutation).toHaveBeenCalled()

    const fileContent = 'x'.repeat(512)
    const file = new File([fileContent], 'evidence.pdf', { type: 'application/pdf' })
    if (!('arrayBuffer' in file)) {
      Object.defineProperty(file, 'arrayBuffer', {
        value: async () => new TextEncoder().encode(fileContent).buffer,
      })
    }

    await act(async () => {
      await result.current.addAttachment({ files: [file] })
    })

    expect(result.current.attachments).toHaveLength(1)

    await act(async () => {
      result.current.form.setValue('reason', 'incorrect_records', { shouldDirty: true })
      result.current.form.setValue(
        'details',
        'Automated test submission describing incorrect findings.',
        { shouldDirty: true }
      )
    })

    let success = false
    const submitDisputeFn = result.current.submitDispute

    await act(async () => {
      success = await submitDisputeFn()
    })

    expect(mocks.createUploadUrlMutateAsync).toHaveBeenCalled()
    expect(mocks.submitDisputeMutateAsync).toHaveBeenCalled()
    expect(result.current.submissionError).toBeNull()
    expect(success).toBe(true)
    expect(mocks.createUploadUrlMutateAsync).toHaveBeenCalledWith({
      background_check_id: 'check-123',
      document_type: 'dispute_supporting_1',
      file_name: 'evidence.pdf',
      mime_type: 'application/pdf',
      file_size: file.size,
    })
    expect(mocks.storageUpload).toHaveBeenCalledTimes(1)
    // Field names normalized to `reason` / `details` in the SDK payload.
    expect(mocks.submitDisputeMutateAsync).toHaveBeenCalledWith({
      background_check_id: 'check-123',
      reason: 'Records contain inaccurate findings',
      details: 'Automated test submission describing incorrect findings.',
      // SDK payload simplified: supporting_documents is now a flat string[] of file paths.
      supporting_documents: ['user/check/document.pdf'],
    })
    // Beyond-UI toast API: title is an option, variant replaces type.
    expect(mocks.toastShow).toHaveBeenCalledWith({
      title: 'Dispute submitted',
      message: 'Our compliance team will review your request shortly.',
      variant: 'success',
    })
    // Cache invalidation now flows through @tanstack/react-query's
    // queryClient.invalidateQueries(); the test's mocked useQueryClient maps
    // the queryKey prefix back to the legacy invalidate-helper mocks.
    expect(mocks.invalidateListChecks).toHaveBeenCalledTimes(1)
    expect(mocks.invalidateGetCheck).toHaveBeenCalledTimes(1)
    expect(mocks.invalidateListDisputes).toHaveBeenCalledTimes(1)
    expect(result.current.attachments).toHaveLength(0)
  })

  it('detects active disputes from query data', () => {
    const wrapper = createWrapper()

    mocks.listDisputesQuery.mockReturnValue({
      data: [
        {
          id: 'dispute-1',
          status: 'pending',
          dispute_reason: 'Records contain inaccurate findings',
        },
      ],
      isLoading: false,
      refetch: vi.fn(),
    })

    const { result } = renderHook(() => useDispute({ checkId: 'check-123' }), { wrapper })

    expect(result.current.hasActiveDispute).toBe(true)
  })
})
