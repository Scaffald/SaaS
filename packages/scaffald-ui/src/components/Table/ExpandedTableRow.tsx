/**
 * ExpandedTableRow component
 * Expandable row component with detailed content
 *
 * @example
 * ```tsx
 * import { ExpandedTableRow } from '@scaffald/ui'
 *
 * // Default variant with form inputs
 * <ExpandedTableRow
 *   variant="default"
 *   fields={[
 *     { label: 'Name', placeholder: 'Enter name', value: name },
 *     { label: 'Email', placeholder: 'Enter email', value: email },
 *   ]}
 *   onFieldChange={(type, value) => console.log(type, value)}
 * />
 *
 * // Variant2 with info items
 * <ExpandedTableRow
 *   variant="variant2"
 *   title="Company Name"
 *   infoItems={[
 *     { label: 'Address', value: '123 Main St' },
 *     { label: 'CEO', value: 'John Doe' },
 *   ]}
 * />
 * ```
 */

import { View, Text } from 'react-native'
import type { ExpandedTableRowProps } from './ExpandedTableRow.types'
import { getExpandedTableRowStyles } from './ExpandedTableRow.styles'
import { useThemeContext } from '../../theme'
import { Input } from '../Input'
import { TableCell } from './TableCell'
import { spacing } from '../../tokens/spacing'
import { colors } from '../../tokens/colors'

/**
 * ExpandedTableRow component
 */
export function ExpandedTableRow({
  variant = 'default',
  children,
  fields,
  infoItems,
  title,
  onFieldChange,
  style,
  contentStyle,
  columns = 3,
}: ExpandedTableRowProps) {
  const { theme } = useThemeContext()
  const styles = getExpandedTableRowStyles(variant, theme)

  // Render custom content if provided
  if (children) {
    return (
      <View style={[styles.container, style]}>
        <TableCell type="guideline-vertical-half" width={40} />
        <View style={[styles.contentArea, contentStyle]}>{children}</View>
      </View>
    )
  }

  // Render variant2 (info items)
  if (variant === 'variant2') {
    return (
      <View style={[styles.container, style]}>
        {/* Guideline cell - uses guideline-vertical-f-h type */}
        <TableCell type="guideline-vertical-f-h" width={40} />

        {/* Content area */}
        <View style={[styles.contentArea, contentStyle]}>
          {title && <Text style={styles.title}>{title}</Text>}

          {infoItems && (
            <View style={{ gap: spacing[12] }}>
              {infoItems.map((item, index) => (
                <View key={index} style={{ gap: spacing[4] }}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    )
  }

  // Render default variant (form inputs)
  const fieldsPerColumn = Math.ceil((fields?.length || 0) / columns)
  const _columnWidthPercent = 100 / columns

  return (
    <View style={[styles.container, style]}>
      {/* Guideline cell - uses guideline-vertical-full type for default variant */}
      <TableCell type="guideline-vertical-full" width={40} />

      {/* Content area with form fields */}
      <View style={[styles.contentArea, contentStyle]}>
        {Array.from({ length: columns }).map((_, colIndex) => {
          const startIndex = colIndex * fieldsPerColumn
          const columnFields = fields?.slice(startIndex, startIndex + fieldsPerColumn) || []

          return (
            <View
              key={colIndex}
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
              {columnFields.map((field, fieldIndex) => (
                <View key={fieldIndex} style={{ marginBottom: spacing[20] }}>
                  <Input
                    label={field.label}
                    placeholder={field.placeholder}
                    value={field.value}
                    onChangeText={(value) => onFieldChange?.(field.type || field.label, value)}
                    required={field.required}
                    helperText={field.helperText}
                    error={field.error}
                    errorMessage={field.errorMessage}
                  />
                </View>
              ))}
            </View>
          )
        })}
      </View>
    </View>
  )
}
