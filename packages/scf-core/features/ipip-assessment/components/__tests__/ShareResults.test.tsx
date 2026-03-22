import { copyToClipboard } from '@scf/core/utils/clipboard'
import { fireEvent, render, screen } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { ShareResults } from '../ShareResults'

const toastShow = vi.fn()
const invalidateAssessment = vi.fn()

vi.mock('@scaffald/ui', () => ({
  useToast: () => ({
    show: toastShow,
  }),
}))

vi.mock('@scf/core/utils/clipboard', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(true),
}))

const generateMutation = {
  mutate: vi.fn(),
  isPending: false,
}
const revokeMutation = {
  mutate: vi.fn(),
  isPending: false,
}

let generateHandlers: {
  onSuccess?: (data: { token: string }) => void
  onError?: (error: Error) => void
} = {}
let revokeHandlers: {
  onSuccess?: () => void
  onError?: (error: Error) => void
} = {}

vi.mock('@scf/core/utils/api', () => ({
  api: {
    personalityAssessment: {
      generateShareToken: {
        useMutation: (options?: typeof generateHandlers) => {
          generateHandlers = options ?? {}
          return generateMutation
        },
      },
      revokeShareToken: {
        useMutation: (options?: typeof revokeHandlers) => {
          revokeHandlers = options ?? {}
          return revokeMutation
        },
      },
    },
    useUtils: () => ({
      personalityAssessment: {
        getAssessmentStatus: { invalidate: invalidateAssessment },
      },
    }),
  },
}))

describe('ShareResults', () => {
  beforeEach(() => {
    toastShow.mockClear()
    invalidateAssessment.mockClear()
    generateMutation.mutate.mockClear()
    revokeMutation.mutate.mockClear()
    generateHandlers = {}
    revokeHandlers = {}
    ;(copyToClipboard as Mock).mockClear()
  })

  it('renders a locked state when the assessment is incomplete', () => {
    render(<ShareResults isComplete={false} nextAvailableAt={null} />)

    expect(screen.getByText(/Complete Assessment to Share/i)).toBeVisible()
    expect(screen.queryByText(/Generate Share Link/i)).not.toBeInTheDocument()
  })

  it('generates and displays a share link with privacy controls', () => {
    render(<ShareResults isComplete nextAvailableAt={null} />)

    fireEvent.click(screen.getByRole('button', { name: /Generate Share Link/i }))
    expect(generateMutation.mutate).toHaveBeenCalledWith({ expiresInDays: 30 })

    act(() => {
      generateHandlers.onSuccess?.({ token: '1111-2222' })
    })

    expect(screen.getByText(/Your Share Link/i)).toBeVisible()
    expect(
      screen.getByText(/http:\/\/localhost\/dashboard\/assessments\/ipip\/shared\/1111-2222/i)
    ).toBeVisible()
    expect(toastShow).toHaveBeenCalledWith('Share link created!', expect.any(Object))
  })

  it('copies the generated link to clipboard and revokes it', async () => {
    render(<ShareResults isComplete nextAvailableAt={null} />)

    fireEvent.click(screen.getByRole('button', { name: /Generate Share Link/i }))
    act(() => {
      generateHandlers.onSuccess?.({ token: 'abcd' })
    })

    fireEvent.click(await screen.findByRole('button', { name: /Copy/i }))
    expect(copyToClipboard).toHaveBeenCalledWith(
      'http://localhost/assessments/ipip/shared/abcd'
    )
    expect(toastShow).toHaveBeenCalledWith('Copied!', expect.any(Object))

    fireEvent.click(screen.getByRole('button', { name: /Revoke/i }))
    expect(revokeMutation.mutate).toHaveBeenCalledWith({ token: 'abcd' })

    act(() => {
      revokeHandlers.onSuccess?.()
    })
    expect(toastShow).toHaveBeenCalledWith('Share link revoked', expect.any(Object))
  })

  it('shows cooldown messaging when the next retake date is in the future', () => {
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    render(<ShareResults isComplete nextAvailableAt={nextMonth.toISOString()} />)

    expect(screen.getByText(/Retake Available Soon/i)).toBeVisible()
    expect(screen.getByText(/This cooldown period ensures accurate results/i)).toBeVisible()
  })
})
