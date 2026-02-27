/**
 * SelectionCard component
 * Clickable card with embedded selection controls (Checkbox, Radio, or Toggle)
 *
 * @example
 * ```tsx
 * import { SelectionCard } from '@scaffald/ui'
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

import { useState, useMemo } from 'react'
import { View, Pressable, Text, StyleSheet, type ViewStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import type { SelectionCardProps } from './SelectionCard.types'
import { Checkbox } from '../Checkbox'
import type { CheckboxColor } from '../Checkbox'
import { Radio } from '../Radio'
import type { RadioColor } from '../Radio'
import { Toggle } from '../Toggle'
import { useThemeContext } from '../../theme'
import { useInteractiveState } from '../../hooks/useInteractiveState'

export function SelectionCard({
  type = 'checkbox',
  selected: selectedProp,
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
  expandedContent,
}: SelectionCardProps) {
  // Support both controlled and uncontrolled mode
  const [internalSelected, setInternalSelected] = useState(false)
  const isControlled = selectedProp !== undefined
  const selected = isControlled ? selectedProp : internalSelected

  const { theme } = useThemeContext()
  const { isHovered, isFocused, interactiveProps } = useInteractiveState(disabled)

  const isLight = theme === 'light'

  const handlePress = () => {
    if (disabled) return
    const newValue = !selected

    // Update internal state if uncontrolled
    if (!isControlled) {
      setInternalSelected(newValue)
    }

    // Always call onChange if provided
    onChange?.(newValue)
  }

  // Determine card state for styling (memoized for performance)
  const cardStyles = useMemo(() => {
    const baseStyles: ViewStyle[] = [styles.card]

    // Background color
    if (isLight) {
      if (isHovered && !disabled) {
        baseStyles.push({ backgroundColor: colors.bg.light.subtle })
      } else {
        baseStyles.push({ backgroundColor: colors.bg.light.default })
      }
    } else {
      if (isHovered && !disabled) {
        baseStyles.push({ backgroundColor: colors.bg.dark.subtle })
      } else {
        baseStyles.push({ backgroundColor: colors.bg.dark.default })
      }
    }

    // Border color
    if (isFocused && !disabled) {
      baseStyles.push({
        borderColor: isLight ? colors.gray[900] : colors.gray[100],
        borderWidth: 1,
      })
      // Focus ring
      baseStyles.push(styles.focusRing)
    } else if (selected && !disabled) {
      baseStyles.push({
        borderColor: isLight ? colors.gray[700] : colors.gray[300],
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
  }, [isLight, isHovered, disabled, isFocused, selected])

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
    // Map color to appropriate type for each control
    const checkboxColor: CheckboxColor =
      color === 'red-green' ? 'primary' : (color as CheckboxColor)
    const radioColor: RadioColor = color === 'red-green' ? 'primary' : (color as RadioColor)

    switch (type) {
      case 'radio':
        return (
          <Radio
            checked={selected}
            onChange={onChange}
            disabled={disabled}
            size={size}
            color={radioColor}
          />
        )
      case 'toggle':
        return (
          <Toggle
            checked={selected}
            onChange={onChange}
            disabled={disabled}
            size={size}
            color={color}
          />
        )
      default:
        return (
          <Checkbox
            checked={selected}
            onChange={onChange}
            disabled={disabled}
            size={size}
            color={checkboxColor}
          />
        )
    }
  }

  const showExpanded = selected && expandedContent

  return (
    <View style={style ? [styles.wrapper, style] : styles.wrapper}>
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={[
          ...cardStyles,
          ...(showExpanded
            ? [
                { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } as ViewStyle,
              ]
            : []),
        ]}
        {...interactiveProps}
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

      {/* Expanded content (ToggleCard-style: shown when selected) */}
      {showExpanded && (
        <View
          style={[
            styles.expandedContent,
            {
              backgroundColor: isLight ? colors.bg.light.default : colors.bg.dark.default,
              borderColor: isLight ? colors.border.light['200'] : colors.border.dark['200'],
            },
          ]}
        >
          {expandedContent}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  card: {
    borderRadius: borderRadius.l,
    padding: spacing[16],
    borderWidth: 1,
    minHeight: 78,
  },
  expandedContent: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: borderRadius.l,
    borderBottomRightRadius: borderRadius.l,
    padding: spacing[16],
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
