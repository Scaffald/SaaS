/**
 * TabTrigger component
 * Clickable tab button
 */

import { View, Pressable, Text } from 'react-native'
import type { TabTriggerProps } from './Tabs.types'
import { useTabsContext } from './Tabs'
import { useTabItemContext } from './TabItem'
import { getTabTriggerStyles } from './Tabs.styles'
import { useThemeContext } from '../../theme'

export function TabTrigger({
  children,
  iconStart: IconStart,
  iconEnd: IconEnd,
  iconOnly = false,
  containerStyle,
  textStyle,
  onPress: onPressProp,
  ...pressableProps
}: TabTriggerProps) {
  const tabsContext = useTabsContext()
  const itemContext = useTabItemContext()
  const { theme } = useThemeContext()

  // Get styles based on current props and theme
  const styles = getTabTriggerStyles(
    tabsContext.type,
    tabsContext.color,
    tabsContext.size,
    tabsContext.orientation,
    itemContext.isSelected,
    itemContext.disabled,
    itemContext.isHovered,
    iconOnly,
    theme,
    tabsContext.triggerSizing
  )

  // Calculate icon size based on tab size
  const iconSize = 20 // All sizes use 20px icons per Figma

  return (
    <Pressable
      {...itemContext.getTriggerProps(onPressProp)}
      style={({ pressed }) => [
        styles.container,
        // Pressed state
        pressed && !itemContext.disabled && { opacity: 0.8 },
        containerStyle,
      ]}
      {...pressableProps}
    >
      {/* Icon Start */}
      {IconStart && (
        <View style={{ width: iconSize, height: iconSize }}>
          <IconStart size={iconSize} color={styles.iconColor} />
        </View>
      )}

      {/* Tab Text */}
      {!iconOnly && children && (
        <Text style={[styles.text, textStyle]}>
          {typeof children === 'string' ? children : children}
        </Text>
      )}

      {/* Icon End */}
      {IconEnd && !iconOnly && (
        <View style={{ width: iconSize, height: iconSize }}>
          <IconEnd size={iconSize} color={styles.iconColor} />
        </View>
      )}
    </Pressable>
  )
}

