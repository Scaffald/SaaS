import { DatePickerProvider } from '@rehookify/datepicker'
import type { Session } from '@supabase/supabase-js'
import React, { type ReactNode, type FC } from 'react'

import { AuthProvider } from './auth/AuthProvider'
import { QueryClientProvider } from './react-query'
import { TamaguiProvider } from './tamagui'
import { UniversalThemeProvider } from './theme'
import { ToastProvider } from './toast'
import { CookieConsentProvider } from './cookie-consent'

export { loadThemePromise } from './theme/UniversalThemeProvider'

export function Provider({
  initialSession,
  children,
}: {
  initialSession?: Session | null
  children: ReactNode
}) {
  return (
    // Note: DatePickerProvider Conflicted with Popover so this is just a temporary solution
    <DatePickerProvider config={{ selectedDates: [], onDatesChange: () => {} }}>
      <CookieConsentProvider>
        <AuthProvider initialSession={initialSession}>
          <Providers>{children}</Providers>
        </AuthProvider>
      </CookieConsentProvider>
    </DatePickerProvider>
  )
}

const compose = (providers: FC<{ children: ReactNode }>[]) =>
  providers.reduce((Prev, Curr) => ({ children }) => {
    const Provider = Prev ? (
      <Prev>
        <Curr>{children}</Curr>
      </Prev>
    ) : (
      <Curr>{children}</Curr>
    )
    return Provider
  })

const Providers = compose([UniversalThemeProvider, TamaguiProvider, ToastProvider, QueryClientProvider])
