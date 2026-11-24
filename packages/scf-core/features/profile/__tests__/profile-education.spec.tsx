import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * ProfileEducationLeft is the list of saved schools: every saved entry is an
 * editable row with its own Remove (#1407). It used to hide every saved entry
 * unless a rail beside it set `editingEntryId`, and #1275 removed the rail.
 *
 * The SDK hooks are stubbed (the api is covered by the education api tests);
 * what this file pins is what the form draws from the rows it is given and
 * what it sends back.
 */

type SeedEntry = {
  id?: string
  university_id?: string | null
  institution_name: string
  is_verified?: boolean | null
  degree_type?: string | null
  field_of_study?: string | null
  start_date?: string | null
  end_date?: string | null
  is_current?: boolean | null
}

let educationRows: SeedEntry[] = []
const saveCalls: unknown[] = []
const deleteCalls: unknown[] = []

// Stable references, as react-query hands them out: the form resets from these
// in an effect keyed on them, so a fresh object per render would loop.
const educationLevel = { education_level: 'Bachelor Degree' }

vi.mock('@scf/core/utils/profile-education-sdk-hooks', () => ({
  useEducation: () => ({ data: educationRows, isLoading: false, isError: false }),
  useEducationLevel: () => ({ data: educationLevel, isLoading: false, isError: false }),
  useSaveEducationMutationWithSync: () => ({
    isPending: false,
    mutateAsync: async (input: unknown) => {
      saveCalls.push(input)
      return { success: true, education_entries: [] }
    },
  }),
  useDeleteEducationMutation: () => ({
    isPending: false,
    mutateAsync: async (input: unknown) => {
      deleteCalls.push(input)
      return { success: true }
    },
  }),
}))

vi.mock('@scf/core/utils/office-universities-sdk-hooks', () => ({
  useSearchUniversities: () => ({ data: undefined, isLoading: false, error: null }),
}))

vi.mock('@scf/core/components/university', () => ({
  UniversityAutocomplete: ({ value }: { value: string }) => (
    <input aria-label="Institution search" value={value} readOnly />
  ),
}))

vi.mock('../components/MonthYearPicker', () => ({
  MonthPicker: ({ label }: { label: string }) => <span>{label}</span>,
}))

vi.mock('../utils/profile-sync-store', () => ({
  useAdaptiveProfileSync: () => 'idle',
}))

vi.mock('@scf/core/utils/platform', () => ({
  useUnsavedChangesPrompt: () => undefined,
}))

vi.mock('lucide-react-native', () => ({
  ChevronDown: () => null,
  Plus: () => null,
  X: () => null,
}))

vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@scaffald/ui')
  return {
    ...actual,
    DashboardWidget: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    FieldError: ({ message }: { message?: string }) => (message ? <span>{message}</span> : null),
    Button: ({
      children,
      onPress,
      disabled,
      'aria-label': ariaLabel,
    }: {
      children: ReactNode
      onPress?: () => void
      disabled?: boolean
      'aria-label'?: string
    }) => (
      <button type="button" onClick={onPress} disabled={disabled} aria-label={ariaLabel}>
        {children}
      </button>
    ),
  }
})

const { ProfileEducationLeft } = await import('../profile-education-left')

const EDU_1 = '0b6f6a4e-1f0d-4c55-9a8e-6d3b1c2a0e01'
const EDU_2 = '0b6f6a4e-1f0d-4c55-9a8e-6d3b1c2a0e02'
const UNIVERSITY_1 = '5d1c9e7a-2b3f-4a8d-8e6f-1a2b3c4d5e01'

const catalogSchool: SeedEntry = {
  id: EDU_1,
  university_id: UNIVERSITY_1,
  institution_name: 'Catalog University',
  is_verified: true,
  degree_type: 'Bachelor Degree',
  field_of_study: 'Construction Management',
  start_date: '2016-09-01',
  end_date: '2020-05-01',
}

const manualSchool: SeedEntry = {
  id: EDU_2,
  university_id: null,
  institution_name: 'Night School of Welding',
  is_verified: false,
  start_date: '2021-01-01',
  is_current: true,
}

describe('ProfileEducationLeft', () => {
  beforeEach(() => {
    educationRows = [catalogSchool, manualSchool]
    saveCalls.length = 0
    deleteCalls.length = 0
  })
  afterEach(cleanup)

  it('lists every saved school as an editable entry', async () => {
    render(<ProfileEducationLeft />)

    // The catalog pick fills the search field, the manual one the plain input.
    await waitFor(() =>
      expect(screen.getByLabelText('Institution search')).toHaveValue('Catalog University')
    )
    expect(screen.getByLabelText('Institution name')).toHaveValue('Night School of Welding')
    expect(screen.getByLabelText('Remove education 1')).toBeTruthy()
    expect(screen.getByLabelText('Remove education 2')).toBeTruthy()
    expect(screen.queryByText('No education entries added yet')).toBeNull()
  })

  it('edits a saved school in place and saves it under its own id', async () => {
    render(<ProfileEducationLeft />)
    const name = await screen.findByLabelText('Institution name')

    fireEvent.change(name, { target: { value: 'Evening School of Welding' } })
    await act(async () => {
      fireEvent.click(screen.getByText('Save Changes'))
    })

    await waitFor(() => expect(saveCalls).toHaveLength(1))
    const sent = saveCalls[0] as { education_entries: SeedEntry[] }
    expect(sent.education_entries.map((e) => e.id)).toEqual([EDU_1, EDU_2])
    expect(sent.education_entries[1].institution_name).toBe('Evening School of Welding')
    expect(deleteCalls).toEqual([])
  })

  it('Remove on a saved school deletes it on Save', async () => {
    render(<ProfileEducationLeft />)
    fireEvent.click(await screen.findByLabelText('Remove education 1'))

    // The row goes at once; the delete waits for Save.
    expect(screen.queryByLabelText('Institution search')).toBeNull()
    expect(deleteCalls).toEqual([])

    await act(async () => {
      fireEvent.click(screen.getByText('Save Changes'))
    })

    await waitFor(() => expect(saveCalls).toHaveLength(1))
    expect(deleteCalls).toEqual([{ educationId: EDU_1 }])
    const sent = saveCalls[0] as { education_entries: SeedEntry[] }
    expect(sent.education_entries.map((e) => e.id)).toEqual([EDU_2])
  })

  it('says so when there is nothing saved', () => {
    educationRows = []
    render(<ProfileEducationLeft />)
    expect(screen.getByText('No education entries added yet')).toBeTruthy()
  })
})
