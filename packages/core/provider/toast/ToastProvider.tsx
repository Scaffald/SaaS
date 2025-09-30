import { CustomToast, ToastProvider as ToastProviderOG } from '@app/ui'
import { ReactNode } from 'react'

import { ToastViewport, ToastViewportProps } from './ToastViewport'

export const ToastProvider = ({
  children,
  ...viewportProps
}: { children: ReactNode } & ToastViewportProps) => {
  return (
    <ToastProviderOG
      swipeDirection="up"
      swipeThreshold={20}
      duration={6000}
      native={
        [
          /* uncomment the next line to do native toasts on mobile - note that it won't be as customizable as custom toasts, especially on android */
          // 'mobile'
        ]
      }
    >
      {children}
      <ToastViewport {...viewportProps} />
      <CustomToast />
    </ToastProviderOG>
  )
}
