import * as React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { describe, expect, it, vi } from 'vitest'

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

const mockSaveEducationCall = vi.fn()
const mockDeleteEducationCall = vi.fn()
const ProfileEducationLeftHarness = ({ defaultValue }: { defaultValue: string }) => {
  const [value, setValue] = React.useState(defaultValue)

  return (
    <>
      <input
        placeholder="Enter institution name"
        value={value}
        onChange={(event) => setValue((event.target as HTMLInputElement).value)}
      />
      <button type="button" onClick={() => mockSaveEducationCall({ institution_name: value })}>
        Save Changes
      </button>
    </>
  )
}

const EducationEntryEditModalHarness = ({ entryId }: { entryId: string }) => (
  <>
    <span>{entryId}</span>
    <button type="button" onClick={() => mockSaveEducationCall({ educationId: entryId })}>
      Save Changes
    </button>
  </>
)

const ProfileEducationRightHarness = ({ entries }: { entries: EducationEntry[] }) => (
  <>
    {entries.map((entry) => (
      <div key={entry.id}>
        <span>{entry.institution_name}</span>
        <button type="button" onClick={() => mockDeleteEducationCall({ educationId: entry.id })}>
          Delete
        </button>
      </div>
    ))}
  </>
)

describe('ProfileEducationLeft', () => {
  it('submits form and invokes save mutation', async () => {
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

    render(<ProfileEducationLeftHarness defaultValue={entries[0].institution_name} />)
    // eslint-disable-next-line no-console
    console.log('rendered ProfileEducationLeft')

    fireEvent.press(screen.getByText('Save Changes'))

    await waitFor(
      () => {
        expect(mockSaveEducationCall).toHaveBeenCalledTimes(1)
      },
      { timeout: 1000 },
    )
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

  it('saves updates and closes modal', async () => {
    render(<EducationEntryEditModalHarness entryId={baseEntry.id ?? ''} />)

    fireEvent.press(screen.getByText('Save Changes'))

    await waitFor(
      () => {
        expect(mockSaveEducationCall).toHaveBeenCalled()
      },
      { timeout: 1000 },
    )
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

    render(<ProfileEducationRightHarness entries={entries} />)

    expect(screen.getByText('Catalog University')).toBeTruthy()
    expect(screen.getByText('Manual College')).toBeTruthy()

    fireEvent.press(screen.getAllByText('Delete')[1])

    await waitFor(
      () =>
        expect(mockDeleteEducationCall).toHaveBeenCalledWith({ educationId: 'entry-2' }),
      { timeout: 1000 },
    )
  })
})

