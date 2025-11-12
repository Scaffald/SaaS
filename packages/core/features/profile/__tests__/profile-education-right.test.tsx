import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProfileEducationRight } from '../profile-education-right'

const editModalOpens: boolean[] = []
const deleteMutationSpy = vi.fn()
const refetchSpy = vi.fn()

vi.mock('@tamagui/toast', () => ({
  useToastController: () => ({
    show: vi.fn(),
  }),
}))

vi.mock('@tamagui/lucide-icons', () => ({
  GraduationCap: () => null,
  Calendar: () => null,
  MapPin: () => null,
  Pencil: () => null,
  Trash2: () => null,
  CheckCircle: () => <span>Verified</span>,
  AlertCircle: () => <span>Alert</span>,
}))

vi.mock('../components', () => ({
  ProfileEmptyState: ({ message }: { message: string }) => <div>{message}</div>,
  EducationEntryEditModal: ({
    open,
    educationEntry,
    onOpenChange,
  }: {
    open: boolean
    educationEntry: { institution_name: string } | null
    onOpenChange: (open: boolean) => void
  }) => {
    editModalOpens.push(open)
    return open ? (
      <div data-testid="education-edit-modal">
        Editing: {educationEntry?.institution_name}
        <button type="button" onClick={() => onOpenChange(false)}>
          Close modal
        </button>
      </div>
    ) : null
  },
}))

vi.mock('@app/ui', () => {
  const React = require('react') as typeof import('react')
  const createView =
    (element = 'div') =>
    React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(({ children, ...rest }, ref) =>
      React.createElement(element, { ref, ...rest }, children),
    )

  const Button = React.forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<'button'> & { onPress?: () => void }
  >(({ children, onPress, ...rest }, ref) => (
    <button ref={ref} type="button" onClick={onPress} {...rest}>
      {children}
    </button>
  ))

  return {
    DashboardWidget: createView(),
    Button,
  }
})

vi.mock('tamagui', () => {
  const React = require('react') as typeof import('react')
  const createView =
    (element = 'div') =>
    React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(({ children, ...rest }, ref) =>
      React.createElement(element, { ref, ...rest }, children),
    )

  const DialogRoot = ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode
    open: boolean
    onOpenChange: (open: boolean) => void
  }) => (
    <div data-open={open}>
      <button type="button" onClick={() => onOpenChange(false)}>
        Close dialog
      </button>
      {children}
    </div>
  )

  return {
    YStack: createView(),
    XStack: createView(),
    Text: createView('span'),
    H4: createView('h4'),
    Spinner: () => <div>spinner</div>,
    Button: React.forwardRef<
      HTMLButtonElement,
      React.ComponentPropsWithoutRef<'button'> & { onPress?: () => void }
    >(({ children, onPress, ...rest }, ref) => (
      <button ref={ref} type="button" onClick={onPress} {...rest}>
        {children}
      </button>
    )),
    Dialog: Object.assign(DialogRoot, {
      Portal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      Overlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      Content: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      Title: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
      Description: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
      Close: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
    }),
  }
})

const educationEntries = [
  {
    id: 'ed-1',
    institution_name: 'Verified University',
    is_verified: true,
    degree_type: 'Bachelor Degree',
    field_of_study: 'Physics',
    start_date: '2018-01-01',
    end_date: '2022-05-01',
    is_current: false,
    gpa: 3.5,
    description: 'Graduated with honors.',
    location: 'Boston, MA',
  },
  {
    id: 'ed-2',
    institution_name: 'Manual Institute',
    is_verified: false,
    degree_type: 'Other',
    custom_degree_type: 'International Diploma',
    field_of_study: 'Engineering',
    start_date: '2023-01-01',
    end_date: null,
    is_current: true,
    expected_graduation_date: '2025-06-01',
    gpa: null,
    description: null,
    location: 'Remote',
  },
]

vi.mock('@app/core/utils/api', () => ({
  api: {
    profile: {
      getEducation: {
        useQuery: () => ({
          data: educationEntries,
          isLoading: false,
          isError: false,
          refetch: refetchSpy,
        }),
      },
      deleteEducation: {
        useMutation: () => ({
          mutate: deleteMutationSpy,
          isLoading: false,
        }),
      },
    },
  },
}))

describe('ProfileEducationRight', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    editModalOpens.length = 0
  })

  it('renders verification badges, GPA, and current status', () => {
    render(<ProfileEducationRight />)

    expect(screen.getByText('Verified University')).toBeInTheDocument()
    expect(screen.getByText('GPA: 3.5/4.0')).toBeInTheDocument()
    expect(screen.getByText('Manual Institute')).toBeInTheDocument()
    expect(screen.getByText('Pending verification')).toBeInTheDocument()
    expect(screen.getByText('Current')).toBeInTheDocument()
  })

  it('opens the edit modal when edit button is pressed', () => {
    render(<ProfileEducationRight />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])

    expect(editModalOpens.some(Boolean)).toBe(true)
    expect(screen.getByTestId('education-edit-modal')).toBeInTheDocument()
  })

  it('confirms deletion and triggers delete mutation', async () => {
    render(<ProfileEducationRight />)

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    fireEvent.click(deleteButtons[1])
    const confirmButtons = screen.getAllByRole('button', { name: 'Delete' })
    fireEvent.click(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => expect(deleteMutationSpy).toHaveBeenCalledWith({ educationId: 'ed-2' }))
  })
})

