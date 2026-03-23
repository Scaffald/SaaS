/**
 * BottomBar.PageControl — renders page dots with leading/trailing buttons.
 */

import type React from 'react'
import { View } from 'react-native'
import { ToolbarButton } from '../../ToolbarButton'
import { PageControl } from '../../PageControl'
import type { BottomBarPageControlProps } from '../BottomBar.types'

export function BottomBarPageControl({
  pageControl,
  leadingButtons,
  trailingButtons,
}: BottomBarPageControlProps): React.ReactElement {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {leadingButtons?.map((btn) => (
          <ToolbarButton
            key={btn.key}
            icon={btn.icon}
            label={btn.label}
            variant={btn.variant}
            onPress={btn.onPress}
            disabled={btn.disabled}
            accessibilityLabel={btn.accessibilityLabel}
          />
        ))}
      </View>

      <PageControl
        totalPages={pageControl.count}
        currentPage={pageControl.current}
        onPageChange={pageControl.onChange}
        variant="pill"
      />

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {trailingButtons?.map((btn) => (
          <ToolbarButton
            key={btn.key}
            icon={btn.icon}
            label={btn.label}
            variant={btn.variant}
            onPress={btn.onPress}
            disabled={btn.disabled}
            accessibilityLabel={btn.accessibilityLabel}
          />
        ))}
      </View>
    </View>
  )
}
