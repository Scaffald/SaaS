import { memo } from "react";
import { Tabs, Row } from "@scaffald/ui";

export interface ImportSectionTab {
  id: string;
  label: string;
  count: number;
}

interface ImportSectionTabsProps {
  sections: ImportSectionTab[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

export const ImportSectionTabs = memo(function ImportSectionTabs({
  sections,
  activeSection,
  onSectionChange,
}: ImportSectionTabsProps) {
  return (
    <Row
      gap={12}
      paddingHorizontal={8}
      style={{
        borderBottomWidth: 1,
        borderBottomColor: "#e4e7ec",
        backgroundColor: "#ffffff",
      }}
    >
      <Tabs value={activeSection} onValueChange={onSectionChange}>
        {sections.map((section) => (
          <Tabs.Item key={section.id} value={section.id}>
            <Tabs.Trigger
              containerStyle={{
                borderBottomWidth: activeSection === section.id ? 2 : 0,
                borderBottomColor: "#2563eb",
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              {section.label} ({section.count})
            </Tabs.Trigger>
          </Tabs.Item>
        ))}
      </Tabs>
    </Row>
  );
});
