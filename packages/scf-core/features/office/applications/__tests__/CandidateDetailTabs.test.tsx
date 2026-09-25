import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ThemeProvider } from '@scaffald/ui'
import { CandidateDetailTabs, type CandidateTab } from '../components/CandidateDetailTabs'

// The layout-only @scaffald/ui mock renders Tabs as plain divs, which is how
// #896 went unnoticed. Selection is the behaviour under test, so use the real one.
vi.mock('@scaffald/ui', async (importOriginal) => {
  const theme = await import('../../../../../ui/src/theme')
  const tabs = await import('../../../../../ui/src/components/Tabs')
  return {
    ...(await importOriginal<object>()),
    ThemeProvider: theme.ThemeProvider,
    useThemeContext: theme.useThemeContext,
    Tabs: tabs.Tabs,
  }
})

const TABS: ReadonlyArray<{ value: CandidateTab; label: string }> = [
  { value: 'profile', label: 'Profile' },
  { value: 'application', label: 'Application' },
  { value: 'notes', label: 'Notes' },
  { value: 'messages', label: 'Messages' },
  { value: 'activity', label: 'Activity' },
  { value: 'inquiry', label: 'Inquiry' },
]

const Harness = () => {
  const [value, setValue] = useState<CandidateTab>('profile')
  return (
    <CandidateDetailTabs
      value={value}
      onValueChange={setValue}
      tabs={TABS.map((tab) => ({ ...tab, panel: <span>{`${tab.value} panel`}</span> }))}
    />
  )
}

describe('CandidateDetailTabs', () => {
  it('renders the default tab panel on mount', () => {
    render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>,
    )
    expect(screen.getByText('profile panel')).toBeTruthy()
  })

  it.each(TABS)('selecting $label renders its panel and only its panel', ({ value, label }) => {
    render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>,
    )
    fireEvent.click(screen.getByText(label))

    expect(screen.getByText(`${value} panel`)).toBeTruthy()
    for (const other of TABS.filter((tab) => tab.value !== value)) {
      expect(screen.queryByText(`${other.value} panel`)).toBeNull()
    }
  })
})
