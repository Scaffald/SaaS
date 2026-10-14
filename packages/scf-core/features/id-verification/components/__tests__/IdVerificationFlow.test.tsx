import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { IdVerificationContent, IdVerificationRight } from '../IdVerificationFlow'

const pricing = vi.hoisted(() => ({
  current: { data: [] as unknown[], isLoading: false },
}))

vi.mock('@scf/core/utils/id-verification-sdk-hooks', () => ({
  useIdVerificationPricing: () => pricing.current,
  useCurrentIdVerification: () => ({
    data: null,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useIdVerificationRequest: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useIdVerificationConfirm: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('@scf/core/utils/useUser', () => ({
  useUser: () => ({ user: { id: 'user-1' } }),
}))

vi.mock('@scf/core/features/payments/components/PaymentIntentForm', () => ({
  PaymentIntentForm: () => null,
}))

describe('IdVerificationFlow (#1110)', () => {
  beforeEach(() => {
    pricing.current = { data: [], isLoading: false }
  })

  it('shows one unavailable state and no payment path when pricing is missing', () => {
    render(
      <>
        <IdVerificationContent />
        <IdVerificationRight />
      </>
    )
    expect(screen.getByText('Verification temporarily unavailable')).toBeTruthy()
    expect(screen.queryByText('Continue to payment')).toBeNull()
    expect(screen.queryByText('Secure payment')).toBeNull()
    expect(screen.queryByText(/non-refundable/i)).toBeNull()
    expect(screen.queryByText('What happens after payment?')).toBeNull()
    expect(screen.queryByText(/Purchase a verification/)).toBeNull()
  })

  it('offers payment when pricing is published', () => {
    pricing.current = {
      data: [{ id: 'p1', name: 'Standard verification', priceCents: 2500 }],
      isLoading: false,
    }
    render(
      <>
        <IdVerificationContent />
        <IdVerificationRight />
      </>
    )
    expect(screen.queryByText('Verification temporarily unavailable')).toBeNull()
    expect(screen.getByText('Continue to payment')).toBeTruthy()
    expect(screen.getByText('What happens after payment?')).toBeTruthy()
    expect(screen.getByText(/Purchase a verification/)).toBeTruthy()
  })
})
