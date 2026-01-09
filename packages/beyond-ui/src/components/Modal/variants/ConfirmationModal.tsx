/**
 * ConfirmationModal component
 * Simple confirmation modal with success icon and message
 * Variant of ModalContent for confirmation dialogs
 *
 * @example
 * ```tsx
 * import { ConfirmationModal } from '@unicornlove/beyond-ui'
 *
 * <ConfirmationModal
 *   message="Your changes have been saved."
 *   icon={<CheckCircleIcon />}
 * />
 * ```
 */

import { View, Text, StyleSheet, Platform } from 'react-native'
import { CheckCircle } from 'lucide-react-native'
import type { ConfirmationModalProps } from './ConfirmationModal.types'
import { useThemeContext } from '../../../playground/ThemeProvider'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { borderRadius, borderWidth } from '../../../tokens/borders'
import { typography } from '../../../tokens/typography'

export function ConfirmationModal({
  message,
  icon,
  style,
  iconStyle,
  messageStyle,
}: ConfirmationModalProps) {
  const { theme } = useThemeContext()

  // Default icon: CheckCircle with success gradient background
  const defaultIcon = icon || (
    <CheckCircle size={24} color={colors.text[theme].primary} />
  )

  return (
    <View style={[localStyles.container, style]}>
      {/* Icon with gradient background */}
      <View style={[localStyles.iconContainer(theme), iconStyle]}>
        {defaultIcon}
      </View>

      {/* Message text */}
      {message && (
        <Text style={[localStyles.message(theme), messageStyle]}>
          {message}
        </Text>
      )}
    </View>
  )
}

const localStyles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[20],
    gap: spacing[12],
  },
  iconContainer: (theme: 'light' | 'dark') => ({
    width: spacing[48],
    height: spacing[48],
    borderRadius: borderRadius.max, // Fully rounded
    borderWidth: borderWidth.thin,
    borderColor: colors.border[theme].default,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'web'
      ? `linear-gradient(180deg, ${colors.success[50]} 0%, ${colors.success[100]} 100%)`
      : colors.success[50], // Fallback for native
    // Shadow for icon container
    ...(Platform.OS === 'web'
      ? {
          boxShadow: `0 0 0 2px ${colors.white}, 0 0 0 3px ${colors.success[100]}`,
        }
      : {
          shadowColor: colors.success[100],
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
          elevation: 2,
        }),
  }),
  message: (theme: 'light' | 'dark') => ({
    fontFamily: typography.paragraphLMedium.fontFamily,
    fontSize: typography.paragraphLMedium.fontSize,
    fontWeight: typography.paragraphLMedium.fontWeight,
    lineHeight: typography.paragraphLMedium.lineHeight,
    color: colors.text[theme].primary,
    textAlign: 'center',
  }),
})
