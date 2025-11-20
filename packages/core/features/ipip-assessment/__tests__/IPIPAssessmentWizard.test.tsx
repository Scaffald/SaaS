import type { IPIPAnswer } from '@app/core/features/personality-assessment/lib/ipip'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IPIPAssessmentWizard } from '../IPIPAssessmentWizard'

const mockRouterPush = vi.fn()
const mockToastShow = vi.fn()
const invalidateStatus = vi.fn()
const invalidateAssessment = vi.fn()
const getIPIPStatusMock = vi.fn()
const getAssessmentStatusMock = vi.fn()
const saveMutationSpy = vi.fn()
let mutationOptions: {
  onSuccess?: (result: unknown) => void
  onError?: (error: Error) => void
} | null = null

vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}))

vi.mock('@tamagui/toast', () => ({
  useToastController: () => ({
    show: mockToastShow,
  }),
}))

vi.mock('@app/core/utils/api', () => ({
  api: {
    personalityAssessment: {
      getIPIPStatus: {
        useQuery: (...args: unknown[]) => getIPIPStatusMock(...args),
      },
      getAssessmentStatus: {
        useQuery: (...args: unknown[]) => getAssessmentStatusMock(...args),
      },
      saveIPIPProgress: {
        useMutation: (options: typeof mutationOptions) => {
          mutationOptions = options
          return { mutate: saveMutationSpy, isPending: false }
        },
      },
    },
    useUtils: () => ({
      personalityAssessment: {
        getIPIPStatus: { invalidate: invalidateStatus },
        getAssessmentStatus: { invalidate: invalidateAssessment },
      },
    }),
  },
}))

const mockDomainAnswers: IPIPAnswer[] = Array.from({ length: 24 }, (_, index) => ({
  id: `A-${index}`,
  domain: 'A',
  facet: 1,
  score: 4,
}))

vi.mock('@app/core/features/personality-assessment/components/IPIPTestStep', () => ({
  IPIPTestStep: (props: {
    onDomainComplete?: (domain: 'A', answers: IPIPAnswer[]) => void
    onSave?: (answers: IPIPAnswer[], index: number) => void
  }) => (
    <div>
      <button type="button" onClick={() => props.onDomainComplete?.('A', mockDomainAnswers)}>
        Complete Mock Domain
      </button>
      <button type="button" onClick={() => props.onSave?.(mockDomainAnswers, 24)}>
        Save Mock Progress
      </button>
    </div>
  ),
}))

describe('IPIPAssessmentWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mutationOptions = null
    getIPIPStatusMock.mockReturnValue({
      data: { progress: 24 },
      isLoading: false,
      error: null,
    })
    getAssessmentStatusMock.mockReturnValue({
      data: {
        ipip_answers: [],
        ipip_current_index: 0,
        ipip_language: 'en',
      },
      isLoading: false,
      error: null,
    })
  })

  it('shows the completion interstitial and toast after finishing a domain', async () => {
    const user = userEvent.setup()
    render(<IPIPAssessmentWizard />)

    await user.click(screen.getByRole('button', { name: /Complete Mock Domain/i }))

    await waitFor(() => expect(mockToastShow).toHaveBeenCalled())
    expect(mockToastShow).toHaveBeenCalledWith(
      'Domain Complete!',
      expect.objectContaining({
        message: '+5 XP - Agreeableness complete!',
      })
    )
    expect(screen.getByText('✓ Agreeableness Complete!')).toBeVisible()
    expect(screen.getByText("You've completed 1 of 5 domains")).toBeVisible()
  })

  it('lets the user continue to the next domain after acknowledging completion', async () => {
    const user = userEvent.setup()
    render(<IPIPAssessmentWizard />)

    await user.click(screen.getByRole('button', { name: /Complete Mock Domain/i }))
    await user.click(screen.getByRole('button', { name: /Continue to Next Domain/i }))

    await waitFor(() =>
      expect(screen.queryByText('✓ Agreeableness Complete!')).not.toBeInTheDocument()
    )
    expect(screen.getByRole('button', { name: /Complete Mock Domain/i })).toBeVisible()
  })

  it('saves answers through the mutation with the correct payload', async () => {
    const user = userEvent.setup()
    render(<IPIPAssessmentWizard />)

    await user.click(screen.getByRole('button', { name: /Save Mock Progress/i }))

    expect(saveMutationSpy).toHaveBeenCalledWith({
      answers: mockDomainAnswers,
      current_index: 24,
      language: 'en',
    })
    expect(mutationOptions?.onSuccess).toBeDefined()
  })
})
