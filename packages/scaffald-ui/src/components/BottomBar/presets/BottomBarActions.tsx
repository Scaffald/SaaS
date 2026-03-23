/**
 * BottomBar.Actions — renders a row of ToolbarButtons inside the pill.
 */

import type React from 'react'
import { View } from 'react-native'
import { ToolbarButton } from '../../ToolbarButton'
import type { BottomBarActionsProps } from '../BottomBar.types'

export function BottomBarActions({ buttons }: BottomBarActionsProps): React.ReactElement {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
      {buttons.map((btn) => (
        <ToolbarButton
          key={btn.key}
          icon={btn.icon}
          label={btn.label}
          variant={btn.variant}
          onPress={btn.onPress}
          disabled={btn.disabled}
          tintColor={btn.tintColor}
          accessibilityLabel={btn.accessibilityLabel}
        />
      ))}
    </View>
  )
}
