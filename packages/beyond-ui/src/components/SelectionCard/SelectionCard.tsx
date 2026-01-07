/**
 * SelectionCard component
 * Clickable card with embedded selection controls (Checkbox, Radio, or Toggle)
 *
 * @example
 * ```tsx
 * import { SelectionCard } from '@unicornlove/beyond-ui'
 *
 * // Basic checkbox card
 * <SelectionCard
 *   type="checkbox"
 *   title="Express Shipping"
 *   description="Fast shipping for additional $29"
 *   selected={isSelected}
 *   onChange={setIsSelected}
 * />
 *
 * // Radio card with custom icon
 * <SelectionCard
 *   type="radio"
 *   title="Standard Shipping"
 *   description="Delivery in 5-7 business days"
 *   selected={selectedOption === 'standard'}
 *   onChange={() => setSelectedOption('standard')}
 *   icon={TruckIcon}
 * />
 *
 * // Toggle card with avatar
 * <SelectionCard
 *   type="toggle"
 *   title="Enable Notifications"
 *   leadingContent={<Avatar />}
 *   selected={notificationsEnabled}
 *   onChange={setNotificationsEnabled}
 * />
 * ```
 */

import { useState } from 'react'
import { View, Pressable, Text, StyleSheet } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import type { SelectionCardProps } from './SelectionCard.types'
import { Checkbox } from '../Checkbox'
import { Radio } from '../Radio'
import { Toggle } from '../Toggle'
import { useThemeContext } from '../../playground/ThemeProvider'

export function SelectionCard({
  type = 'checkbox',
  selected = false,
  onChange,
  disabled = false,
  title,
  description,
  showDescription = true,
  leadingContent,
  leadingType = 'featured-icon',
  icon: Icon,
  style,
  titleStyle,
  descriptionStyle,
  size = 'md',
  color = 'primary',
}: SelectionCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const { theme } = useThemeContext()

  const isLight = theme === 'light'

  const handlePress = () => {
    if (disabled) return
    onChange?.(!selected)
  }

  // Determine card state for styling
  const getCardStyles = () => {
    const baseStyles = [styles.card]

    // Background color
    if (isLight) {
      if (isHovered && !disabled) {
        baseStyles.push({ backgroundColor: colors.bg.light.hover })
      } else {
        baseStyles.push({ backgroundColor: colors.bg.light.default })
      }
    } else {
      if (isHovered && !disabled) {
        baseStyles.push({ backgroundColor: colors.bg.dark.hover })
      } else {
        baseStyles.push({ backgroundColor: colors.bg.dark.default })
      }
    }

    // Border color
    if (isFocused && !disabled) {
      baseStyles.push({
        borderColor: isLight ? colors.foreground.light['01'] : colors.foreground.dark['01'],
        borderWidth: 1,
      })
      // Focus ring
      baseStyles.push(styles.focusRing)
    } else if (selected && !disabled) {
      baseStyles.push({
        borderColor: isLight ? colors.foreground.light['04'] : colors.foreground.dark['04'],
        borderWidth: 1,
      })
    } else if (isHovered && !disabled) {
      baseStyles.push({
        borderColor: isLight ? colors.border.light['100'] : colors.border.dark['100'],
        borderWidth: 1,
      })
    } else {
      baseStyles.push({
        borderColor: isLight ? colors.border.light['200'] : colors.border.dark['200'],
        borderWidth: 1,
      })
    }

    // Disabled state
    if (disabled) {
      baseStyles.push({
        opacity: 0.4,
        borderColor: isLight ? colors.border.light['100'] : colors.border.dark['100'],
      })
    }

    return baseStyles
  }

  // Render leading content based on type or custom content
  const renderLeadingContent = () => {
    if (leadingContent) {
      return <View style={styles.leadingContent}>{leadingContent}</View>
    }

    // Default featured icon with delivery truck placeholder
    if (leadingType === 'featured-icon' && Icon) {
      return (
        <View style={styles.featuredIcon}>
          <Icon size={20} color={isLight ? colors.icon.light.default : colors.icon.dark.default} />
        </View>
      )
    }

    // Placeholder for other types
    return (
      <View style={styles.featuredIcon}>
        <View style={styles.iconPlaceholder} />
      </View>
    )
  }

  // Render the appropriate selection control
  const renderSelectionControl = () => {
    const controlProps = {
      checked: selected,
      onChange,
      disabled,
      size,
      color,
    }

    switch (type) {
      case 'radio':
        return <Radio {...controlProps} />
      case 'toggle':
        return <Toggle {...controlProps} />
      case 'checkbox':
      default:
        return <Checkbox {...controlProps} />
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={[...getCardStyles(), style]}
      {...(Platform.OS === 'web' && {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      })}
    >
      <View style={styles.content}>
        {/* Leading content */}
        {renderLeadingContent()}

        {/* Text content */}
        <View style={styles.textContent}>
          <Text
            style={[
              styles.title,
              { color: isLight ? colors.text.light.primary : colors.text.dark.primary },
              titleStyle,
            ]}
          >
            {title}
          </Text>
          {showDescription && description && (
            <Text
              style={[
                styles.description,
                { color: isLight ? colors.text.light.secondary : colors.text.dark.secondary },
                descriptionStyle,
              ]}
            >
              {description}
            </Text>
          )}
        </View>

        {/* Selection control */}
        <View style={styles.controlContainer}>{renderSelectionControl()}</View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.l,
    padding: spacing[16],
    borderWidth: 1,
    minHeight: 78,
  },
  focusRing: {
    shadowColor: colors.icon.light['300'],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[10],
  },
  leadingContent: {
    flexShrink: 0,
  },
  featuredIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.max,
    backgroundColor: colors.bg.light['50'],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.icon.light['100'],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  iconPlaceholder: {
    width: 20,
    height: 20,
    backgroundColor: colors.gray[400],
    borderRadius: borderRadius.xs,
  },
  textContent: {
    flex: 1,
    gap: spacing[2],
  },
  title: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.body.lineHeight,
  },
  description: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  controlContainer: {
    flexShrink: 0,
  },
})

