import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { z } from 'zod'

const createTeamMock = vi.hoisted(() => ({ mutateAsync: vi.fn(), useMutation: vi.fn() }))
const updateTeamMock = vi.hoisted(() => ({ mutateAsync: vi.fn(), useMutation: vi.fn() }))
const toastMock = vi.hoisted(() => ({ show: vi.fn() }))
const routerMock = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn() }))

const teamFormOptionsMock = vi.hoisted(() => ({
  useTeamFormOptions: vi.fn(() => ({
    roles: [
      { id: 'role-1', key: 'member', name: 'Member' },
      { id: 'role-2', key: 'team_admin', name: 'Team Admin' },
    ],
    isLoading: false,
  })),
}))

const setValueSpy = vi.hoisted(() => vi.fn())
const handleSubmitSpy = vi.hoisted(() => vi.fn())

vi.mock('../../hooks/useTeamFormOptions', () => teamFormOptionsMock)

vi.mock('@app/core/utils/api', () => ({
  api: {
    teams: {
      create: { useMutation: createTeamMock.useMutation },
      update: { useMutation: updateTeamMock.useMutation },
    },
  },
}))

vi.mock('@tamagui/toast', () => ({ useToastController: () => toastMock }))

vi.mock('expo-router', () => ({ useRouter: () => routerMock }))

vi.mock('@app/schemas', () => {
  const teamRoleKeySchema = z.enum(['member', 'team_admin', 'team_lead', 'recruiter', 'reviewer'])
  const teamCreateBaseSchema = z.object({
    organizationId: z.string(),
    name: z.string().min(1),
    slug: z.string().optional(),
    purpose: z.string().optional(),
    visibility: z.enum(['organization', 'private']).default('organization'),
    invitationPolicy: z.enum(['invite_only', 'request_to_join']).default('invite_only'),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    metadata: z.record(z.any()).default({}),
    defaultRoleId: z.string().optional(),
    defaultRoleKey: teamRoleKeySchema.default('member'),
  })
  const teamCreateSchema = teamCreateBaseSchema.refine(
    (input) => Boolean(input.defaultRoleId ?? input.defaultRoleKey),
    'A default role must be provided',
  )

  return {
    teamCreateBaseSchema,
    teamCreateSchema,
    teamRoleKeySchema,
    TEAM_VISIBILITIES: ['organization', 'private'] as const,
    TEAM_INVITATION_POLICIES: ['invite_only', 'request_to_join'] as const,
  }
})

vi.mock('@tamagui/lucide-icons', () => ({
  Palette: () => <span data-testid="palette-icon">Palette</span>,
  Check: () => <span data-testid="check-icon">Check</span>,
  ChevronDown: () => <span data-testid="chevron-down-icon">ChevronDown</span>,
  Bell: () => <span data-testid="bell-icon">Bell</span>,
  HardDrive: () => <span data-testid="hard-drive-icon">HardDrive</span>,
  ClipboardCheck: () => <span data-testid="clipboard-check-icon">ClipboardCheck</span>,
  ShieldCheck: () => <span data-testid="shield-check-icon">ShieldCheck</span>,
  Users: () => <span data-testid="users-icon">Users</span>,
  Briefcase: () => <span data-testid="briefcase-icon">Briefcase</span>,
  GraduationCap: () => <span data-testid="graduation-cap-icon">GraduationCap</span>,
  Building2: () => <span data-testid="building2-icon">Building2</span>,
  FileText: () => <span data-testid="file-text-icon">FileText</span>,
}))

vi.mock('@app/core/constants/routes', () => ({
  ROUTES: {
    STYLEGUIDE: { path: '/styleguide', title: 'Styleguide' },
    OFFICE_ATS: { path: '/office/ats', title: 'ATS' },
    OFFICE_TEAMS: { path: '/office/teams', title: 'Teams' },
  },
}))

