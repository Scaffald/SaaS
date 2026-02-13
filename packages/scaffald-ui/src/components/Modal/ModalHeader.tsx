/**
 * ModalHeader component
 * Header section for modal dialogs with icon, title, description, and close button
 * Mapped from Figma Forsured Design System
 *
 * @example
 * ```tsx
 * import { ModalHeader } from '@scaffald/ui'
 *
 * // Left-aligned header
 * <ModalHeader
 *   title="Modal Title"
 *   description="Description text goes here"
 *   icon={<IconComponent />}
 *   onClose={handleClose}
 * />
 *
 * // Center-aligned header
 * <ModalHeader
 *   title="Modal Title"
 *   description="Description text goes here"
 *   orientation="center"
 *   icon={<IconComponent />}
 * />
 * ```
 */

import { View, Text, Pressable } from 'react-native'
import { X } from 'lucide-react-native'
import type { ModalHeaderProps } from './ModalHeader.types'
import { getModalHeaderStyles } from './ModalHeader.styles'
import { useThemeContext } from '../../theme'

export function ModalHeader({
  title,
  description,
  orientation = 'left',
  icon,
  showCloseButton = true,
  onClose,
  style,
  titleStyle,
  descriptionStyle,
  iconStyle,
  closeButtonStyle,
}: ModalHeaderProps) {
  const { theme } = useThemeContext()
  const styles = getModalHeaderStyles(orientation, theme)

  return (
    <View style={[styles.container, style]}>
      {/* Icon */}
      {icon && (
        <View style={[styles.iconContainer, iconStyle]}>{icon}</View>
      )}

      {/* Text Content */}
      {(title || description) && (
        <View style={styles.textContainer}>
          {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
          {description && (
            <Text style={[styles.description, descriptionStyle]}>
              {description}
            </Text>
          )}
        </View>
      )}

      {/* Close Button */}
      {showCloseButton && (
        <Pressable
          style={[styles.closeButton, closeButtonStyle]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close modal"
        >
          <X size={24} color={styles.closeIconColor} />
        </Pressable>
      )}
    </View>
  )
}
