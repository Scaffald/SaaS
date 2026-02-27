import { ToastProvider as ToastProviderOG, ToastContainer } from '@scaffald/ui'
import type { ReactNode } from 'react'

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ToastProviderOG defaultDuration={6000} maxToasts={5}>
      {children}
      <ToastContainer />
    </ToastProviderOG>
  )
}
