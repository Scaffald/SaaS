import { ROUTES } from '@scf/core/constants/routes'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockPush = vi.hoisted(() => vi.fn())
const mockReplace = vi.hoisted(() => vi.fn())
const mockSession = vi.hoisted(() => ({ current: { session: null as unknown, isLoading: false } }))
const mockFetchPreview = vi.hoisted(() => vi.fn())
const mockStore = vi.hoisted(() => vi.fn(async () => true))

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}))
vi.mock('@scf/core/utils/supabase/useSessionContext', () => ({
  useSessionContext: () => mockSession.current,
}))
vi.mock('../../../utils/supabase/useSessionContext', () => ({
  useSessionContext: () => mockSession.current,
}))
vi.mock('../invitesApi', () => ({ fetchInvitePreview: mockFetchPreview }))
vi.mock('../pendingInvite', async (orig) => ({
  ...(await orig<typeof import('../pendingInvite')>()),
  storePendingInvite: mockStore,
}))

const preview = { kind: 'link' as const, inviter: { firstName: 'Clay', avatarUrl: null } }

async function renderScreen(props: { code: string; initialPreview?: typeof preview | null }) {
  const { InviteLandingScreen } = await import('../InviteLandingScreen')
  return render(<InviteLandingScreen {...props} />)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSession.current = { session: null, isLoading: false }
})

describe('InviteLandingScreen', () => {
  it("names the inviter from the loader's preview and saves the code for a visitor", async () => {
    await renderScreen({ code: 'ABC234xyz', initialPreview: preview })
    expect(screen.getByText('Clay invited you to Scaffald')).toBeInTheDocument()
    expect(mockFetchPreview).not.toHaveBeenCalled()
    await waitFor(() => expect(mockStore).toHaveBeenCalledWith('abc234xyz'))
  })

  it('Join opens the create-account tab of the auth screen', async () => {
    await renderScreen({ code: 'abc234xyz', initialPreview: preview })
    fireEvent.click(screen.getByText('Join Clay on Scaffald'))
    expect(mockPush).toHaveBeenCalledWith({ pathname: ROUTES.AUTH.LOGIN.path, params: { intent: 'worker' } })
  })

  it('fetches the preview itself when the loader had none (native)', async () => {
    mockFetchPreview.mockResolvedValueOnce(preview)
    await renderScreen({ code: 'abc234xyz' })
    expect(await screen.findByText('Clay invited you to Scaffald')).toBeInTheDocument()
    expect(mockFetchPreview).toHaveBeenCalledWith('abc234xyz')
  })

  it('saves the code on arrival, before the preview or the session settles', async () => {
    mockSession.current = { session: null, isLoading: true }
    mockFetchPreview.mockReturnValueOnce(new Promise(() => {}))
    await renderScreen({ code: 'abc234xyz' })
    expect(screen.getByText('Opening your invite…')).toBeInTheDocument()
    await waitFor(() => expect(mockStore).toHaveBeenCalledWith('abc234xyz'))
  })

  it('an unknown or expired code still offers to join', async () => {
    mockFetchPreview.mockResolvedValueOnce(null)
    await renderScreen({ code: 'abc234xyz' })
    expect(await screen.findByText('This invite link has expired')).toBeInTheDocument()
    expect(screen.getByText('Join Scaffald')).toBeInTheDocument()
  })

  it('a malformed code never hits the network and is not saved', async () => {
    await renderScreen({ code: '../../etc' })
    expect(await screen.findByText('This invite link has expired')).toBeInTheDocument()
    expect(mockFetchPreview).not.toHaveBeenCalled()
    expect(mockStore).not.toHaveBeenCalled()
  })

  it('a signed-in member is sent to their dashboard and nothing is saved', async () => {
    mockSession.current = { session: { user: { id: 'u1' } }, isLoading: false }
    await renderScreen({ code: 'abc234xyz', initialPreview: preview })
    expect(screen.getByText("You're already on Scaffald.")).toBeInTheDocument()
    fireEvent.click(screen.getByText('Go to your dashboard'))
    expect(mockReplace).toHaveBeenCalledWith(ROUTES.DASHBOARD.path)
    expect(mockStore).not.toHaveBeenCalled()
  })
})
