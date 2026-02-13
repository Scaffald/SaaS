/**
 * NotificationListItem component
 * Notification list item with avatar, text, and actions
 * Maps to Figma "_Notification List Item" component
 *
 * @example
 * ```tsx
 * import { NotificationListItem } from '@scaffald/ui'
 *
 * // Single text variant
 * <NotificationListItem
 *   variant="single-text"
 *   avatarSrc="https://example.com/avatar.jpg"
 *   content={
 *     <>
 *       <Text style={{ fontWeight: '500' }}>Tina Hernandez</Text>
 *       {' replied to your comment in '}
 *       <Text style={{ fontWeight: '500' }}>Generic posts</Text>
 *     </>
 *   }
 *   timestamp="5 min ago"
 * />
 *
 * // Double CTA variant
 * <NotificationListItem
 *   variant="double-cta"
 *   state="new"
 *   avatarSrc="https://example.com/avatar.jpg"
 *   avatarIndicatorColor="#34d399"
 *   content="Tina Hernandez replied to your comment"
 *   timestamp="5 min ago"
 *   actions={[
 *     { label: 'Reply', variant: 'primary', onPress: () => {} },
 *     { label: 'View', variant: 'secondary', onPress: () => {} }
 *   ]}
 * />
 * ```
 */

import { useState } from 'react'
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native'
import type { NotificationListItemProps } from './NotificationListItem.types'
import {
  getContainerStyles,
  getAvatarContainerStyles,
  getAvatarIndicatorStyles,
  getContentContainerStyles,
  getTextContainerStyles,
  getContentTextStyles,
  getTimestampTextStyles,
  getActionsContainerStyles,
  getActionButtonStyles,
  getActionButtonTextStyles,
  getLinkTextStyles,
  getLinksContainerStyles,
} from './NotificationListItem.styles'
import { useThemeContext } from '../../theme'
import { Avatar } from '../Avatar'
import { typography } from '../../tokens/typography'
import { spacing } from '../../tokens/spacing'

export function NotificationListItem({
  variant = 'single-text',
  state: stateProp = 'read',
  avatarSrc,
  avatarIndicatorColor,
  content,
  timestamp,
  actions = [],
  links = [],
  file,
  onPress,
  disabled = false,
  style,
  contentStyle,
  accessibilityLabel,
}: NotificationListItemProps) {
  const { theme } = useThemeContext()
  const [internalHovered, setInternalHovered] = useState(false)

  // Determine current state
  const currentState = stateProp === 'read' && internalHovered ? 'hover' : stateProp

  const containerStyles = getContainerStyles(currentState, disabled, theme)
  const avatarContainerStyles = getAvatarContainerStyles()
  const contentContainerStyles = getContentContainerStyles(variant)
  const textContainerStyles = getTextContainerStyles()
  const contentTextStyles = getContentTextStyles(currentState, theme)
  const timestampTextStyles = getTimestampTextStyles(theme)

  const itemContent = (
    <View style={[containerStyles, style]} pointerEvents="box-none">
      {/* Avatar */}
      {avatarSrc && (
        <View style={avatarContainerStyles}>
          <Avatar src={avatarSrc} size={40} />
          {avatarIndicatorColor && (
            <View style={getAvatarIndicatorStyles(avatarIndicatorColor)} />
          )}
        </View>
      )}

      {/* Content */}
      <View style={contentContainerStyles}>
        {/* Text content */}
        <View style={textContainerStyles}>
          <Text style={[contentTextStyles, contentStyle]}>{content}</Text>
          {timestamp && <Text style={timestampTextStyles}>{timestamp}</Text>}
        </View>

        {/* Actions/Links based on variant */}
        {variant === 'double-cta' && actions.length > 0 && (
          <View style={getActionsContainerStyles()}>
            {actions.slice(0, 2).map((action) => (
              <Pressable
                key={action.label}
                onPress={action.onPress}
                style={({ pressed }) => [
                  getActionButtonStyles(action.variant || 'secondary', theme),
                  pressed && Platform.OS !== 'web' && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <Text style={getActionButtonTextStyles(action.variant || 'secondary', theme)}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {variant === 'single-cta' && actions.length > 0 && (
          <View style={getActionsContainerStyles()}>
            <Pressable
              onPress={actions[0].onPress}
              style={({ pressed }) => [
                getActionButtonStyles(actions[0].variant || 'primary', theme),
                pressed && Platform.OS !== 'web' && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={actions[0].label}
            >
              <Text style={getActionButtonTextStyles(actions[0].variant || 'primary', theme)}>
                {actions[0].label}
              </Text>
            </Pressable>
          </View>
        )}

        {variant === 'double-link' && links.length > 0 && (
          <View style={getLinksContainerStyles()}>
            {links.slice(0, 2).map((link) => (
              <Pressable
                key={link.label}
                onPress={link.onPress}
                style={({ pressed }) => [
                  styles.linkContainer,
                  pressed && Platform.OS !== 'web' && styles.linkPressed,
                ]}
                accessibilityRole="link"
                accessibilityLabel={link.label}
              >
                <Text style={getLinkTextStyles(currentState, theme)}>{link.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {variant === 'file' && file && (
          <View style={styles.fileContainer}>
            {file.icon && <View style={styles.fileIcon}>{file.icon}</View>}
            <View style={styles.fileInfo}>
              <Text style={[contentTextStyles, { fontFamily: typography.paragraphSMedium.fontFamily, fontWeight: typography.paragraphSMedium.fontWeight }]}>
                {file.name}
              </Text>
              {file.size && (
                <Text style={[timestampTextStyles, { marginTop: spacing[2] }]}>
                  {file.size}
                </Text>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  )

  if (!onPress) {
    return itemContent
  }

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      {...(Platform.OS === 'web' && {
        onMouseEnter: () => setInternalHovered(true),
        onMouseLeave: () => setInternalHovered(false),
      } as any)}
      style={({ pressed }) => [
        pressed && Platform.OS !== 'web' && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || 'Notification'}
      accessibilityState={{ disabled }}
    >
      {itemContent}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.8,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  linkContainer: {
    paddingVertical: spacing[4],
  },
  linkPressed: {
    opacity: 0.8,
  },
  fileContainer: {
    flexDirection: 'row',
    gap: spacing[12],
    alignItems: 'center',
  },
  fileIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
    flexDirection: 'column',
  },
})