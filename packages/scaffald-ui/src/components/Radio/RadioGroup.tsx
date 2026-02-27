/**
 * RadioGroup component
 * Container for managing multiple radio buttons with mutual exclusivity
 *
 * @example
 * ```tsx
 * import { RadioGroup } from '@scaffald/ui'
 *
 * const options = [
 *   { label: 'Option 1', value: '1' },
 *   { label: 'Option 2', value: '2' },
 *   { label: 'Option 3', value: '3' },
 * ]
 *
 * <RadioGroup
 *   value={selectedValue}
 *   onChange={setSelectedValue}
 *   options={options}
 *   label="Choose an option"
 * />
 * ```
 */

import { View, Text, StyleSheet } from 'react-native'
import { Radio } from './Radio'
import { spacing } from '../../tokens/spacing'
import { typography } from '../../tokens/typography'
import { colors } from '../../tokens/colors'
import { useThemeContext } from '../../theme'
import type { RadioGroupProps } from './RadioGroup.types'

export function RadioGroup({
  value,
  onChange,
  options,
  orientation = 'vertical',
  size = 'md',
  color = 'primary',
  disabled = false,
  error = false,
  label,
  name,
  gap = 12,
  containerStyle,
}: RadioGroupProps) {
  const { theme } = useThemeContext()

  const handleChange = (optionValue: string | number) => {
    if (disabled) return
    onChange?.(optionValue)
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.groupLabel,
            {
              color: disabled ? colors.text[theme].disabled : colors.text[theme].primary,
            },
          ]}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.radioContainer,
          orientation === 'horizontal' ? styles.horizontal : styles.vertical,
          { gap },
        ]}
      >
        {options.map((option) => (
          <Radio
            key={String(option.value)}
            checked={value === option.value}
            onChange={() => handleChange(option.value)}
            label={option.label}
            helperText={option.helperText}
            optional={option.optional}
            value={option.value}
            name={name}
            size={size}
            color={color}
            disabled={disabled || option.disabled}
            error={error}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  groupLabel: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: typography.body.lineHeight,
    marginBottom: spacing[8],
  },
  radioContainer: {
    // Container for radio buttons
  },
  vertical: {
    flexDirection: 'column',
  },
  horizontal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})

// Export types
export type { RadioGroupProps, RadioGroupOption, RadioGroupOrientation } from './RadioGroup.types'
