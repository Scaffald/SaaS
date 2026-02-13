import { memo } from 'react'
import { Tabs, Row } from '@unicornlove/beyond-ui'

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
        <Row gap={12} paddingHorizontal={8}>
          {sections.map((section) => (
            <Tabs.Tab
              key={section.id}
              value={section.id}
              borderBottomWidth={activeSection === section.id ? 2 : 0}
              borderBottomColor="$blue10"
              paddingHorizontal={12}
              paddingVertical={8}
            >
              {section.label} ({section.count})
            </Tabs.Tab>
          ))}
        </Row>
      </Tabs.List>
    </Tabs>
  )
})
