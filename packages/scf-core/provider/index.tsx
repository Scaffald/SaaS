import { DatePickerProvider } from '@rehookify/datepicker'
import type { Session } from '@supabase/auth-js'
import type { FC, ReactNode } from 'react'

import { AuthProvider } from './auth/AuthProvider'
import { CookieConsentProvider } from './cookie-consent'
import { QueryClientProvider } from './react-query'
import { ScaffaldProviderFromSession } from './scaffald/ScaffaldProviderFromSession'
import { ToastProvider } from './toast'
import {
  ScaffaldJobsSdkProviderFromSession,
  useScaffaldJobsClient,
} from '../utils/jobs-sdk-context'

export { loadThemePromise, ThemeContext } from './theme/UniversalThemeProvider'
export { UniversalThemeProvider, useThemeSetting } from './theme'
export { useScaffaldJobsClient }

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
      <Providers>
        <AuthProvider initialSession={initialSession}>
          <ScaffaldProviderFromSession>
            <ScaffaldJobsSdkProviderFromSession>{children}</ScaffaldJobsSdkProviderFromSession>
          </ScaffaldProviderFromSession>
        </AuthProvider>
      </Providers>
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

const Providers = compose([
  CookieConsentProvider,
  ToastProvider,
  QueryClientProvider,
])
