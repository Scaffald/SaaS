import * as React from 'react'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react-native'
import { afterEach, describe, expect, it, vi } from 'vitest'

type EducationEntry = {
  id?: string
  university_id?: string | null
  institution_name: string
  is_verified?: boolean | null
  degree_type?: string | null
  custom_degree_type?: string | null
  field_of_study?: string | null
  start_date?: string | null
  end_date?: string | null
  expected_graduation_date?: string | null
  is_current?: boolean | null
  gpa?: number | string | null
  description?: string | null
  location?: string | null
}

const mockToastShow = vi.fn()
const mockInvalidateProfileQueries = vi.fn()
const mockStartProfileSync = vi.fn()
const mockCompleteProfileSync = vi.fn()
const mockFailProfileSync = vi.fn()
const mockResetProfileSyncError = vi.fn()
const mockSaveEducationCall = vi.fn()
const mockDeleteEducationCall = vi.fn()
const mockRefetchEducation = vi.fn()

afterEach(() => {
  cleanup()
  vi.resetModules()
  vi.clearAllMocks()
})

async function importWithMocks({
  entries,
  level,
}: {
  entries: EducationEntry[]
  level?: string | null
}) {
  vi.doMock('../utils/profile-sync', () => ({
    invalidateProfileQueries: (...args: unknown[]) => mockInvalidateProfileQueries(...args),
  }))

  vi.doMock('../utils/profile-sync-store', () => ({
    startProfileSync: (...args: unknown[]) => mockStartProfileSync(...args),
    completeProfileSync: (...args: unknown[]) => mockCompleteProfileSync(...args),
    failProfileSync: (...args: unknown[]) => mockFailProfileSync(...args),
    resetProfileSyncError: (...args: unknown[]) => mockResetProfileSyncError(...args),
    useAdaptiveProfileSync: () => 'idle' as const,
  }))

  vi.doMock('@tamagui/toast', () => ({
    useToastController: () => ({
      show: mockToastShow,
    }),
  }))

  vi.doMock('@app/core/utils/api', () => ({
    api: {
      profile: {
        getEducation: {
          useQuery: () => ({
            data: entries,
            isLoading: false,
            isError: false,
            refetch: mockRefetchEducation,
          }),
        },
        getEducationLevel: {
          useQuery: () => ({
            data: { education_level: level ?? null },
            isLoading: false,
            isError: false,
            refetch: mockRefetchEducation,
          }),
        },
        saveEducation: {
          useMutation: (options?: {
            onSuccess?: (result: unknown, input: unknown, context: unknown) => unknown
            onMutate?: (input: unknown) => unknown
            onSettled?: (result: unknown, error: unknown) => unknown
          }) => ({
            mutateAsync: async (input: unknown) => {
              options?.onMutate?.(input)
              mockSaveEducationCall(input)
              options?.onSuccess?.({ success: true, education_entries: entries }, input, undefined)
              options?.onSettled?.({ success: true, education_entries: entries }, undefined)
              return { success: true, education_entries: entries }
            },
          }),
        },
        deleteEducation: {
          useMutation: (options?: {
            onSuccess?: (result: unknown, input: unknown, context: unknown) => unknown
          }) => ({
            mutate: (input: unknown) => {
              mockDeleteEducationCall(input)
              options?.onSuccess?.({ success: true }, input, undefined)
            },
          }),
        },
      },
    },
  }))

  const [{ ProfileEducationLeft }, { EducationEntryEditModal }, { ProfileEducationRight }] =
    await Promise.all([
      import('../profile-education-left'),
      import('../components/EducationEntryEditModal'),
      import('../profile-education-right'),
    ])

  return { ProfileEducationLeft, EducationEntryEditModal, ProfileEducationRight }
}

describe('ProfileEducationLeft', () => {
  it('enables manual entry editing and persists changes', async () => {
    const entries: EducationEntry[] = [
      {
        id: 'entry-1',
        institution_name: 'Manual University',
        university_id: null,
        is_verified: false,
        degree_type: 'Other',
        custom_degree_type: 'International Diploma',
        start_date: '2020-01-01',
        end_date: '2022-05-01',
      },
    ]

    const { ProfileEducationLeft } = await importWithMocks({
      entries,
      level: 'Bachelor Degree',
    })

    render(<ProfileEducationLeft />)

    const manualInput = await screen.findByPlaceholderText('Enter institution name')
    fireEvent.changeText(manualInput, 'Updated Manual University')

    fireEvent.press(screen.getByText('Save Changes'))

    await waitFor(() => {
      expect(mockSaveEducationCall).toHaveBeenCalledTimes(1)
    })
  })
})

describe('EducationEntryEditModal', () => {
  const baseEntry: EducationEntry = {
    id: 'entry-1',
    institution_name: 'Catalog University',
    university_id: 'univ-1',
    is_verified: true,
    degree_type: 'Bachelor Degree',
    start_date: '2020-01-01',
    end_date: '2022-05-01',
  }

  it('switches to manual entry mode and saves updates', async () => {
    const { EducationEntryEditModal } = await importWithMocks({
      entries: [baseEntry],
    })

    const onOpenChange = vi.fn()

    render(
      <EducationEntryEditModal
        open
        educationEntry={baseEntry}
        onOpenChange={onOpenChange}
        onSuccess={vi.fn()}
      />,
    )

    fireEvent.press(
      await screen.findByText("Can't find your institution? Enter it manually"),
    )

    fireEvent.changeText(
      await screen.findByPlaceholderText('Enter institution name'),
      'Manual College',
    )

    fireEvent.press(screen.getByText('Save Changes'))

    await waitFor(() => {
      expect(mockSaveEducationCall).toHaveBeenCalled()
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('ProfileEducationRight', () => {
  it('renders verification indicators and triggers delete mutation', async () => {
    const entries: EducationEntry[] = [
      {
        id: 'entry-1',
        institution_name: 'Catalog University',
        is_verified: true,
        degree_type: 'Bachelor Degree',
        start_date: '2020-01-01',
        end_date: '2022-05-01',
      },
      {
        id: 'entry-2',
        institution_name: 'Manual College',
        is_verified: false,
        degree_type: 'Other',
        start_date: '2021-01-01',
        is_current: true,
      },
    ]

    const { ProfileEducationRight } = await importWithMocks({ entries })

    render(<ProfileEducationRight />)

    expect(await screen.findByText('Catalog University')).toBeTruthy()
    expect(screen.getByText('Manual College')).toBeTruthy()
    expect(screen.getByText('Pending verification')).toBeTruthy()

    fireEvent.press(screen.getAllByText('Delete')[1])

    await waitFor(() =>
      expect(mockDeleteEducationCall).toHaveBeenCalledWith({ educationId: 'entry-2' }),
    )
  })
})