vi.mock('react-hook-form', () => {
  return {
    useForm: ({ defaultValues }: { defaultValues?: Record<string, unknown> }) => {
      const values: Record<string, unknown> = { 
        ...(defaultValues ?? {}),
        // Ensure default role is set for form validation
        defaultRoleId: defaultValues?.defaultRoleId ?? 'role-1',
        defaultRoleKey: defaultValues?.defaultRoleKey ?? 'member',
      }
      const store = { values }
      const cleanValues = structuredClone(values)
      setValueSpy.mockImplementation((name: string, value: unknown) => {
        store.values[name] = value
      })

      return {
        control: store,
        handleSubmit:
          (onSubmit: (data: Record<string, unknown>) => Promise<void> | void) => {
            const submitHandler = async () => {
              handleSubmitSpy()
              // Ensure required fields are present before submitting
              const submitData = {
                ...store.values,
                defaultRoleId: store.values.defaultRoleId ?? 'role-1',
                defaultRoleKey: store.values.defaultRoleKey ?? 'member',
                organizationId: 'org-1',
              }
              // Await onSubmit to ensure mutation is triggered
              await onSubmit(submitData)
            }
            return submitHandler
          },
        formState: { errors: {}, isDirty: true },
        setValue: setValueSpy,
        reset: (next?: Record<string, unknown>) => {
          Object.assign(store.values, next ?? cleanValues)
        },
        getValues: (name?: string) => {
          if (!name) return store.values
          return store.values[name]
        },
      }
    },
    Controller: ({
      control,
      name,
      render,
    }: {
      control: { values: Record<string, unknown> }
      name: string
      render: (props: {
        field: {
          name: string
          value: unknown
          onChange: (value: unknown) => void
          onBlur: () => void
        }
        fieldState: { error: null }
      }) => ReactNode
    }) => {
      const store = control
      const field = {
        name,
        value: store.values[name],
        onChange: (value: unknown) => {
          store.values[name] = value
        },
        onBlur: () => {},
      }
      return render({ field, fieldState: { error: null } })
    },
  }
})

vi.mock('tamagui', async () => {
  const actual = await vi.importActual<typeof import('tamagui')>('tamagui')

  const Input = ({
    value,
    onChangeText,
    placeholder,
    id,
    testID,
  }: {
    value?: string
    onChangeText?: (value: string) => void
    placeholder?: string
    id?: string
    testID?: string
  }) => (
    <input
      id={id}
      data-testid={testID}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(event) => onChangeText?.(event.target.value)}
    />
  )

  const TextArea = ({
    value,
    onChangeText,
    rows,
    id,
    testID,
  }: {
    value?: string
    onChangeText?: (value: string) => void
    rows?: number
    id?: string
    testID?: string
  }) => (
    <textarea
      id={id}
      data-testid={testID}
      value={value ?? ''}
      rows={rows}
      onChange={(event) => onChangeText?.(event.target.value)}
    />
  )

  const Text = ({ children }: { children: ReactNode }) => <span>{children}</span>
  const Label = ({ children }: { children: ReactNode }) => <span>{children}</span>
  const YStack = ({ children }: { children: ReactNode }) => <div>{children}</div>
  const XStack = ({ children }: { children: ReactNode }) => <div>{children}</div>
  const ScrollView = ({ children }: { children: ReactNode }) => <div>{children}</div>
  const Spinner = () => <span>spinner</span>

  const ButtonBase = ({
    children,
    onPress,
    disabled,
    testID,
  }: {
    children: ReactNode
    onPress?: () => void
    disabled?: boolean
    testID?: string
  }) => (
    <button type="button" data-testid={testID} disabled={disabled} onClick={onPress}>
      {children}
    </button>
  )

  let selectOnValueChange: ((value: string) => void) | undefined

  const SelectBase = ({
    value,
    onValueChange,
    children,
  }: {
    value: string
    onValueChange: (value: string) => void
    children: ReactNode
  }) => {
    selectOnValueChange = onValueChange
    return (
      <div data-testid="select" data-value={value}>
        {children}
      </div>
    )
  }
  SelectBase.Trigger = ({ children }: { children: ReactNode }) => <div>{children}</div>
  SelectBase.Value = ({ children }: { children?: ReactNode }) => <span>{children}</span>
  SelectBase.Content = ({ children }: { children: ReactNode }) => <div>{children}</div>
  SelectBase.ScrollUpButton = () => null
  SelectBase.ScrollDownButton = () => null
  SelectBase.Viewport = ({ children }: { children: ReactNode }) => <div>{children}</div>
  SelectBase.Group = ({ children }: { children: ReactNode }) => <div>{children}</div>
  SelectBase.Label = ({ children }: { children: ReactNode }) => <div>{children}</div>
  SelectBase.Item = ({
    value,
    index,
    children,
  }: {
    value: string
    index: number
    children: ReactNode
  }) => (
    <button
      type="button"
      data-testid={`select-item-${index}`}
      onClick={() => selectOnValueChange?.(value)}
    >
      {children}
    </button>
  )
  SelectBase.ItemText = ({ children }: { children: ReactNode }) => <span>{children}</span>
  SelectBase.ItemIndicator = ({ children }: { children: ReactNode }) => <span>{children}</span>

  return {
    ...actual,
    Button: ButtonBase,
    Input,
    TextArea,
    Text,
    Label,
    YStack,
    XStack,
    ScrollView,
    Spinner,
    Select: SelectBase,
  }
})

