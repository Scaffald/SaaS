import { ToastViewport as ToastViewportOg } from '@app/ui'

import { ToastViewportProps } from './ToastViewport'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const ToastViewport = ({ noSafeArea }: ToastViewportProps) => {
  const { top, right, left } = useSafeAreaInsets()
  return (
    <ToastViewportOg
      top={noSafeArea ? 0 : top + 5}
      left={noSafeArea ? 0 : left + 5}
      right={noSafeArea ? 0 : right + 5}
      style={{ pointerEvents: 'none' }}
    />
  )
}
