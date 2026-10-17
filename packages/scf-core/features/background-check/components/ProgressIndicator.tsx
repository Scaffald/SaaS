import { memo } from 'react'
import { View } from 'react-native'
import { Text, Row, useResponsive, useThemeContext } from '@scaffald/ui'
import { colors, fontSize } from '@scaffald/ui/tokens'

import type { BackgroundCheckWizardStep } from '../hooks/useBackgroundCheckForm'
import { STEP_LABELS, stepNumber } from '../wizard-steps'

interface ProgressIndicatorProps {
  steps: BackgroundCheckWizardStep[]
  currentStep: BackgroundCheckWizardStep
}

/**
 * Numbered tabs on a hairline, the current one underlined (#1191).
 *
 * This was a row of filled circles — teal for the current step, green for
 * done, grey for ahead — with every label but the current one in link teal,
 * so the steps you could not go to looked like the ones you could. The
 * prototype's stepper is text: a number, a name, and one accent rule under
 * where you are. Teal, because "you are here" is interaction (.radium
 * accent rule, #983).
 */
export const ProgressIndicator = memo(function ProgressIndicator({
  steps,
  currentStep,
}: ProgressIndicatorProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const { width } = useResponsive()
  // Five names do not fit across a phone; there only the current step is
  // named and the rest keep their number.
  const compact = width > 0 && width < 640
  const currentIndex = steps.indexOf(currentStep)

  return (
    <Row
      accessibilityRole="list"
      style={{ borderBottomWidth: 1, borderBottomColor: colors.border[t].default }}
    >
      {steps.map((step, index) => {
        const isActive = index === currentIndex
        const isDone = index < currentIndex
        const tone = isActive
          ? colors.text[t].emphasis
          : isDone
            ? colors.text[t].secondary
            : colors.text[t].tertiary
        const showLabel = !compact || isActive

        return (
          <View
            key={step}
            accessibilityRole="text"
            accessibilityLabel={`Step ${index + 1} of ${steps.length}: ${STEP_LABELS[step]}${isActive ? ', current' : isDone ? ', done' : ''}`}
            style={{
              flexGrow: showLabel ? 1 : 0,
              flexShrink: 1,
              flexBasis: showLabel ? 0 : 'auto',
              minWidth: 0,
              paddingTop: 4,
              paddingBottom: 10,
              paddingHorizontal: 6,
              gap: 2,
              // The underline sits on the row's hairline rather than above it.
              marginBottom: -1,
              borderBottomWidth: 2,
              borderBottomColor: isActive ? colors.border[t].selected : 'transparent',
            }}
          >
            <Text style={{ fontSize: fontSize.xs, color: tone }}>{stepNumber(index)}</Text>
            {showLabel ? (
              <Text numberOfLines={1} style={{ color: tone }}>
                {STEP_LABELS[step]}
              </Text>
            ) : null}
          </View>
        )
      })}
    </Row>
  )
})