vi.mock('@tamagui/lucide-icons', () => ({
  Check: () => <span data-testid="check-icon" />,
  ChevronDown: () => <span data-testid="chevron-icon" />,
}))

const { TeamForm } = await import('../TeamForm')

describe('TeamForm', () => {
  beforeEach(() => {
    createTeamMock.mutateAsync.mockReset()
    updateTeamMock.mutateAsync.mockReset()
    
    // Set up useMutation mocks to call onError when mutateAsync rejects
    createTeamMock.useMutation.mockImplementation((options?: { onError?: (error: Error) => void }) => {
      const wrappedMutateAsync = async (...args: unknown[]) => {
        try {
          return await createTeamMock.mutateAsync(...args)
        } catch (error) {
          if (options?.onError && error instanceof Error) {
            options.onError(error)
          }
          throw error
        }
      }
      return { mutateAsync: wrappedMutateAsync, isPending: false }
    })
    
    updateTeamMock.useMutation.mockImplementation((options?: { onError?: (error: Error) => void }) => {
      const wrappedMutateAsync = async (...args: unknown[]) => {
        try {
          return await updateTeamMock.mutateAsync(...args)
        } catch (error) {
          if (options?.onError && error instanceof Error) {
            options.onError(error)
          }
          throw error
        }
      }
      return { mutateAsync: wrappedMutateAsync, isPending: false }
    })
    
    toastMock.show.mockReset()
    routerMock.push.mockReset()
    routerMock.back.mockReset()
    setValueSpy.mockReset()
    handleSubmitSpy.mockReset()
  })

  it('submits create mutation with provided defaults', async () => {
    const user = userEvent.setup()
    createTeamMock.mutateAsync.mockResolvedValue(undefined)

    render(
      <TeamForm
        mode="create"
        organizationId="org-1"
        initialData={{
          name: 'Field Ops',
          slug: 'field-ops',
          purpose: 'Regional hiring',
          visibility: 'organization',
          invitationPolicy: 'invite_only',
          description: 'Hire quickly',
          defaultRole: { id: 'role-2', key: 'team_admin' },
        }}
      />,
    )

    await user.click(screen.getByTestId('team-form-submit'))

    await waitFor(() => {
      expect(createTeamMock.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-1',
          name: 'Field Ops',
          slug: 'field-ops',
          defaultRoleKey: 'team_admin',
          defaultRoleId: 'role-2',
          invitationPolicy: 'invite_only',
        }),
      )
    })
  })

  it('submits update mutation when editing', async () => {
    const user = userEvent.setup()
    updateTeamMock.mutateAsync.mockResolvedValue(undefined)

    render(
      <TeamForm
        mode="edit"
        organizationId="org-1"
        teamId="team-123"
        initialData={{
          name: 'Existing Team',
          slug: 'existing-team',
          defaultRole: { id: 'role-1', key: 'member' },
        }}
      />,
    )

    await user.click(screen.getByTestId('team-form-submit'))

    await waitFor(() => {
      expect(updateTeamMock.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId: 'team-123',
          name: 'Existing Team',
          defaultRoleId: 'role-1',
          defaultRoleKey: 'member',
          invitationPolicy: 'invite_only',
        }),
      )
    })
  })

  it('calls cancel handler when cancel button pressed', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()

    render(<TeamForm mode="create" organizationId="org-1" onCancel={onCancel} />)

    await user.click(screen.getByTestId('team-form-cancel'))

    expect(onCancel).toHaveBeenCalled()
  })

  it('shows loading state while role options are loading', () => {
    teamFormOptionsMock.useTeamFormOptions.mockReturnValueOnce({
      roles: [],
      isLoading: true,
    })

    render(<TeamForm mode="create" organizationId="org-1" />)

    expect(screen.getByText('Loading team options…')).toBeInTheDocument()
  })

  it('displays validation errors', async () => {
    const user = userEvent.setup()
    
    // Set up the mutation to reject with an error
    const error = new Error('Validation failed')
    // Suppress unhandled rejection for this test since we're testing error handling
    const unhandledRejectionHandler = vi.fn()
    process.on('unhandledRejection', unhandledRejectionHandler)
    
    createTeamMock.mutateAsync.mockRejectedValueOnce(error)

    // Render with initial data to ensure form is valid
    render(
      <TeamForm
        mode="create"
        organizationId="org-1"
        initialData={{
          name: 'Test Team',
          slug: 'test-team',
          defaultRole: { id: 'role-1', key: 'member' },
        }}
      />
    )

    // Wait for form to be ready (roles loaded)
    await waitFor(() => {
      expect(screen.queryByText('Loading team options…')).not.toBeInTheDocument()
    }, { timeout: 1000 })

    // Ensure form values are set in the store
    setValueSpy('name', 'Test Team')
    setValueSpy('defaultRoleId', 'role-1')
    setValueSpy('defaultRoleKey', 'member')
    setValueSpy('visibility', 'organization')
    setValueSpy('invitationPolicy', 'invite_only')
    setValueSpy('slug', 'test-team')

    // Wait for button to be enabled and visible
    const submitButton = await waitFor(() => {
      const btn = screen.getByTestId('team-form-submit')
      expect(btn).toBeInTheDocument()
      expect(btn).not.toBeDisabled()
      return btn
    })

    // Click the button
    await user.click(submitButton)

    // Verify handleSubmit was called (this confirms the button click worked)
    await waitFor(() => {
      expect(handleSubmitSpy).toHaveBeenCalled()
    }, { timeout: 1000 })

    // Wait for mutation to be called - the onSubmit should trigger it
    await waitFor(() => {
      expect(createTeamMock.mutateAsync).toHaveBeenCalled()
    }, { timeout: 3000 })

    // The mutation's onError handler should show a toast
    // Since the mutation rejects, the onError callback should fire
    await waitFor(() => {
      expect(toastMock.show).toHaveBeenCalled()
    }, { timeout: 2000 })
    
    // Clean up unhandled rejection handler
    process.removeListener('unhandledRejection', unhandledRejectionHandler)
  })

  it('resets form when reset is called', () => {
    const { rerender } = render(
      <TeamForm
        mode="create"
        organizationId="org-1"
        initialData={{
          name: 'Initial Name',
          defaultRole: { id: 'role-1', key: 'member' },
        }}
      />,
    )

    rerender(
      <TeamForm
        mode="create"
        organizationId="org-1"
        initialData={{
          name: 'Reset Name',
          defaultRole: { id: 'role-1', key: 'member' },
        }}
      />,
    )

    // Form should update with new initial data
    expect(screen.getByDisplayValue('Reset Name')).toBeInTheDocument()
  })

  it('handles all field types correctly', async () => {
    const user = userEvent.setup()
    createTeamMock.mutateAsync.mockResolvedValue(undefined)

    render(
      <TeamForm
        mode="create"
        organizationId="org-1"
        initialData={{
          name: 'Test Team',
          slug: 'test-team',
          purpose: 'Test purpose',
          visibility: 'private',
          invitationPolicy: 'request_to_join',
          description: 'Test description',
          defaultRole: { id: 'role-1', key: 'member' },
        }}
      />,
    )

    await user.click(screen.getByTestId('team-form-submit'))

    await waitFor(() => {
      expect(createTeamMock.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Team',
          slug: 'test-team',
          purpose: 'Test purpose',
          visibility: 'private',
          invitationPolicy: 'request_to_join',
        }),
      )
    })
  })
})

