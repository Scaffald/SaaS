import type { AdaptWhen } from '@tamagui/adapt'
import type { ReactNode } from 'react'
import { Adapt } from '@unicornlove/ui'
import { Sheet } from '../sheets/Sheet'

interface AdaptiveSelectSheetProps {
  /** Content to render inside the sheet (typically Select.Content) */
  children: ReactNode
  /** Whether the sheet is native (for React Native) */
  native?: boolean
  /** Animation configuration for the sheet */
  animationConfig?: {
    type: 'spring'
    damping: number
    mass: number
    stiffness: number
  }
  /** Overlay animation style */
  overlayAnimation?: 'lazy' | 'quick' | 'medium'
}

/**
 * AdaptiveSelectSheet - Wrapper component for Adapt/Sheet pattern used in Select components
 *
 * This component wraps the common pattern of using Adapt with Sheet for mobile-responsive
 * Select dropdowns. It avoids type inference issues with Adapt.Contents during DTS generation
 * by using children prop instead of Adapt.Contents.
 *
 * @example
 * ```tsx
 * <Select>
 *   <Select.Trigger>...</Select.Trigger>
 *   <AdaptiveSelectSheet>
 *     <Select.Content>
 *       <Select.Viewport>
 *         Select items here
 *       </Select.Viewport>
 *     </Select.Content>
 *   </AdaptiveSelectSheet>
 * </Select>
 * ```
 */
const overlayStyles = {
  enterStyle: { opacity: 0 },
  exitStyle: { opacity: 0 },
} as const

export function AdaptiveSelectSheet({
  children,
  native = false,
  animationConfig,
  overlayAnimation = 'lazy',
}: AdaptiveSelectSheetProps) {
  return (
    <Adapt when={'sm' as unknown as AdaptWhen} platform="touch">
      <Sheet native={native} modal dismissOnSnapToBottom animationConfig={animationConfig}>
        <Sheet.Frame>
          <Sheet.ScrollView>{children}</Sheet.ScrollView>
        </Sheet.Frame>
        <Sheet.Overlay animation={overlayAnimation} {...overlayStyles} />
      </Sheet>
    </Adapt>
  )
}
