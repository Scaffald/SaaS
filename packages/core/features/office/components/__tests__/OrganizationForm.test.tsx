import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

const createOrganizationMock = vi.hoisted(() => ({ mutateAsync: vi.fn(), useMutation: vi.fn() }))
const updateOrganizationMock = vi.hoisted(() => ({ mutateAsync: vi.fn(), useMutation: vi.fn() }))
const getOrganizationQueryMock = vi.hoisted(() => ({ data: undefined, isLoading: false, useQuery: vi.fn() }))
const getProjectsWithOverridesQueryMock = vi.hoisted(() => ({ data: undefined, isLoading: false, useQuery: vi.fn() }))
const updateLocationVisibilityMock = vi.hoisted(() => ({ mutateAsync: vi.fn(), isPending: false, useMutation: vi.fn() }))
const toastMock = vi.hoisted(() => ({ show: vi.fn() }))
const routerMock = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('@app/core/utils/api', () => ({
  api: {
    office: {
      createOrganization: { useMutation: createOrganizationMock.useMutation },
      updateOrganization: { useMutation: updateOrganizationMock.useMutation },
    },
    organizations: {
      getOrganization: { useQuery: getOrganizationQueryMock.useQuery },
      getProjectsWithOverrides: { useQuery: getProjectsWithOverridesQueryMock.useQuery },
      updateLocationVisibility: { useMutation: updateLocationVisibilityMock.useMutation },
    },
  },
}))

vi.mock('@tamagui/toast', () => ({ useToastController: () => toastMock }))

vi.mock('expo-router', () => ({ useRouter: () => routerMock }))

vi.mock('@app/core/utils/supabase/client', () => ({
  supabase: {
    schema: () => ({
      from: () => ({
        select: () => ({
          order: () => Promise.resolve({ data: [{ id: 'ind-1', name: 'Construction' }], error: null }),
        }),
      }),
    }),
  },
}))

vi.mock('./OrganizationLocationsInput', () => ({
  OrganizationLocationsInput: ({ onChange }: { onChange: (value: unknown) => void }) => (
    <button type="button" onClick={() => onChange([{ name: 'HQ', address: { city: 'Charlotte' } }])}>
      add-location
    </button>
  ),
}))

