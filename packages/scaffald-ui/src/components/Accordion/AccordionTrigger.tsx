/**
 * AccordionTrigger component
 * Clickable header for accordion items
 */

import { View, Pressable, Text, StyleSheet } from 'react-native'
import type { AccordionTriggerProps } from './Accordion.types'
import { useAccordionItemContext } from './AccordionItem'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { typography } from '../../tokens/typography'
import { useThemeContext } from '../../theme'
import { ChevronIcon } from './ChevronIcon'

export function AccordionTrigger({
  children,
  icon,
  hintMessage,
  hintIcon,
  hintColor,
  containerStyle,
  titleStyle,
  hintStyle,
}: AccordionTriggerProps) {
  const itemContext = useAccordionItemContext()
  const { theme } = useThemeContext()

  return (
    <Pressable
      {...itemContext.getTriggerProps()}
      style={({ pressed }) => [
        styles.trigger,
        {
          backgroundColor:
            itemContext.isHovered && !itemContext.disabled ? colors.bg[theme].subtle : 'transparent',
        },
        // Apply pressed effect
        pressed && !itemContext.disabled && { opacity: 0.8 },
        containerStyle,
      ]}
    >
      {/* Left side - Icon + Content */}
      <View style={styles.leftContainer}>
        {/* Optional icon */}
        {icon && <View style={styles.iconContainer}>{icon}</View>}

        {/* Content - Title + Hint */}
        <View style={styles.contentContainer}>
          {/* Title */}
          <Text
            style={[
              styles.title,
              {
                color: itemContext.disabled
                  ? colors.text[theme].disabled
                  : colors.text[theme].primary,
              },
              titleStyle,
            ]}
          >
            {children}
          </Text>

          {/* Optional hint message */}
          {hintMessage && (
            <View style={styles.hintContainer}>
              {hintIcon && <View style={styles.hintIconContainer}>{hintIcon}</View>}
              <Text
                style={[
                  styles.hintText,
                  {
                    color: hintColor || colors.text[theme].tertiary,
                  },
                  hintStyle,
                ]}
              >
                {hintMessage}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Right side - Chevron */}
      <ChevronIcon
        expanded={itemContext.isExpanded}
        color={itemContext.disabled ? colors.text[theme].disabled : colors.text[theme].secondary}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginHorizontal: -spacing[16], // Negative margin to extend to edges
    marginVertical: -spacing[10],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[10],
    borderRadius: 10, // Match parent border radius
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    flex: 1,
  },
  iconContainer: {
    width: 24,
    height: 24,
  },
  contentContainer: {
    flexDirection: 'column',
    gap: spacing[2],
    flex: 1,
  },
  title: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: typography.body.lineHeight,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[6],
    paddingVertical: spacing[2],
  },
  hintIconContainer: {
    width: 16,
    height: 16,
  },
  hintText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.small.lineHeight,
  },
})
