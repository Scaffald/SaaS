import { render, screen, waitFor } from '@testing-library/react'
import { useCookieConsent } from '@scaffald/ui'
import { describe, expect, it, vi } from 'vitest'

/**
 * The native provider renders no consent UI and reports the implicit state
 * (#764). The web "This site uses cookies" sheet was mounted here before.
 */
vi.mock('react-native', async () => {
  const actual = await vi.importActual('react-native')
  return { ...(actual as object), Platform: { OS: 'ios', select: (o: { ios?: unknown }) => o.ios } }
})

// scf-core's test environment stubs @scaffald/ui with a layout-only mock that
// has no consent provider. This test is about the real one, so use it.
vi.mock('@scaffald/ui', async () => {
  const real = await import('../../../../ui/src/components/CookieConsent/CookieConsentProvider')
  return { CookieConsentProvider: real.CookieConsentProvider, useCookieConsent: real.useCookieConsent }
})

import { CookieConsentProvider } from '../CookieConsentProvider.native'

function Probe() {
  const { isReady, shouldShowBanner, hasConsentedTo } = useCookieConsent()
  return (
    <span data-testid="probe">
      {JSON.stringify({ isReady, shouldShowBanner, performance: hasConsentedTo('performance') })}
    </span>
  )
}

describe('CookieConsentProvider (native)', () => {
  it('shows no banner and answers with the implicit consent', async () => {
    render(
      <CookieConsentProvider>
        <Probe />
      </CookieConsentProvider>
    )
    await waitFor(() => expect(JSON.parse(screen.getByTestId('probe').textContent!).isReady).toBe(true))
    expect(JSON.parse(screen.getByTestId('probe').textContent!)).toEqual({
      isReady: true,
      shouldShowBanner: false,
      performance: true,
    })
    expect(screen.queryByText('This site uses cookies')).toBeNull()
    expect(screen.queryByRole('button', { name: /accept/i })).toBeNull()
  })
})
