/**
 * AdaptiveSelectSheet – bottom sheet for select options on mobile
 * Used by ResponsiveSelect when viewport is narrow.
 */

import { ScrollView } from 'react-native'
import { Sheet, SheetHeader, SheetContent, SheetFooter } from '../Sheet'
import { Button } from '../Button'
import type { AdaptiveSelectSheetProps } from './ResponsiveSelect.types'

export function AdaptiveSelectSheet({
  visible,
  onClose,
  title,
  children,
  height = 'half',
}: AdaptiveSelectSheetProps) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      height={height}
      closeOnBackdropPress
      showHandle
    >
      <SheetHeader title={title} onClose={onClose} showCloseButton />
      <SheetContent>
        <ScrollView
          style={{ maxHeight: 400 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SheetContent>
      <SheetFooter>
        <Button color="primary" onPress={onClose}>
          Done
        </Button>
      </SheetFooter>
    </Sheet>
  )
}
