import { Row, SegmentedControl, Stack, Text, useResponsive, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { ReactNode } from 'react'

/**
 * One inquiry term, on a hairline (#837).
 *
 * An inquiry is a list of terms, each of which is either open to negotiation
 * or not — and that flag is the whole point of the instrument. It was drawn
 * three different ways: the compose form put an inverted "Non-negotiable"
 * checkbox *under* each control (so ticking a box meant clearing a field
 * called `negotiable`), while the employer and candidate views each had their
 * own `Non-negotiable` badge that appeared only in the fixed case — meaning a
 * negotiable term and a term whose flag had never been set looked identical.
 *
 * One row for all three. The flag reads as a two-state control rather than an
 * inverted tickbox, and it says something in both states.
 */

const NEGOTIABLE_SEGMENTS = ['Negotiable', 'Fixed']

export interface InquiryFieldRowProps {
  label: string
  /** Read mode: the term itself. Ignored when `children` is given. */
  value?: ReactNode
  /** Edit mode: the control that sets the term. */
  children?: ReactNode
  /**
   * The negotiable flag. Omit for a term that has none (a note, a yes/no
   * capability). `onChange` omitted renders it read-only.
   */
  negotiable?: { value: boolean; onChange?: (next: boolean) => void }
  /** Trailing marker on the label — "Auto-filled". */
  badge?: ReactNode
  /** One quiet line under the control. */
  hint?: ReactNode
  /** Validation message, shown in place of the hint. */
  error?: string
  /** Suppress the hairline — for the last row in a section. */
  last?: boolean
}

export function InquiryFieldRow({
  label,
  value,
  children,
  negotiable,
  badge,
  hint,
  error,
  last = false,
}: InquiryFieldRowProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const { isMobile } = useResponsive()

  const labelBlock = (
    <Row gap={8} align="center" style={isMobile ? undefined : LABEL_COLUMN}>
      <Text style={{ color: colors.text[t].secondary }}>{label}</Text>
      {badge}
    </Row>
  )

  const content = children ?? (
    <Text style={{ color: value ? colors.text[t].primary : colors.text[t].tertiary }}>
      {value || 'Not specified'}
    </Text>
  )

  const flag = negotiable ? (
    negotiable.onChange ? (
      <SegmentedControl
        segments={NEGOTIABLE_SEGMENTS}
        selectedIndex={negotiable.value ? 0 : 1}
        onSelectionChange={(index) => negotiable.onChange?.(index === 0)}
        // Segments are `flex: 1` inside an `overflow: hidden` track, so in a
        // row that runs out of room the labels are silently cut off.
        style={FLAG_CONTROL}
      />
    ) : (
      <Text
        style={{
          color: negotiable.value ? colors.text[t].tertiary : colors.text[t].secondary,
        }}
      >
        {negotiable.value ? 'Negotiable' : 'Fixed'}
      </Text>
    )
  ) : null

  const footnote = error ? (
    <Text style={{ color: colors.fg[t].error }}>{error}</Text>
  ) : hint ? (
    <Text style={{ color: colors.text[t].tertiary }}>{hint}</Text>
  ) : null

  return (
    <Stack
      gap={8}
      paddingVertical={12}
      style={
        last ? undefined : { borderBottomWidth: 1, borderBottomColor: colors.border[t].default }
      }
    >
      {isMobile ? (
        <Stack gap={8}>
          <Row justify="space-between" align="center" gap={8}>
            {labelBlock}
            {flag}
          </Row>
          {content}
          {footnote}
        </Stack>
      ) : (
        <Row gap={16} align="flex-start">
          {labelBlock}
          <Stack gap={4} style={CONTENT_COLUMN}>
            {content}
            {footnote}
          </Stack>
          {flag}
        </Row>
      )}
    </Stack>
  )
}

/**
 * A fixed label column is what makes a list of rows read as a list rather than
 * as ragged pairs — the values line up down the page.
 */
const LABEL_COLUMN = { width: 190, flexShrink: 0 } as const
/** `flexShrink` defaults to 0 in React Native, so long values need this to wrap. */
const CONTENT_COLUMN = { flex: 1, minWidth: 0 } as const
const FLAG_CONTROL = { flexShrink: 0, minWidth: 176 } as const
