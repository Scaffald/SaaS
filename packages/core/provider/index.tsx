import { DatePickerProvider } from '@rehookify/datepicker'
import { Session } from '@supabase/supabase-js'
import React from 'react'

import { AuthProvider } from './auth'
import { RequiredProfileDialog } from '@app/core/features/onboarding/components/RequiredProfileDialog'
import { CookieConsentProvider } from './cookie-consent'
import { QueryClientProvider } from './react-query'
import { TamaguiProvider } from './tamagui'
import { UniversalThemeProvider } from './theme'
import { ToastProvider } from './toast'

export { loadThemePromise } from './theme/UniversalThemeProvider'

export function Provider({
  initialSession,
  children,
}: {
  initialSession?: Session | null
  children: React.ReactNode
}) {
  return (
    // Note: DatePickerProvider Conflicted with Popover so this is just a temporary solution
    <DatePickerProvider config={{ selectedDates: [], onDatesChange: () => {} }}>
      <AuthProvider initialSession={initialSession}>
        <Providers>
          <RequiredProfileDialog />
          {children}
        </Providers>
      </AuthProvider>
    </DatePickerProvider>
  )
}

const compose = (providers: React.FC<{ children: React.ReactNode }>[]) =>
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

const Providers = compose([
  UniversalThemeProvider,
  TamaguiProvider,
  CookieConsentProvider,
  ToastProvider,
  QueryClientProvider,
])
