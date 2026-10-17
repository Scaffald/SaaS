import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CheckStatusDashboard } from '../CheckStatusDashboard'

const checks = vi.hoisted(() => ({
  current: { data: [] as unknown[], isLoading: false, isError: false, refetch: () => {} },
}))

vi.mock('@scf/core/utils/background-checks-sdk-hooks', () => ({
  useBackgroundChecks: () => checks.current,
}))

vi.mock('../CheckStatusCard', () => ({ CheckStatusCard: () => null }))
vi.mock('../ResultsViewer', () => ({ ResultsViewer: () => null }))
vi.mock('../DisputeBackgroundCheckDialog', () => ({ DisputeBackgroundCheckDialog: () => null }))

describe('CheckStatusDashboard (#1192)', () => {
  beforeEach(() => {
    checks.current = { data: [], isLoading: false, isError: false, refetch: () => {} }
  })

  it('shows one empty state and no status strip when there are no checks', () => {
    // The shared @scaffald/ui test mock renders EmptyState as a stub carrying
    // its props, so read them off it.
    const { container } = render(<CheckStatusDashboard />)
    const empty = container.querySelector('[title="No background check yet"]')
    expect(empty).toBeTruthy()
    expect(empty?.getAttribute('action')).toBeTruthy()
    expect(screen.queryByText('Active')).toBeNull()
    expect(screen.queryByText('Expired')).toBeNull()
    expect(screen.queryByText(/0 checks/)).toBeNull()
  })

  it('keeps the status strip once there is a check to partition', () => {
    checks.current = {
      data: [{ id: 'c1', status: 'pending', created_at: '2026-10-01T00:00:00Z' }],
      isLoading: false,
      isError: false,
      refetch: () => {},
    }
    const { container } = render(<CheckStatusDashboard />)
    expect(container.querySelector('[title="No background check yet"]')).toBeNull()
    expect(screen.getByText('1 check')).toBeTruthy()
  })
})
