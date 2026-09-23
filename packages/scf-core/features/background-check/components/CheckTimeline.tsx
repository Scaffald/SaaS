import { Check, Circle, Dot } from 'lucide-react-native'
import { View } from 'react-native'
import { Row, Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

import { buildCheckTimeline, timelineSummary } from './check-timeline'
import type { BackgroundCheckStatus } from './status.utils'

/**
 * Where a background check stands, as the four steps it actually has.
 *
 * The status was a coloured pill and a percentage bar — "Partially Completed
 * 80%" — which tells someone waiting on a screening neither what has
 * happened nor what happens next. A vertical timeline says both, and the
 * wait sits on the step that is actually waiting.
 */
export function CheckTimeline({ status }: { status: BackgroundCheckStatus }) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const steps = buildCheckTimeline(status)
  const summary = timelineSummary(status)

  const summaryColor =
    summary.tone === 'attention'
      ? colors.text[t].attention
      : summary.tone === 'active'
        ? colors.text[t].emphasis
        : colors.text[t].secondary

  return (
    <Stack gap={12}>
      <Stack>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1
          const Icon = step.state === 'done' ? Check : step.state === 'current' ? Circle : Dot
          const markColor =
            step.state === 'done'
              ? colors.fg[t].success
              : step.state === 'current'
                ? colors.text[t].emphasis
                : colors.text[t].tertiary

          return (
            <Row key={step.id} gap={12} align="flex-start">
              {/* The rail: a mark, and a line down to the next step. The line
                  is drawn by the row above rather than between rows, so the
                  last step has no tail hanging off the bottom. */}
              <Stack align="center" width={20}>
                <Icon size={18} color={markColor} />
                {!isLast ? (
                  <View
                    style={{
                      width: 1,
                      flex: 1,
                      minHeight: 18,
                      backgroundColor:
                        step.state === 'done' ? colors.fg[t].success : colors.border[t].default,
                    }}
                  />
                ) : null}
              </Stack>

              <Stack gap={2} flex={1} minWidth={0} paddingBottom={isLast ? 0 : 12}>
                <Text
                  style={{
                    color:
                      step.state === 'upcoming' ? colors.text[t].tertiary : colors.text[t].primary,
                  }}
                >
                  {step.label}
                </Text>
                <Text style={{ color: colors.text[t].secondary }}>{step.hint}</Text>
              </Stack>
            </Row>
          )
        })}
      </Stack>

      <Stack gap={2}>
        <Text style={{ color: summaryColor }}>{summary.label}</Text>
        {summary.detail ? (
          <Text style={{ color: colors.text[t].secondary }}>{summary.detail}</Text>
        ) : null}
      </Stack>
    </Stack>
  )
}
