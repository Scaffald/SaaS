/**
 * Themed ButtonGroup wrapper
 * Wraps ButtonGroup with theme-aware styling for playground examples
 */

import { useState } from 'react'
import { View, Pressable, Text, StyleSheet } from 'react-native'
import { useTheme } from './useTheme'
import { colors } from '../tokens/colors'
import { spacing } from '../tokens/spacing'
import { borderRadius } from '../tokens/borders'
import { typography } from '../tokens/typography'
import { shadows } from '../tokens/shadows'
import type { ButtonGroupItem } from '../components/ButtonGroup/ButtonGroup.types'

interface ThemedButtonGroupProps {
  items: ButtonGroupItem[]
  value?: string | string[]
  defaultValue?: string | string[]
  onChange?: (value: string | string[]) => void
  size?: 'xs' | 'sm' | 'md'
  fullWidth?: boolean
  mode?: 'single' | 'multiple'
}

export function ThemedButtonGroup({
  items,
  value: controlledValue,
  defaultValue,
  onChange,
  size = 'md',
  fullWidth = false,
  mode = 'single',
}: ThemedButtonGroupProps) {
  const { theme } = useTheme()
  const [internalValue, setInternalValue] = useState<string | string[]>(
    defaultValue || (mode === 'single' ? '' : [])
  )

  const value = controlledValue !== undefined ? controlledValue : internalValue

  const isSelected = (itemId: string): boolean => {
    if (mode === 'single') {
      return value === itemId
    }
    return Array.isArray(value) && value.includes(itemId)
  }

  const handlePress = (item: ButtonGroupItem) => {
    if (item.disabled) return

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

    if (controlledValue === undefined) {
      setInternalValue(newValue)
    }

    onChange?.(newValue)
  }

  const sizeConfig = {
    xs: { height: 24, fontSize: 12, paddingHorizontal: spacing[8], iconSize: 16 },
    sm: { height: 32, fontSize: 14, paddingHorizontal: spacing[12], iconSize: 20 },
    md: { height: 40, fontSize: 16, paddingHorizontal: spacing[16], iconSize: 24 },
  }[size]

  // Use theme-aware colors
  const _bgColor = theme === 'light' ? colors.bg.light : colors.bg.dark
  const textColor = theme === 'light' ? colors.text.light : colors.text.dark
  const borderColor = theme === 'light' ? colors.border.light.default : colors.border.dark.default
  const selectedBg = theme === 'light' ? colors.bg.light.muted : colors.bg.dark.muted

  return (
    <View style={[styles.container, fullWidth && styles.fullWidth]}>
      {items.map((item, index) => {
        const selected = isSelected(item.id)
        const isFirst = index === 0
        const isLast = index === items.length - 1

        return (
          <Pressable
            key={item.id}
            onPress={() => handlePress(item)}
            disabled={item.disabled}
            style={({ pressed }) => [
              styles.button,
              {
                height: sizeConfig.height,
                paddingHorizontal: item.label
                  ? sizeConfig.paddingHorizontal
                  : sizeConfig.height / 2,
                backgroundColor: selected
                  ? selectedBg
                  : theme === 'light'
                    ? colors.bg.light.default
                    : colors.bg.dark.default,
                borderColor,
                borderWidth: 1,
                borderTopLeftRadius: isFirst ? borderRadius.s : 0,
                borderBottomLeftRadius: isFirst ? borderRadius.s : 0,
                borderTopRightRadius: isLast ? borderRadius.s : 0,
                borderBottomRightRadius: isLast ? borderRadius.s : 0,
                marginLeft: !isFirst ? -1 : 0,
                // Shadow from Figma (button shadow) - only on first button
                ...(index === 0 && shadows.button),
                opacity: pressed ? 0.8 : item.disabled ? 0.5 : 1,
              },
            ]}
          >
            {item.icon && item.iconPosition !== 'end' && (
              <View style={styles.icon}>
                <item.icon
                  size={sizeConfig.iconSize}
                  color={
                    item.disabled
                      ? textColor.disabled
                      : selected
                        ? textColor.primary
                        : textColor.secondary
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
                    color: item.disabled
                      ? textColor.disabled
                      : selected
                        ? textColor.primary
                        : textColor.secondary,
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
                    item.disabled
                      ? textColor.disabled
                      : selected
                        ? textColor.primary
                        : textColor.secondary
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
    borderRadius: borderRadius.s,
    overflow: 'hidden',
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
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontWeight: typography.bodyMedium.fontWeight,
    textAlign: 'center',
  },
})