vi.mock('react-hook-form', () => {
  return {
    useForm: ({ defaultValues }: { defaultValues?: Record<string, unknown> }) => {
      const values = { ...(defaultValues ?? {}) }
      const store = { values }
      return {
        control: store,
        handleSubmit: (onSubmit: (data: Record<string, unknown>) => Promise<void> | void) => async () => {
          await onSubmit({ ...store.values })
        },
        formState: { errors: {}, isDirty: true },
        setValue: (name: string, value: unknown) => {
          store.values[name] = value
        },
        watch: (name?: string) => (name ? store.values[name] : store.values),
        reset: (next?: Record<string, unknown>) => {
          Object.assign(store.values, next ?? {})
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
      render: (props: { field: { name: string; value: unknown; onChange: (value: unknown) => void; onBlur: () => void }; fieldState: { error: null } }) => ReactNode
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

vi.mock('@app/ui', () => ({
  Button: ({ children, onPress, disabled, testID }: { children: ReactNode; onPress?: () => void; disabled?: boolean; testID?: string }) => (
    <button type="button" data-testid={testID} disabled={disabled} onClick={onPress}>
      {children}
    </button>
  ),
  Text: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  AddressAutocomplete: ({ value, onChange, onAddressSelect }: { value?: string; onChange: (value: string) => void; onAddressSelect: (result: Record<string, unknown>) => void }) => (
    <div>
      <input
        data-testid="address-autocomplete"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        onClick={() =>
          onAddressSelect({
            formattedAddress: '123 Main St',
            locality: 'Charlotte',
            stateAbbreviation: 'NC',
            postalCode: '28202',
            country: 'USA',
          })
        }
      >
        select-address
      </button>
    </div>
  ),
}))

const selectState = { onChange: (_value: string) => {} }

vi.mock('tamagui', async () => {
  const actual = await vi.importActual<typeof import('tamagui')>('tamagui')

  const Select = ({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: ReactNode }) => (
    <div data-testid="select" data-value={value}>
      {(() => {
        selectState.onChange = onValueChange
        return null
      })()}
      <button type="button" onClick={() => onValueChange('ind-1')}>
        choose-industry
      </button>
      {children}
    </div>
  )
  Select.Trigger = ({ children }: { children: ReactNode }) => <div>{children}</div>
  Select.Value = ({ children }: { children?: ReactNode }) => <span>{children}</span>
  Select.Content = ({ children }: { children: ReactNode }) => <div>{children}</div>
  Select.Viewport = ({ children }: { children: ReactNode }) => <div>{children}</div>
  Select.Group = ({ children }: { children: ReactNode }) => <div>{children}</div>
  Select.Label = ({ children }: { children: ReactNode }) => <div>{children}</div>
  Select.ScrollUpButton = () => null
  Select.ScrollDownButton = () => null
  Select.Item = ({ value, children }: { value: string; children: ReactNode }) => (
    <button
      type="button"
      data-testid={`select-item-${value || 'none'}`}
      onClick={() => selectState.onChange(value)}
    >
      {children}
    </button>
  )
  Select.ItemText = ({ children }: { children: ReactNode }) => <span>{children}</span>
  Select.ItemIndicator = ({ children }: { children: ReactNode }) => <span>{children}</span>

  const Input = ({ value, onChangeText, placeholder, id, testID }: { value?: string; onChangeText?: (value: string) => void; placeholder?: string; id?: string; testID?: string }) => (
    <input
      id={id}
      data-testid={testID}
      placeholder={placeholder}
      defaultValue={(value as string | undefined) ?? ''}
      onChange={(event) => onChangeText?.(event.target.value)}
    />
  )

  const Label = ({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) => <label htmlFor={htmlFor}>{children}</label>

  const YStack = ({ children }: { children: ReactNode }) => <div>{children}</div>
  const XStack = ({ children }: { children: ReactNode }) => <div>{children}</div>
  const ButtonBase = ({ children, onPress, disabled, testID }: { children: ReactNode; onPress?: () => void; disabled?: boolean; testID?: string }) => (
    <button type="button" data-testid={testID} disabled={disabled} onClick={onPress}>
      {children}
    </button>
  )
  ButtonBase.Icon = ({ children }: { children: ReactNode }) => <span>{children}</span>
  ButtonBase.Text = ({ children }: { children: ReactNode }) => <span>{children}</span>
  const Text = ({ children }: { children: ReactNode }) => <span>{children}</span>
  const Spinner = () => <span>spinner</span>
  const ScrollView = ({ children }: { children: ReactNode }) => <div>{children}</div>

  return {
    ...actual,
    Select,
    Input,
    Label,
    YStack,
    XStack,
    Button: ButtonBase,
    Text,
    Spinner,
    ScrollView,
    H4: ({ children }: { children: ReactNode }) => <h4>{children}</h4>,
    Card: ({ children, ...rest }: { children?: ReactNode } & Record<string, unknown>) => (
      <div {...rest}>{children}</div>
    ),
  }
})

vi.mock('@tamagui/lucide-icons', () => ({
  Check: () => <span data-testid="check-icon" />,
  ChevronDown: () => <span data-testid="chevron-icon" />,
  Plus: () => <span data-testid="plus-icon" />,
  X: () => <span data-testid="x-icon" />,
}))

vi.mock('expo-crypto', () => ({
  randomUUID: () => `uuid-${Math.random().toString(16).slice(2)}`,
}))

const { OrganizationForm } = await import('../OrganizationForm')

describe('OrganizationForm', () => {
  beforeEach(() => {
    createOrganizationMock.mutateAsync.mockReset()
    updateOrganizationMock.mutateAsync.mockReset()
    createOrganizationMock.useMutation.mockReturnValue({ mutateAsync: createOrganizationMock.mutateAsync, isPending: false })
    updateOrganizationMock.useMutation.mockReturnValue({ mutateAsync: updateOrganizationMock.mutateAsync, isPending: false })
    getOrganizationQueryMock.useQuery.mockReturnValue({ data: undefined, isLoading: false })
    getProjectsWithOverridesQueryMock.useQuery.mockReturnValue({ data: undefined, isLoading: false })
    updateLocationVisibilityMock.useMutation.mockReturnValue({ mutateAsync: updateLocationVisibilityMock.mutateAsync, isPending: false })
    toastMock.show.mockReset()
    routerMock.push.mockReset()
  })

  it('submits create mutation with initial data defaults', async () => {
    const user = userEvent.setup()
    createOrganizationMock.mutateAsync.mockResolvedValue(undefined)

    render(
      <OrganizationForm
        mode="create"
        initialData={{
          name: 'Build Co',
          slug: 'build-co',
          logo_url: 'https://logo.png',
          visibility: 'public',
          locations: [
            {
              name: 'HQ',
              locationType: 'headquarters' as const,
              isActive: true,
              address: {
                city: 'Charlotte',
                state: 'NC',
                country: 'USA',
                postalCode: '28202',
              } as Partial<Record<string, unknown>>,
            },
          ],
        }}
      />
    )

    await user.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(createOrganizationMock.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Build Co',
          slug: 'build-co',
          logo_url: 'https://logo.png',
        })
      )
    })
  })

  it('submits update mutation when editing existing data', async () => {
    const user = userEvent.setup()
    updateOrganizationMock.mutateAsync.mockResolvedValue(undefined)

    render(
      <OrganizationForm
        mode="edit"
        organizationId="org-123"
        initialData={{
          name: 'Existing Co',
          slug: 'existing-co',
          logo_url: 'https://logo.png',
        }}
      />
    )

    await user.click(screen.getByRole('button', { name: /update/i }))

    await waitFor(() => {
      expect(updateOrganizationMock.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'org-123',
          name: 'Existing Co',
        })
      )
    })
  })
})
