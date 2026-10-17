import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PackageSelectionStep } from '../PackageSelectionStep'

type Packages = Parameters<typeof PackageSelectionStep>[0]['packages']

const pkg = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'pkg-entry',
    display_name: 'Entry Level Package',
    description: 'Foundational screenings for new trade workers.',
    retail_cost_cents: 7500,
    platform_cost_cents: 5000,
    components: [],
    ...overrides,
  }) as unknown as NonNullable<Packages>[number]

const renderStep = (packages: Packages, selectedPackageId?: string) => {
  const onSelect = vi.fn()
  render(
    <PackageSelectionStep
      packages={packages}
      selectedPackageId={selectedPackageId}
      onSelect={onSelect}
      isLoading={false}
    />
  )
  return { onSelect }
}

describe('PackageSelectionStep (#1109)', () => {
  it('shows the retail price and never the internal platform cost', () => {
    renderStep([pkg()])
    expect(screen.getByText('$75.00')).toBeTruthy()
    expect(screen.queryByText(/platform cost/i)).toBeNull()
    expect(screen.queryByText('$50.00')).toBeNull()
  })

  it('hides the components block when the list is empty', () => {
    renderStep([pkg()])
    expect(screen.queryByText("What's checked")).toBeNull()
    expect(screen.queryByText(/coming soon/i)).toBeNull()
  })

  it('lists components when there are some', () => {
    renderStep([pkg({ components: [{ id: 'c1', display_name: 'SSN/Address Trace' }] })])
    expect(screen.getByText("What's checked")).toBeTruthy()
    expect(screen.getByText('• SSN/Address Trace')).toBeTruthy()
  })

  it('selects a package on press and marks the selected card', () => {
    const { onSelect } = renderStep([pkg()])
    expect(screen.queryByText('Selected')).toBeNull()
    fireEvent.click(screen.getByText('Entry Level Package'))
    expect(onSelect).toHaveBeenCalledWith('pkg-entry')
  })

  it('labels the selected card', () => {
    renderStep([pkg()], 'pkg-entry')
    expect(screen.getByText('Selected')).toBeTruthy()
  })

  // #1191: a radio affordance on every card, not just a tint on the chosen one.
  it('offers Select on every card and exposes radio state', () => {
    renderStep([pkg(), pkg({ id: 'pkg-exp', display_name: 'Experience Level Package' })], 'pkg-exp')
    expect(screen.getAllByText('Select')).toHaveLength(1)
    expect(screen.getAllByText('Selected')).toHaveLength(1)
    expect(screen.getAllByRole('radio')).toHaveLength(2)
    expect(screen.getByRole('radio', { name: /Experience Level Package.*selected/ })).toBeTruthy()
  })

  it('titles the step with a heading', () => {
    renderStep([pkg()])
    expect(screen.getByRole('heading', { name: 'Choose a package' })).toBeTruthy()
  })

  it('shows the provider turnaround as the card kicker when the catalog has one', () => {
    renderStep([pkg({ estimated_completion_days: 5 })])
    expect(screen.getByText('Usually 5 days')).toBeTruthy()
  })
})
