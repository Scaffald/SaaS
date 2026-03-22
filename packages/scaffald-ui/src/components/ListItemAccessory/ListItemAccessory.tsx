/**
 * ListItemAccessory component
 * iOS 26 trailing accessory for list/sidebar items
 *
 * @example
 * ```tsx
 * <ListItemAccessory type="disclosure" detail="Detail" />
 * <ListItemAccessory type="checkmark" detail="Detail" />
 * <ListItemAccessory type="toggle" checked={isOn} onToggleChange={setIsOn} />
 * ```
 */

import { useMemo } from 'react'
import { View, Text, Switch } from 'react-native'
import type { ListItemAccessoryProps } from './ListItemAccessory.types'
import { useThemeContext } from '../../theme'
import { colors } from '../../tokens/colors'

export function ListItemAccessory({
  type,
  detail,
  showDetail = true,
  symbol = '􀓔',
  checked = false,
  onToggleChange,
  selected = false,
  style,
}: ListItemAccessoryProps) {
  const { theme } = useThemeContext()

  const textColor = selected
    ? colors.labelsVibrant[theme].secondary
    : colors.labelsVibrant[theme].secondary
  const iconColor = colors.labelsVibrant[theme].primary
  const selectedTextWeight = selected ? ('500' as const) : ('400' as const)

  const detailStyle = useMemo(
    () => ({
      fontSize: 17,
      lineHeight: 22,
      letterSpacing: -0.43,
      color: textColor,
      fontWeight: selectedTextWeight,
      textAlign: 'right' as const,
    }),
    [textColor, selectedTextWeight]
  )

  const iconStyle = useMemo(
    () => ({
      fontSize: 17,
      lineHeight: 22,
      color: iconColor,
      textAlign: 'center' as const,
      width: type === 'info' ? 32 : 30,
      height: 22,
    }),
    [iconColor, type]
  )

  if (type === 'toggle') {
    return (
      <View style={[{ paddingVertical: 11, justifyContent: 'center' }, style]}>
        <Switch
          value={checked}
          onValueChange={onToggleChange}
          trackColor={{
            false: colors.fills[theme].secondary,
            true: colors.accents[theme].green,
          }}
          thumbColor="#ffffff"
        />
      </View>
    )
  }

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          height: 44,
          gap: type === 'info' ? 6 : type === 'disclosure' ? 4 : 8,
          paddingRight: type === 'disclosure' ? 4 : type === 'detail' ? 8 : 0,
        },
        style,
      ]}
    >
      {/* Detail text */}
      {showDetail && detail && (
        <Text style={detailStyle}>{detail}</Text>
      )}

      {/* Type-specific icon */}
      {type === 'checkmark' && <Text style={iconStyle}>{'✓'}</Text>}
      {type === 'info' && <Text style={iconStyle}>{'ⓘ'}</Text>}
      {type === 'disclosure' && (
        <View style={{ width: 18, height: 18, justifyContent: 'center', alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 17,
              fontWeight: '600',
              color: colors.labelsVibrant[theme].secondary,
              textAlign: 'center',
            }}
          >
            ›
          </Text>
        </View>
      )}
      {type === 'symbol' && <Text style={iconStyle}>{symbol}</Text>}
    </View>
  )
}

ListItemAccessory.displayName = 'ListItemAccessory'
