/**
 * The notification settings carried a second inbox under the preferences —
 * All / Unread tabs and the list again, in a different row style from
 * /dashboard/notifications (#1211). It is preferences only now, and points at
 * the one inbox.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@scaffald/ui'
import { ROUTES } from '@scf/core/constants/routes'
import { SettingsNotificationsSection } from '../SettingsNotificationsSection'

const push = vi.fn()
vi.mock('expo-router', () => ({ useRouter: () => ({ push }) }))

// Only the preference hooks are provided. Were the section still to fetch the
// inbox, the missing list hooks would throw here.
vi.mock('@scf/core/utils/notifications-sdk-hooks', () => ({
  useNotificationPreferences: () => ({ data: undefined }),
  useSavePreferencesMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useNotificationDevices: () => ({ data: [] }),
}))

function renderSection() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ThemeProvider>
        <SettingsNotificationsSection />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

describe('SettingsNotificationsSection (#1211)', () => {
  beforeEach(() => push.mockReset())

  it('shows the preferences', () => {
    renderSection()
    expect(screen.getAllByText('Preferences').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Quiet hours').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Registered devices').length).toBeGreaterThan(0)
  })

  it('draws no second inbox', () => {
    renderSection()
    expect(screen.queryByText(/^Unread/)).toBeNull()
    expect(screen.queryByText('Mark as read')).toBeNull()
    expect(screen.queryByText("You're all caught up!")).toBeNull()
  })

  it('links to the inbox', () => {
    renderSection()
    fireEvent.click(screen.getAllByText('Open inbox')[0])
    expect(push).toHaveBeenCalledWith(ROUTES.DASHBOARD.NOTIFICATIONS.path)
  })
})
