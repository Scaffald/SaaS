/**
 * The Settings inbox read `page.items` from each infinite page, but the list
 * endpoint returns `{ data, pagination }`, so it said "You're all caught up!"
 * beside "Unread (7)". Its Archived tab sent no filter at all (#1081).
 *
 * The page fixture below is the body GET /v1/notifications returns, captured
 * against the local `api` function, not a shape inferred from the component.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@scaffald/ui'
import type { NotificationsListResponse } from '@scaffald/sdk'
import { SettingsNotificationsSection } from '../SettingsNotificationsSection'

vi.mock('expo-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

// The shared @scaffald/ui mock has no NotificationTag, and its Tabs ignore
// presses. Add the tag and a Tabs whose triggers report their value.
vi.mock('@scaffald/ui', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  const { createContext, createElement, useContext } = await import('react')
  type Props = { children?: unknown; value?: string; onValueChange?: (v: string) => void }
  const TabsCtx = createContext<((v: string) => void) | undefined>(undefined)
  const ItemCtx = createContext<string | undefined>(undefined)
  const Tabs = Object.assign(
    ({ children, onValueChange }: Props) =>
      createElement(TabsCtx.Provider, { value: onValueChange }, children as never),
    {
      Item: ({ children, value }: Props) =>
        createElement(ItemCtx.Provider, { value }, children as never),
      Trigger: function Trigger({ children }: Props) {
        const onValueChange = useContext(TabsCtx)
        const value = useContext(ItemCtx)
        return createElement(
          'button',
          { type: 'button', onClick: () => value && onValueChange?.(value) },
          children as never
        )
      },
      Content: ({ children }: Props) => createElement('div', null, children as never),
    }
  )
  const NotificationTag = ({ children }: Props) => createElement('span', null, children as never)
  return { ...actual, Tabs, NotificationTag }
})

vi.mock('@scf/core/features/notifications/components/SiteOverlapNotification', () => ({
  SiteOverlapNotification: () => null,
}))

const page: NotificationsListResponse = {
  data: [
    {
      id: 'd60b6c1b-0000-4000-8000-000000000001',
      user_id: 'u-1',
      type: 'message',
      title: 'New application for Site Electrical Lead',
      message: 'Alice Chen applied',
      read: false,
      created_at: '2026-10-13T09:00:00Z',
      // Columns the API returns that the SDK's Notification type omits.
      ...({
        severity: 'important',
        body: { preview: 'Alice Chen applied 2 hours ago' },
        routed_channels: ['in_app'],
        cta_url: null,
        archived_at: null,
      } as object),
    },
    {
      id: 'd60b6c1b-0000-4000-8000-000000000002',
      user_id: 'u-1',
      type: 'message',
      title: 'Timesheet approved',
      message: 'Week of Oct 6',
      read: true,
      created_at: '2026-10-12T09:00:00Z',
    },
  ],
  pagination: { total: 2, page: 1, limit: 25, total_pages: 1 },
}

const useInfiniteNotifications = vi.fn()

vi.mock('@scf/core/utils/notifications-sdk-hooks', () => {
  const mutation = () => ({ mutate: vi.fn(), isPending: false })
  return {
    useInfiniteNotifications: (...args: unknown[]) => useInfiniteNotifications(...args),
    useNotificationPreferences: () => ({ data: undefined }),
    useSavePreferencesMutation: mutation,
    useUnreadCount: () => ({ data: { data: { unread_count: 1 } } }),
    useNotificationDevices: () => ({ data: [] }),
    useMarkAsReadMutation: mutation,
    useMarkAsUnreadMutation: mutation,
    useArchiveManyMutation: mutation,
  }
})

function renderSection() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ThemeProvider>
        <SettingsNotificationsSection />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

describe('SettingsNotificationsSection inbox (#1081)', () => {
  beforeEach(() => {
    useInfiniteNotifications.mockReset()
    useInfiniteNotifications.mockReturnValue({
      data: { pages: [page], pageParams: [undefined] },
      isLoading: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      refetch: vi.fn(),
      fetchNextPage: vi.fn(),
    })
  })

  it('renders the rows in each page’s `data`', () => {
    renderSection()
    expect(screen.getAllByText('New application for Site Electrical Lead').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Alice Chen applied 2 hours ago').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Timesheet approved').length).toBeGreaterThan(0)
    expect(screen.queryByText("You're all caught up!")).toBeNull()
  })

  it('still shows the empty state for a page with no rows', () => {
    useInfiniteNotifications.mockReturnValue({
      ...useInfiniteNotifications(),
      data: { pages: [{ ...page, data: [] }], pageParams: [undefined] },
    })
    renderSection()
    expect(screen.getAllByText("You're all caught up!").length).toBeGreaterThan(0)
  })

  it('asks for every row on All and only unread rows on Unread', () => {
    renderSection()
    expect(useInfiniteNotifications).toHaveBeenLastCalledWith({ limit: 25 }, expect.anything())

    fireEvent.click(screen.getByRole('button', { name: /^Unread/ }))
    expect(useInfiniteNotifications).toHaveBeenLastCalledWith(
      { limit: 25, read: false },
      expect.anything()
    )
  })

  it('offers no Archived tab, since the endpoint has no archived filter', () => {
    renderSection()
    expect(screen.queryByText('Archived')).toBeNull()
  })
})
