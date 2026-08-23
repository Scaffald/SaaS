import { DatePickerProvider } from '@rehookify/datepicker'
import type { Session } from '@supabase/auth-js'
import { BottomBarProvider } from '@scaffald/ui'
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

// `compose` puts the first entry outermost.
//
// BottomBarProvider leads because it is pure context with no output of its own,
// and because two things that need to agree about the bottom of the screen sit
// on opposite sides of the tree: the phone tab bar publishes its height from
// deep inside DrawerLayout, and the cookie banner — which renders here, at the
// root, inside CookieConsentProvider — has to clear it. It used to be mounted
// twice further down (DrawerLayout and the protected layout), so the bar
// registered into the innermost copy while the banner read the empty default
// and covered the navigation. One provider above both ends that.
const Providers = compose([
  BottomBarProvider,
  CookieConsentProvider,
  ToastProvider,
  QueryClientProvider,
])
