import { Fragment } from "react";
import { Spinner, Text, Row, Stack, useThemeContext } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";

import type {
  ResumeMergeStrategy,
  ResumeWizardSection,
} from "../hooks/useResumeWizard";

interface MergeComparisonRow {
  id: ResumeWizardSection;
  label: string;
  strategy: ResumeMergeStrategy;
  existingItems: string[];
  incomingItems: string[];
  hasIncoming: boolean;
  notes?: string;
}

interface MergeComparisonViewProps {
  sections: MergeComparisonRow[];
  isLoading?: boolean;
}

const STRATEGY_LABELS: Record<ResumeMergeStrategy, string> = {
  replace: "Replace existing data",
  append: "Append to existing data",
  keepExisting: "Keep existing data",
};

export function MergeComparisonView({
  sections,
  isLoading = false,
}: MergeComparisonViewProps) {
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light";
  if (isLoading) {
    return (
      <Row gap={8} align="center">
        <Spinner variant="ios" size="sm" />
        <Text color={colors.text[t].secondary}>Loading current profile data…</Text>
      </Row>
    );
  }

  if (sections.length === 0) {
    return (
      <Stack gap={8}>
        <Text>Nothing to review</Text>
        <Text color={colors.text[t].secondary}>
          We didn't detect any changes to compare. You can still finish the
          wizard to exit.
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap={12}>
      {sections.map((section) => (
        <Stack
          key={section.id}
          gap={12}
          padding="sm"
          borderWidth={1}
          borderColor={colors.border[t].default}
          backgroundColor={colors.bg[t].muted}
          borderRadius={16}
        >
          <Row justify="space-between" align="center" gap={8} wrap>
            <Text>{section.label}</Text>
            <StrategyPill strategy={section.strategy} />
          </Row>

          {section.notes ? <Text color={colors.text[t].secondary}>{section.notes}</Text> : null}

          <Row gap={16} wrap>
            <SummaryColumn
              title="Current profile"
              items={section.existingItems}
            />
            <SummaryColumn
              title="Incoming from resume"
              items={section.incomingItems}
              highlight={section.hasIncoming}
            />
          </Row>
        </Stack>
      ))}
    </Stack>
  );
}

function SummaryColumn({
  title,
  items,
  highlight = false,
}: {
  title: string;
  items: string[];
  highlight?: boolean;
}) {
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light";
  return (
    <Stack
      gap={8}
      flex={1}
      padding="xs"
      backgroundColor={highlight ? (t === 'dark' ? colors.blue[900] : colors.blue[100]) : "transparent"}
      borderRadius={12}
      style={{ minWidth: 220 }}
    >
      <Text>{title}</Text>
      {items.length === 0 ? (
        <Text color={colors.text[t].secondary}>No data</Text>
      ) : (
        items.map((item, index) => (
          <Fragment key={`${title}-${index}-${item}`}>
            <Text color={colors.text[t].secondary}>{item}</Text>
          </Fragment>
        ))
      )}
    </Stack>
  );
}

function StrategyPill({ strategy }: { strategy: ResumeMergeStrategy }) {
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light";
  return (
    <Stack
      paddingHorizontal={12}
      paddingVertical={4}
      borderRadius={12}
      backgroundColor={
        strategy === "replace"
          ? (t === 'dark' ? colors.error[900] : colors.error[100])
          : strategy === "append"
          ? (t === 'dark' ? colors.blue[900] : colors.blue[100])
          : colors.bg[t].muted
      }
    >
      <Text
        color={
          strategy === "replace"
            ? (t === 'dark' ? colors.error[300] : colors.error[600])
            : strategy === "append"
            ? (t === 'dark' ? colors.blue[300] : colors.blue[600])
            : colors.text[t].secondary
        }
      >
        {STRATEGY_LABELS[strategy]}
      </Text>
    </Stack>
  );
}
