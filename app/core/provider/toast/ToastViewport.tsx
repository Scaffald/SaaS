import { ToastViewport as ToastViewportOg } from '@app/ui'

import type { ToastViewportProps } from './ToastViewport.types'
export const ToastViewport = ({ noSafeArea }: ToastViewportProps) => {
  return (
    <ToastViewportOg
      left={noSafeArea ? 0 : 10}
      right={noSafeArea ? 0 : 10}
      top={noSafeArea ? 0 : 10}
    />
  )
}
