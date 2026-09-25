import type { ReactNode } from 'react'
import { Stack, Tabs, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

export type CandidateTab = 'profile' | 'application' | 'notes' | 'messages' | 'activity' | 'inquiry'

export interface CandidateDetailTabsProps {
  value: CandidateTab
  onValueChange: (value: CandidateTab) => void
  tabs: ReadonlyArray<{ value: CandidateTab; label: string; panel: ReactNode }>
}

/**
 * The strip sits on its own tinted background, so the panel is rendered here
 * rather than as a `Tabs.Content`: `@scaffald/ui` only shows a `Tabs.Content`
 * nested in a `Tabs.Item`, and a bare one silently renders nothing.
 */
export const CandidateDetailTabs = ({ value, onValueChange, tabs }: CandidateDetailTabsProps) => {
  const { theme } = useThemeContext()
  const active = tabs.find((tab) => tab.value === value)

  return (
    <>
      <Stack
        gap={8}
        style={{ backgroundColor: colors.bg[theme].subtle }}
        padding={4}
        borderRadius={12}
      >
        <Tabs value={value} onValueChange={(next) => onValueChange(next as CandidateTab)}>
          {tabs.map((tab) => (
            <Tabs.Item key={tab.value} value={tab.value}>
              <Tabs.Trigger containerStyle={{ flex: 1 }}>{tab.label}</Tabs.Trigger>
            </Tabs.Item>
          ))}
        </Tabs>
      </Stack>

      {active ? <Stack paddingTop={16}>{active.panel}</Stack> : null}
    </>
  )
}
