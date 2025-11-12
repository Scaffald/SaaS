import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ResumeImportWidget } from '../ResumeImportWidget'

const pushMock = vi.fn()
const resumeQueryMock = vi.fn()

vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock('../../hooks/useResumeWizard', () => ({
  useResumeWizard: vi.fn(),
}))

vi.mock('@tamagui/lucide-icons', () => ({
  FileText: () => <span data-testid="icon-file-text" />,
  ShieldCheck: () => <span data-testid="icon-shield-check" />,
}))

vi.mock('tamagui', () => {
  // biome-ignore lint/suspicious/noExplicitAny: test doubles may receive arbitrary props
  const Stack = ({ children, ...rest }: any) => (
    <div data-testid="tamagui-stack" {...rest}>
      {children}
    </div>
  )
  // biome-ignore lint/suspicious/noExplicitAny: test doubles may receive arbitrary props
  const Text = ({ children, ...rest }: any) => (
    <span data-testid="tamagui-text" {...rest}>
      {children}
    </span>
  )

  return {
    Text,
    XStack: Stack,
    YStack: Stack,
  }
})

vi.mock('../ResumeUploadButton', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test doubles may receive arbitrary props
  ResumeUploadButton: ({ onPress, label }: any) => (
    <button type="button" onClick={onPress}>
      {label}
    </button>
  ),
}))

vi.mock('../ResumeUploadModal', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test doubles may receive arbitrary props
  ResumeUploadModal: ({ open, onUploadComplete }: any) =>
    open ? (
      <button
        type="button"
        data-testid="resume-modal"
        onClick={() => onUploadComplete('resume-generated')}
      >
        Complete Upload
      </button>
    ) : null,
}))

vi.mock('@app/core/utils/api', () => ({
  api: {
    resume: {
      hasUploaded: {
        useQuery: (...args: unknown[]) => resumeQueryMock(...args),
      },
    },
  },
}))

vi.mock('@app/ui', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test doubles may receive arbitrary props
  DashboardWidget: ({ children }: any) => (
    <div data-testid="dashboard-widget">{children}</div>
  ),
  spacing: {
    md: 16,
  },
}))

describe('ResumeImportWidget', () => {
  beforeEach(() => {
    pushMock.mockReset()
    resumeQueryMock.mockReset()
    resumeQueryMock.mockReturnValue({
      data: { hasUploaded: false },
      isLoading: false,
    })
  })

  it('renders the widget when user has not uploaded a resume', () => {
    render(<ResumeImportWidget />)

    expect(resumeQueryMock).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Import Your Resume')).toBeInTheDocument()
    expect(screen.getByText('Upload Resume')).toBeInTheDocument()
  })

  it('hides the widget after a resume has been uploaded', () => {
    resumeQueryMock.mockReturnValue({
      data: { hasUploaded: true },
      isLoading: false,
    })

    render(<ResumeImportWidget />)

    expect(screen.queryByText('Import Your Resume')).not.toBeInTheDocument()
  })

  it('opens the modal and routes to resume review after completion', () => {
    render(<ResumeImportWidget />)

    fireEvent.click(screen.getByText('Upload Resume'))
    expect(screen.getByTestId('resume-modal')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('resume-modal'))

    expect(pushMock).toHaveBeenCalledWith(
      '/dashboard/profile/resume/review?resumeId=resume-generated',
    )
    expect(screen.queryByTestId('resume-modal')).not.toBeInTheDocument()
  })
})

