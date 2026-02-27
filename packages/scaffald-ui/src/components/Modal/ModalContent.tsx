/**
 * ModalContent component
 * Flexible content slot area for modal dialogs
 * Mapped from Figma Forsured Design System
 *
 * @example
 * ```tsx
 * import { ModalContent } from '@scaffald/ui'
 *
 * // Default content
 * <ModalContent>
 *   <Text>Custom content here</Text>
 * </ModalContent>
 *
 * // Custom variant
 * <ModalContent variant="default">
 *   <CustomComponent />
 * </ModalContent>
 * ```
 */

import { ScrollView } from 'react-native'
import type { ModalContentProps } from './ModalContent.types'
import { getModalContentStyles } from './ModalContent.styles'
import { useThemeContext } from '../../theme'

export function ModalContent({
  children,
  variant = 'default',
  style,
}: ModalContentProps) {
  const { theme } = useThemeContext()
  const styles = getModalContentStyles(variant, theme)

  return (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  )
}
