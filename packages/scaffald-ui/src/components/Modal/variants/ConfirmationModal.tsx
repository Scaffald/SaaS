/**
 * ConfirmationModal component
 * Simple confirmation modal with success icon and message
 * Variant of ModalContent for confirmation dialogs
 *
 * @example
 * ```tsx
 * import { ConfirmationModal } from '@scaffald/ui'
 *
 * <ConfirmationModal
 *   message="Your changes have been saved."
 *   icon={<CheckCircleIcon />}
 * />
 * ```
 */

import { useMemo } from 'react'
import { View, Text, StyleSheet, Platform, type ViewStyle, type TextStyle } from 'react-native'
import { CheckCircle } from 'lucide-react-native'
import type { ConfirmationModalProps } from './ConfirmationModal.types'
import { useThemeContext } from '../../../theme'
import type { ThemeMode } from '../../../theme'
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

  // Default icon: CheckCircle with success color
  const defaultIcon =
    icon || (
      <CheckCircle size={24} color={colors.success[500]} fill={colors.success[500]} />
    )

  const iconContainerStyle = useMemo(() => getIconContainerStyle(theme), [theme])
  const messageTextStyle = useMemo(() => getMessageStyle(theme), [theme])

  return (
    <View style={[localStyles.container, style]}>
      {/* Icon with gradient background */}
      <View style={[iconContainerStyle, iconStyle]}>
        {defaultIcon}
      </View>

      {/* Message text */}
      {message && (
        <Text style={[messageTextStyle, messageStyle]}>
          {message}
        </Text>
      )}
    </View>
  )
}

function getIconContainerStyle(_theme: ThemeMode): ViewStyle {
  return {
    width: spacing[48],
    height: spacing[48],
    borderRadius: borderRadius.max, // Fully rounded
    borderWidth: borderWidth.thin,
    borderColor: colors.success[100],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.success[50],
    // Shadow for icon container (double border effect via shadow)
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
  }
}

function getMessageStyle(theme: ThemeMode): TextStyle {
  return {
    fontFamily: typography.paragraphLMedium.fontFamily,
    fontSize: typography.paragraphLMedium.fontSize,
    fontWeight: typography.paragraphLMedium.fontWeight,
    lineHeight: typography.paragraphLMedium.lineHeight,
    color: colors.text[theme].primary,
    textAlign: 'center',
  }
}

const localStyles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[20],
    gap: spacing[12],
  },
})
