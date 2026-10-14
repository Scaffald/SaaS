import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { PackageSelectionStep } from '../PackageSelectionStep'

// The shared @scaffald/ui mock wires onPress on every Card. The real Card only
// does when `pressable` is set — without it the package cards ignored taps and
// nothing could be selected — so mirror that contract here.
vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@scaffald/ui')
  return {
    ...actual,
    Card: ({
      children,
      pressable,
      onPress,
    }: {
      children: ReactNode
      pressable?: boolean
      onPress?: () => void
    }) => (
      // biome-ignore lint/a11y/useKeyWithClickEvents: test stand-in for a Pressable
      <div onClick={pressable ? onPress : undefined}>{children}</div>
    ),
  }
})

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
      onContinue={vi.fn()}
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
    expect(screen.queryByText('Components')).toBeNull()
    expect(screen.queryByText(/coming soon/i)).toBeNull()
  })

  it('lists components when there are some', () => {
    renderStep([pkg({ components: [{ id: 'c1', display_name: 'SSN/Address Trace' }] })])
    expect(screen.getByText('Components')).toBeTruthy()
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
})
