import { ToastContainer } from '@scaffald/ui'
import type { ToastViewportProps } from './ToastViewport'

export const ToastViewport = ({ noSafeArea: _noSafeArea }: ToastViewportProps) => {
  // beyond-ui's ToastContainer handles safe area insets internally
  // _noSafeArea prop is maintained for API compatibility but not used
  return <ToastContainer />
}
