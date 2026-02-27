/**
 * TableActionBar – action bar above table: add/show buttons + search
 */

import { Plus, SlidersHorizontal } from 'lucide-react-native'
import { Row, Stack, Separator } from '../Layout'
import { Button } from '../Button'
import { Input } from '../Input'
import { Caption } from '../Typography'
import { spacing } from '../../tokens/spacing'
import type { TableActionBarProps } from './TableActionBar.types'

export function TableActionBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search',
  addLabel = 'Add',
  onAddPress,
  leftAccessory,
  rightAccessory,
  addDisabled = false,
  showLabel = 'Show',
  onShowPress,
  showDisabled = false,
  helperText,
}: TableActionBarProps) {
  return (
    <Stack gap={spacing[2]} style={{ width: '100%' }}>
      <Row
        align="center"
        justify="space-between"
        gap={spacing[4]}
        style={{ width: '100%', flexWrap: 'wrap' }}
      >
        <Stack gap={spacing[2]}>
          <Row gap={spacing[2]} align="center">
            {leftAccessory}
            <Button
              iconStart={Plus}
              disabled={addDisabled}
              onPress={onAddPress}
              color="primary"
              variant="filled"
            >
              {addLabel}
            </Button>
            <Button
              variant="outline"
              color="gray"
              iconStart={SlidersHorizontal}
              disabled={showDisabled}
              onPress={onShowPress}
            >
              {showLabel}
            </Button>
          </Row>
          {helperText ? <Caption>{helperText}</Caption> : null}
        </Stack>
        <Row gap={spacing[2]} align="center">
          <Input
            value={searchValue}
            onChangeText={onSearchChange}
            placeholder={searchPlaceholder}
            style={{ width: 280 }}
          />
          {rightAccessory}
        </Row>
      </Row>
      <Separator />
    </Stack>
  )
}
