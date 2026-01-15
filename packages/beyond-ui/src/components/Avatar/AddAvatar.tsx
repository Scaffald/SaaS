/**
 * AddAvatar component
 * Button for adding new avatars to a group
 */

import { Pressable, View, Text, StyleSheet, Platform } from 'react-native'
import type { AddAvatarProps } from './Avatar.types'
import { colors } from '../../tokens/colors'
import { useThemeContext } from '../../theme'

export function AddAvatar({ size = 40, onPress, containerStyle }: AddAvatarProps) {
  const { theme } = useThemeContext()

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.bg[theme].subtle,
          borderWidth: 1.5,
          borderColor: colors.border[theme].default,
          borderStyle: 'dashed',
        },
        pressed && Platform.OS !== 'web' && { opacity: 0.8 },
        containerStyle,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Add avatar"
    >
      <View style={styles.iconContainer}>
        <Text
          style={[
            styles.plusIcon,
            {
              fontSize: size / 2,
              color: colors.text[theme].tertiary,
            },
          ]}
        >
          +
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusIcon: {
    fontWeight: '600',
    lineHeight: undefined, // Let the system calculate based on font size
  },
})
