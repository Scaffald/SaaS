/**
 * BottomBar.Search — renders a ToolbarSearchBar inside the pill.
 */

import type React from 'react'
import { View } from 'react-native'
import { ToolbarSearchBar } from '../../ToolbarSearchBar'
import type { BottomBarSearchProps } from '../BottomBar.types'

export function BottomBarSearch(props: BottomBarSearchProps): React.ReactElement {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingHorizontal: 4, gap: 4 }}>
      <ToolbarSearchBar {...props} />
    </View>
  )
}
