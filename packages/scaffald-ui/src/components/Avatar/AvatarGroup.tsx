/**
 * AvatarGroup component
 * Displays a group of avatars with overlap
 */

import { View, Text, StyleSheet } from 'react-native'
import type { AvatarGroupProps } from './Avatar.types'
import { colors } from '../../tokens/colors'
import { fontFamily, fontWeight } from '../../tokens/typography'
import { useThemeContext } from '../../theme'
import React, { Children } from 'react'

export function AvatarGroup({
  children,
  size = 40,
  max = 5,
  spacing = -8,
  containerStyle,
}: AvatarGroupProps) {
  const { theme } = useThemeContext()
  const childArray = Children.toArray(children)
  const visibleChildren = max ? childArray.slice(0, max) : childArray
  const remainingCount = max && childArray.length > max ? childArray.length - max : 0

  return (
    <View style={[styles.container, containerStyle]}>
      {visibleChildren.map((child, index) => {
        // Children.toArray assigns stable keys, extract them
        const key = React.isValidElement(child) && child.key ? String(child.key) : `avatar-${index}`

        return (
          <View
            key={key}
            style={[
              styles.avatarWrapper,
              {
                marginLeft: index > 0 ? spacing : 0,
                zIndex: visibleChildren.length - index,
              },
            ]}
          >
            {React.isValidElement(child)
              ? React.cloneElement(child, { size, showRing: true } as { size?: number; showRing?: boolean })
              : child}
          </View>
        )
      })}

      {/* Remaining count indicator */}
      {remainingCount > 0 && (
        <View
          style={[
            styles.avatarWrapper,
            {
              marginLeft: spacing,
              zIndex: 0,
            },
          ]}
        >
          <View
            style={[
              styles.remainingIndicator,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: colors.gray[200],
                borderWidth: 2,
                borderColor: colors.bg[theme].default,
              },
            ]}
          >
            <Text
              style={[
                styles.remainingText,
                {
                  fontSize: size / 3,
                  color: colors.gray[700],
                  fontFamily: fontFamily.body,
                  fontWeight: fontWeight.medium,
                },
              ]}
            >
              +{remainingCount}
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  remainingIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  remainingText: {
    textAlign: 'center',
  },
})
