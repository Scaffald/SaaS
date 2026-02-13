/**
 * ButtonGroup component
 * Grouped buttons (segmented control) for multiple choice selections
 *
 * @example
 * ```tsx
 * import { ButtonGroup } from '@scaffald/ui'
 *
 * // Single selection
 * <ButtonGroup
 *   items={[
 *     { id: '1', label: 'Option 1' },
 *     { id: '2', label: 'Option 2' },
 *     { id: '3', label: 'Option 3' },
 *   ]}
 *   value={selected}
 *   onChange={setSelected}
 * />
 *
 * // Multiple selection
 * <ButtonGroup
 *   mode="multiple"
 *   items={items}
 *   value={selectedItems}
 *   onChange={setSelectedItems}
 * />
 *
 * // With icons
 * <ButtonGroup
 *   items={[
 *     { id: '1', label: 'Bold', icon: BoldIcon },
 *     { id: '2', label: 'Italic', icon: ItalicIcon },
 *   ]}
 * />
 * ```
 */

import { useState } from 'react'
import { View, Pressable, Text, StyleSheet } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import type { ButtonGroupProps, ButtonGroupItem } from './ButtonGroup.types'
import { useThemeContext } from '../../theme'

export function ButtonGroup({
  items,
  mode = 'single',
  size = 'md',
  orientation = 'horizontal',
  value: controlledValue,
  defaultValue,
  onChange,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonGroupProps) {
  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = useState<string | string[]>(
    defaultValue || (mode === 'single' ? '' : [])
  )

  // Use controlled value if provided, otherwise use internal state
  const value = controlledValue !== undefined ? controlledValue : internalValue
  const { theme } = useThemeContext()

  // Check if an item is selected
  const isSelected = (itemId: string): boolean => {
    if (mode === 'single') {
      return value === itemId
    }
    return Array.isArray(value) && value.includes(itemId)
  }

  // Handle item press
  const handlePress = (item: ButtonGroupItem) => {
    if (disabled || item.disabled) return

    let newValue: string | string[]

    if (mode === 'single') {
      newValue = item.id
    } else {
      const currentValue = Array.isArray(value) ? value : []
      if (currentValue.includes(item.id)) {
        newValue = currentValue.filter((id) => id !== item.id)
      } else {
        newValue = [...currentValue, item.id]
      }
    }

    // Update internal state if uncontrolled
    if (controlledValue === undefined) {
      setInternalValue(newValue)
    }

    // Call onChange handler
    onChange?.(newValue)
  }

  // Get button size configuration
  const sizeConfig = {
    xs: { height: 24, fontSize: 12, paddingHorizontal: spacing[8], iconSize: 16 },
    sm: { height: 32, fontSize: 14, paddingHorizontal: spacing[12], iconSize: 20 },
    md: { height: 40, fontSize: 16, paddingHorizontal: spacing[16], iconSize: 24 },
  }[size]

  return (
    <View
      style={[
        styles.container,
        orientation === 'horizontal' ? styles.horizontal : styles.vertical,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {items.map((item, index) => {
        const selected = isSelected(item.id)
        const isDisabled = disabled || item.disabled
        const isFirst = index === 0
        const isLast = index === items.length - 1

        return (
          <Pressable
            key={item.id}
            onPress={() => handlePress(item)}
            disabled={isDisabled}
            style={({ pressed }) => [
              styles.button,
              {
                height: sizeConfig.height,
                paddingHorizontal: item.label
                  ? sizeConfig.paddingHorizontal
                  : sizeConfig.height / 2,
                backgroundColor: selected ? colors.gray[100] : 'transparent',
                borderColor: colors.border[theme].default,
                borderWidth: 1,
                borderTopLeftRadius: isFirst ? borderRadius.s : 0,
                borderBottomLeftRadius: isFirst ? borderRadius.s : 0,
                borderTopRightRadius: isLast ? borderRadius.s : 0,
                borderBottomRightRadius: isLast ? borderRadius.s : 0,
                // Remove adjacent borders to avoid double borders
                marginLeft: !isFirst && orientation === 'horizontal' ? -1 : 0,
                marginTop: !isFirst && orientation === 'vertical' ? -1 : 0,
              },
              pressed && !isDisabled && styles.pressed,
              isDisabled && styles.disabled,
              fullWidth && styles.buttonFullWidth,
            ]}
          >
            {item.icon && item.iconPosition !== 'end' && (
              <View style={styles.icon}>
                <item.icon
                  size={sizeConfig.iconSize}
                  color={
                    isDisabled
                      ? colors.text[theme].disabled
                      : selected
                        ? colors.text[theme].primary
                        : colors.text[theme].secondary
                  }
                />
              </View>
            )}

            {item.label && (
              <Text
                style={[
                  styles.label,
                  {
                    fontSize: sizeConfig.fontSize,
                    color: isDisabled
                      ? colors.text[theme].disabled
                      : selected
                        ? colors.text[theme].primary
                        : colors.text[theme].secondary,
                  },
                ]}
              >
                {item.label}
              </Text>
            )}

            {item.icon && item.iconPosition === 'end' && (
              <View style={styles.icon}>
                <item.icon
                  size={sizeConfig.iconSize}
                  color={
                    isDisabled
                      ? colors.text[theme].disabled
                      : selected
                        ? colors.text[theme].primary
                        : colors.text[theme].secondary
                  }
                />
              </View>
            )}
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  horizontal: {
    flexDirection: 'row',
  },
  vertical: {
    flexDirection: 'column',
  },
  fullWidth: {
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
  },
  buttonFullWidth: {
    flex: 1,
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontWeight: typography.bodyMedium.fontWeight,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
})

// Export types
export type {
  ButtonGroupProps,
  ButtonGroupItem,
  ButtonGroupMode,
  ButtonGroupSize,
  ButtonGroupOrientation,
} from './ButtonGroup.types'
