// @ts-nocheck
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FC, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const highlightStore = vi.hoisted(() => ({
  highlights: {} as Record<string, 'added' | 'removed'>,
}))

vi.mock('../profile-certifications-highlight-context', () => ({
  useProfileCertificationsHighlight: () => highlightStore,
}))

vi.mock('@tamagui/lucide-icons', () => ({
  Award: () => <span />,
  ChevronDown: () => <span>▼</span>,
  ChevronRight: () => <span>▶</span>,
  ExternalLink: () => <span>↗</span>,
  Trash2: () => <span>🗑</span>,
  Upload: () => <span>⭳</span>,
}))

type TamaguiMockProps = {
  children?: ReactNode
  onPress?: () => void
}

vi.mock('tamagui', () => {
  const React = require('react')

  const createComponent = (tag = 'div') => {
    const Component: FC<TamaguiMockProps & Record<string, unknown>> = ({ onPress, children }) => {
      const content = children as React.ReactNode
      if (onPress) {
        return React.createElement(
          'button',
          {
            type: 'button',
            onClick: onPress,
          },
          content
        )
      }
      return React.createElement(tag, null, content)
    }
    return Component
  }

  const Input = React.forwardRef<
    HTMLInputElement,
    {
      value?: string
      onChangeText?: (text: string) => void
      placeholder?: string
    }
  >(({ value, onChangeText, placeholder }, ref) =>
    React.createElement('input', {
      ref,
      placeholder,
      value,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChangeText?.(event.target.value),
      'data-testid': 'proof-url-input',
    })
  )

  const Text = ({ children }: { children?: ReactNode }) =>
    React.createElement('span', null, children)
  const ScrollView = ({ children }: { children?: ReactNode }) =>
    React.createElement('div', null, children)

  return {
    YStack: createComponent(),
    XStack: createComponent(),
    Card: createComponent(),
    Text,
    ScrollView,
    Input,
    H4: createComponent('h4'),
  }
})

'@scaffald/neue-ui', () => ({
  DashboardWidget: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  UIButton: ({
    children,
    onPress,
    disabled,
    ...rest
  }: {
    children?: ReactNode
    onPress?: (event: React.MouseEvent<HTMLButtonElement>) => void
    disabled?: boolean
  }) => (
    <button
      type="button"
      onClick={(event) => {
        if (disabled) return
        onPress?.(event)
      }}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  ),
}))

const updateProofSpy = vi.fn().mockResolvedValue({})
const removeCertSpy = vi.fn().mockResolvedValue({})
const refetchTree = vi.fn()

type UserCertificationNode = {
  id: string
  certification_id: string
  credential_url: string | null
  certificate_file_path: string | null
  catalog: {
    title: string
    description: string
    depth: number
  }
}

const queryState = vi.hoisted(() => ({
  tree: {
    depth0: [
      {
        id: 'user-depth0',
        certification_id: 'cert-top',
        credential_url: null,
        certificate_file_path: null,
        catalog: { title: 'Top OSHA', description: 'Top', depth: 0 },
      },
    ] as UserCertificationNode[],
    depth1ByParent: {
      'cert-top': [
        {
          id: 'user-depth1',
          certification_id: 'cert-cat',
          credential_url: null,
          certificate_file_path: null,
          catalog: { title: 'OSHA Category', description: 'Category', depth: 1 },
        },
      ],
    } as Record<string, UserCertificationNode[]>,
    depth2ByParent: {
      'cert-cat': [
        {
          id: 'user-depth2',
          certification_id: 'cert-leaf',
          credential_url: null,
          certificate_file_path: null,
          catalog: { title: 'OSHA 10-Hour', description: 'Leaf description', depth: 2 },
        },
      ],
    } as Record<string, UserCertificationNode[]>,
  },
}))

vi.mock('@app/core/utils/api', () => ({
  api: {
    profile: {
      certifications: {
        getUserCertificationTree: {
          useQuery: () => ({
            data: queryState.tree,
            isLoading: false,
            refetch: refetchTree,
          }),
        },
        updateCertificationProof: {
          useMutation: () => ({
            mutateAsync: updateProofSpy,
            isLoading: false,
          }),
        },
        toggleSpecificCertification: {
          useMutation: () => ({
            mutateAsync: removeCertSpy,
            isLoading: false,
          }),
        },
      },
    },
  },
}))

const { ProfileCertificationsRight } = await import('../profile-certifications-right')

describe('ProfileCertificationsRight', () => {
  beforeEach(() => {
    highlightStore.highlights = {}
    updateProofSpy.mockClear()
    removeCertSpy.mockClear()
    refetchTree.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows highlight text when certification was recently added', () => {
    highlightStore.highlights = { 'cert-leaf': 'added' }

    render(<ProfileCertificationsRight />)

    expect(screen.getAllByText('✓ Added to profile').length).toBeGreaterThan(0)
  })

  it('indicates when proof already exists', () => {
    queryState.tree.depth2ByParent['cert-cat'][0] = {
      ...queryState.tree.depth2ByParent['cert-cat'][0],
      credential_url: 'https://example.com/proof',
    }

    render(<ProfileCertificationsRight />)

    expect(screen.getByText('✓ Proof added')).toBeInTheDocument()
  })

  it('saves proof URLs for expanded certifications', async () => {
    queryState.tree.depth2ByParent['cert-cat'][0] = {
      ...queryState.tree.depth2ByParent['cert-cat'][0],
      credential_url: null,
      certificate_file_path: null,
    }

    render(<ProfileCertificationsRight />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /OSHA 10-Hour/ }))

    const urlInput = screen.getByPlaceholderText('https://...')
    await user.type(urlInput, 'https://proof.example.com/doc')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(updateProofSpy).toHaveBeenCalledWith({
      user_certification_id: 'user-depth2',
      proof_type: 'url',
      credential_url: 'https://proof.example.com/doc',
    })
  })

  it('removes certifications when confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<ProfileCertificationsRight />)

    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: 'Remove' })[0])

    expect(removeCertSpy).toHaveBeenCalledWith({
      certification_id: 'cert-leaf',
      parent_id: 'cert-leaf',
      checked: false,
    })
  })
})
