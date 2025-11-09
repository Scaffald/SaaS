import { memo } from 'react'
import { Tabs, XStack } from 'tamagui'

export interface ImportSectionTab {
  id: string
  label: string
  count: number
}

interface ImportSectionTabsProps {
  sections: ImportSectionTab[]
  activeSection: string
  onSectionChange: (sectionId: string) => void
}

export const ImportSectionTabs = memo(function ImportSectionTabs({
  sections,
  activeSection,
  onSectionChange,
}: ImportSectionTabsProps) {
  return (
    <Tabs value={activeSection} onValueChange={onSectionChange} activationMode="manual">
      <Tabs.List
        orientation="horizontal"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
        backgroundColor="$background"
        scrollable
      >
        <XStack gap="$3" px="$2">
          {sections.map((section) => (
            <Tabs.Tab
              key={section.id}
              value={section.id}
              borderBottomWidth={activeSection === section.id ? 2 : 0}
              borderBottomColor="$blue10"
              px="$3"
              py="$2"
            >
              {section.label} ({section.count})
            </Tabs.Tab>
          ))}
        </XStack>
      </Tabs.List>
    </Tabs>
  )
})


