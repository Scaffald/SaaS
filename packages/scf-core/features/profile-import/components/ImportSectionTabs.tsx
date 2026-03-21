import { memo } from "react";
import { Tabs, Row, useThemeContext } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";

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
  const { theme } = useThemeContext();
  return (
    <Row
      gap={12}
      paddingHorizontal={8}
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.border[theme].default,
        backgroundColor: colors.bg[theme].default,
      }}
    >
      <Tabs value={activeSection} onValueChange={onSectionChange}>
        {sections.map((section) => (
          <Tabs.Item key={section.id} value={section.id}>
            <Tabs.Trigger
              containerStyle={{
                borderBottomWidth: activeSection === section.id ? 2 : 0,
                borderBottomColor: colors.info[600],
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
