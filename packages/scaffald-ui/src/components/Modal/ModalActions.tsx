/**
 * ModalActions component
 * Footer section for modal dialogs with action buttons and optional sub-actions
 * Mapped from Figma Forsured Design System
 *
 * @example
 * ```tsx
 * import { ModalActions } from '@scaffald/ui'
 *
 * // Center-aligned actions
 * <ModalActions
 *   primaryAction={{ label: 'Save', onPress: handleSave }}
 *   secondaryAction={{ label: 'Cancel', onPress: handleCancel }}
 * />
 *
 * // Right-aligned actions with sub-actions
 * <ModalActions
 *   orientation="right"
 *   primaryAction={{ label: 'Save', onPress: handleSave }}
 *   secondaryAction={{ label: 'Cancel', onPress: handleCancel }}
 *   subActions={<Checkbox label="Remember this" />}
 * />
 * ```
 */

import { View } from 'react-native'
import type { ModalActionsProps } from './ModalActions.types'
import { getModalActionsStyles } from './ModalActions.styles'
import { useThemeContext } from '../../theme'
import { Button } from '../Button'

export function ModalActions({
  orientation = 'center',
  primaryAction,
  secondaryAction,
  subActions,
  style,
  subActionsStyle,
  buttonsStyle,
}: ModalActionsProps) {
  const { theme } = useThemeContext()
  const styles = getModalActionsStyles(orientation, theme)

  return (
    <View style={[styles.container, style]}>
      {/* Sub-actions (checkbox, toggle, message, etc.) */}
      {subActions && (
        <View style={[styles.subActionsContainer, subActionsStyle]}>
          {subActions}
        </View>
      )}

      {/* Action Buttons */}
      {(primaryAction || secondaryAction) && (
        <View style={[styles.buttonsContainer, buttonsStyle]}>
          {/* Secondary action first if both exist and right-aligned */}
          {orientation === 'right' && secondaryAction && (
            <Button
              variant={secondaryAction.variant || 'outline'}
              color={secondaryAction.color || 'gray'}
              size="md"
              fullWidth={false}
              disabled={secondaryAction.disabled}
              loading={secondaryAction.loading}
              onPress={secondaryAction.onPress}
            >
              {secondaryAction.label}
            </Button>
          )}

          {/* Primary action */}
          {primaryAction && (
            <Button
              variant={primaryAction.variant || 'filled'}
              color={primaryAction.color || 'primary'}
              size="md"
              fullWidth={orientation === 'center'}
              disabled={primaryAction.disabled}
              loading={primaryAction.loading}
              onPress={primaryAction.onPress}
            >
              {primaryAction.label}
            </Button>
          )}

          {/* Secondary action last if center-aligned */}
          {orientation === 'center' && secondaryAction && (
            <Button
              variant={secondaryAction.variant || 'outline'}
              color={secondaryAction.color || 'gray'}
              size="md"
              fullWidth={true}
              disabled={secondaryAction.disabled}
              loading={secondaryAction.loading}
              onPress={secondaryAction.onPress}
            >
              {secondaryAction.label}
            </Button>
          )}
        </View>
      )}
    </View>
  )
}
