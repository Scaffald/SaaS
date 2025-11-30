import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'

import type { DisputeAttachment, DisputeFormValues } from '../../hooks/useDispute'
import { DisputeForm } from '../DisputeForm'

const uploadMocks = vi.hoisted(() => ({
  triggerSelect: vi.fn(),
  triggerError: vi.fn(),
}))

'@scaffald/tamagui-ui', () => ({
  UploadSurface: ({
    children,
    onSelect,
    onError,
    disabled,
  }: {
    children: (props: {
      open: () => void
      getRootProps: () => Record<string, unknown>
      getInputProps: () => Record<string, unknown>
      isDragActive: boolean
      isDragReject: boolean
      isProcessing: boolean
    }) => ReactNode
    onSelect?: (selection: { platform: 'web'; file: File }) => Promise<void> | void
    onError?: (message: string) => void
    disabled?: boolean
  }) => (
    <div data-testid="upload-surface" data-disabled={disabled}>
      <button
        type="button"
        onClick={() => {
          uploadMocks.triggerError()
          onError?.('Mock upload error')
        }}
      >
        upload-error
      </button>
      <button
        type="button"
        onClick={() => {
          const file = new File(['test'], 'mock.pdf', { type: 'application/pdf' })
          uploadMocks.triggerSelect()
          void onSelect?.({ platform: 'web', file })
        }}
      >
        upload-select
      </button>
      {children({
        open: vi.fn(),
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: false,
        isDragReject: false,
        isProcessing: false,
      })}
    </div>
  ),
}))

const reasonOptions = [
  { value: 'incorrect_records', label: 'Records contain inaccurate findings' },
  { value: 'other', label: 'Something else (describe below)' },
] as const

function createForm(values?: Partial<DisputeFormValues>) {
  const { result } = renderHook(() =>
    useForm<DisputeFormValues>({
      defaultValues: {
        reason: '',
        details: '',
        otherReason: '',
        ...values,
      },
    })
  )

  return result
}

describe('DisputeForm', () => {
  it('shows active dispute alert and disables submit button', () => {
    const formResult = createForm()

    render(
      <DisputeForm
        form={formResult.current}
        reasonOptions={reasonOptions}
        attachments={[]}
        onSelectAttachment={vi.fn()}
        onRemoveAttachment={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting={false}
        isUploading={false}
        attachmentError={null}
        submissionError={null}
        hasActiveDispute
      />
    )

    expect(screen.getByText(/Dispute already in review/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Submit dispute/i })).toBeDisabled()
  })

  it('renders additional reason field when "other" is selected', () => {
    const formResult = createForm({ reason: 'other' })

    render(
      <DisputeForm
        form={formResult.current}
        reasonOptions={reasonOptions}
        attachments={[]}
        onSelectAttachment={vi.fn()}
        onRemoveAttachment={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting={false}
        isUploading={false}
        attachmentError={null}
        submissionError={null}
        hasActiveDispute={false}
      />
    )

    expect(screen.getByLabelText(/Describe the issue/i)).toBeInTheDocument()
  })

  it('renders attachments and triggers submit handler', async () => {
    const formResult = createForm()
    const handleSubmit = vi.fn().mockResolvedValue(true)
    const handleRemove = vi.fn()
    const attachments: DisputeAttachment[] = [
      {
        id: 'attachment-1',
        name: 'evidence.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        documentType: 'dispute_supporting_1',
        source: { kind: 'web', file: new File(['1'], 'evidence.pdf', { type: 'application/pdf' }) },
      },
    ]

    await act(async () => {
      formResult.current.setValue('reason', 'incorrect_records' as never)
      formResult.current.setValue(
        'details',
        'Automated test summary describing inaccurate findings.'
      )
    })

    render(
      <DisputeForm
        form={formResult.current}
        reasonOptions={reasonOptions}
        attachments={attachments}
        onSelectAttachment={vi.fn()}
        onRemoveAttachment={handleRemove}
        onSubmit={handleSubmit}
        isSubmitting={false}
        isUploading={false}
        attachmentError={null}
        submissionError={null}
        hasActiveDispute={false}
      />
    )

    expect(screen.getByText(/evidence\.pdf/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Remove/i }))
    expect(handleRemove).toHaveBeenCalledWith('attachment-1')

    fireEvent.click(screen.getByRole('button', { name: /Submit dispute/i }))
    expect(handleSubmit).toHaveBeenCalledTimes(1)
  })
})
