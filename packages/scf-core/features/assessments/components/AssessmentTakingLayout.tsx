import type { ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Row, Stack, Text, useBottomBarContext, useThemeContext } from '@scaffald/ui'
import { colors, fontSize, fontWeight, lineHeight } from '@scaffald/ui/tokens'
import { CONTENT_WIDTH, useScreenRhythm } from '@scf/core/constants/layout'
import { useFocusMode } from '@scf/core/features/drawer/focus-mode'

export interface AssessmentTakingLayoutProps {
  /** The assessment, as a kicker: "Work personality — Big Five". */
  kicker: string
  /** Where the worker is: "Question 3 of 120". On the kicker's hairline. */
  counter?: string
  /** One italic line on how to answer. */
  instruction?: string
  children: ReactNode
  /** Leave the test. Required: every taking screen has a way out (#1194). */
  onExit: () => void
  /**
   * "Save & exit" where answers save as they are given; plain "Exit" where
   * leaving would drop them. The label says which.
   */
  exitLabel?: string
  /** The footer's right-hand side — the step's own forward action, if any. */
  footerEnd?: ReactNode
}

/**
 * The focus layout for taking an assessment (#1194).
 *
 * Every taking screen kept the section's six folder tabs, a breadcrumb, a
 * kicker, a title with a collapse caret, a tip and a rail of description,
 * progress and domains — three progress indicators around one question, and
 * six tabs inviting the worker to leave mid-test without saying whether
 * their answers would keep. The prototype's taking screens are one column:
 * a kicker with the counter on its hairline, an italic instruction, the
 * item, the answers, and a footer with Save & exit.
 *
 * Holding focus mode hides the shell's section tabs while this is mounted.
 */
export function AssessmentTakingLayout({
  kicker,
  counter,
  instruction,
  children,
  onExit,
  exitLabel = 'Save & exit',
  footerEnd,
}: AssessmentTakingLayoutProps) {
  useFocusMode()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const insets = useSafeAreaInsets()
  const { navBarHeight } = useBottomBarContext()
  const { gutter, verticalPadding } = useScreenRhythm()
  const bottomNavInset = navBarHeight > 0 ? navBarHeight + insets.bottom : 0

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg[t].subtle }}
      showsVerticalScrollIndicator={false}
    >
      <Stack
        gap={24}
        paddingTop={verticalPadding}
        paddingBottom={verticalPadding + bottomNavInset}
        paddingHorizontal={gutter}
        style={{
          width: '100%',
          maxWidth: CONTENT_WIDTH.reading + gutter * 2,
          alignSelf: 'center',
        }}
      >
        <Row
          justify="space-between"
          align="flex-end"
          gap={12}
          wrap
          paddingBottom={12}
          style={{ borderBottomWidth: 1, borderBottomColor: colors.border[t].default }}
        >
          {/* The page's heading: with no title on a taking screen, the
              assessment's name is what the page is (react-native-web renders
              a header role as <h1>). Styled as the kicker it reads as. */}
          <Text
            accessibilityRole="header"
            style={{
              fontSize: fontSize.h6,
              lineHeight: lineHeight.h6,
              fontWeight: fontWeight.medium,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              color: colors.text[t].attention,
            }}
          >
            {kicker}
          </Text>
          {counter ? (
            <Text style={{ fontSize: fontSize.sm, color: colors.text[t].secondary }}>
              {counter}
            </Text>
          ) : null}
        </Row>

        {instruction ? (
          <Text style={{ fontStyle: 'italic', color: colors.text[t].secondary }}>
            {instruction}
          </Text>
        ) : null}

        <Stack gap={16}>{children}</Stack>

        <Row justify="space-between" align="center" gap={12} wrap>
          <Button size="md" variant="text" color="primary" onPress={onExit}>
            {exitLabel}
          </Button>
          {footerEnd}
        </Row>
      </Stack>
    </ScrollView>
  )
}
