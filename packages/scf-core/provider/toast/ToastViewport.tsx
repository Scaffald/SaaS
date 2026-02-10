import { ToastContainer } from '@unicornlove/beyond-ui'

export interface ToastViewportProps {
  noSafeArea?: boolean
}
export const ToastViewport = ({ noSafeArea }: ToastViewportProps) => {
  // beyond-ui's ToastContainer handles positioning internally
  // noSafeArea prop is maintained for API compatibility but not used
  return <ToastContainer />
}
