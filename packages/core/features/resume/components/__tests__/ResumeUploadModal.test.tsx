import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const uploadMutateAsync = vi.fn()
const parseMutateAsync = vi.fn()
const invalidateHasUploaded = vi.fn()
const toastShow = vi.fn()
const getDocumentAsyncMock = vi.fn()
const getInfoAsyncMock = vi.fn()
const readAsStringAsyncMock = vi.fn()

vi.mock('@app/core/utils/api', () => ({
  api: {
    resume: {
      upload: {
        useMutation: () => ({
          mutateAsync: uploadMutateAsync,
          reset: vi.fn(),
          isPending: false,
        }),
      },
      parse: {
        useMutation: () => ({
          mutateAsync: parseMutateAsync,
          reset: vi.fn(),
          isPending: false,
        }),
      },
    },
    useUtils: () => ({
      resume: {
        hasUploaded: {
          invalidate: invalidateHasUploaded,
        },
      },
    }),
  },
}))

vi.mock('@tamagui/toast', () => ({
  useToastController: () => ({ show: toastShow }),
}))

vi.mock('@app/ui', () => ({
  ResponsiveModal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FileUpload: ({
    onFileSelect,
    disabled,
  }: {
    onFileSelect: (file: File) => void
    disabled?: boolean
  }) => (
    <button
      type="button"
      data-testid="mock-file-upload"
      disabled={disabled}
      onClick={() =>
        onFileSelect(new File(['test resume'], 'resume.pdf', { type: 'application/pdf' }))
      }
    >
      Upload Resume
    </button>
  ),
  spacing: { md: 16, sm: 8 },
}))

vi.mock('expo-document-picker', () => ({
  getDocumentAsync: getDocumentAsyncMock,
}))

vi.mock('expo-file-system', () => ({
  getInfoAsync: getInfoAsyncMock,
  readAsStringAsync: readAsStringAsyncMock,
}))

describe.skip('ResumeUploadModal', () => {
  // TODO(REQ-172): Re-enable once the Expo/Tamagui stack is mocked well enough for Vitest.
  beforeEach(() => {
    uploadMutateAsync.mockReset().mockResolvedValue({
      resumeId: 'resume-123',
      filePath: 'resumes/resume-123.pdf',
    })
    parseMutateAsync.mockReset().mockResolvedValue({
      success: true,
      parsedData: {},
      errors: [],
    })
    invalidateHasUploaded.mockReset()
    toastShow.mockReset()
    getDocumentAsyncMock.mockReset()
    getInfoAsyncMock.mockReset()
    readAsStringAsyncMock.mockReset()
  })

  it('uploads selected resume and triggers parsing', async () => {
    const { ResumeUploadModal } = await import('../ResumeUploadModal.tsx')

    const onUploadComplete = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <ResumeUploadModal open onOpenChange={onOpenChange} onUploadComplete={onUploadComplete} />
    )

    await userEvent.click(screen.getByTestId('mock-file-upload'))

    await waitFor(() => {
      expect(uploadMutateAsync).toHaveBeenCalledTimes(1)
    })

    const uploadPayload = uploadMutateAsync.mock.calls[0]?.[0]
    expect(uploadPayload).toMatchObject({
      fileName: 'resume.pdf',
      mimeType: 'application/pdf',
      fileSize: expect.any(Number),
      fileData: expect.stringContaining('data:application/pdf;base64,'),
    })

    await waitFor(() => {
      expect(parseMutateAsync).toHaveBeenCalledWith({
        resumeId: 'resume-123',
        sections: ['general', 'experience', 'education', 'skills', 'certifications', 'employment'],
      })
    })

    expect(invalidateHasUploaded).toHaveBeenCalled()
    expect(toastShow).toHaveBeenCalledWith('Resume Imported', expect.any(Object))
    expect(onUploadComplete).toHaveBeenCalledWith('resume-123')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
