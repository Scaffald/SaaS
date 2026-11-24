import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockMutateAsync = vi.hoisted(() => vi.fn())
const mockOpenURL = vi.hoisted(() => vi.fn())
const mockCopy = vi.hoisted(() => vi.fn(async () => true))
const invitesData = vi.hoisted(() => ({
  current: null as null | { invites: unknown[]; counts: { invited: number; joined: number; onboarded: number } },
}))

vi.mock('../../../utils/invites-sdk-hooks', () => ({
  useInviteLink: () => ({
    isLoading: false,
    data: { code: 'abc234xy', link: 'https://scaffald.com/i/abc234xy', shareText: 'Join me' },
  }),
  useInvites: () => ({ isLoading: false, data: invitesData.current }),
  useCreateInvitesMutation: () => ({ mutateAsync: mockMutateAsync, isPending: false, isError: false }),
}))
vi.mock('../../../utils/clipboard', () => ({ copyToClipboard: mockCopy }))
vi.mock('react-native', async (orig) => {
  const rn = await orig<typeof import('react-native')>()
  return { ...rn, Linking: { ...rn.Linking, openURL: mockOpenURL } }
})

// @scaffald/ui renders as plain elements in these tests, so props arrive as
// lower-case attributes (testid) rather than data-testid.
const field = (id: string) => {
  const el = document.querySelector(`[testid="${id}"]`)
  if (!el) throw new Error(`no element with testid ${id}`)
  return el as HTMLElement
}

async function renderScreen(source?: 'app' | 'onboarding') {
  const { InviteCrewScreen } = await import('../InviteCrewScreen')
  return render(<InviteCrewScreen source={source} />)
}

beforeEach(() => {
  vi.clearAllMocks()
  invitesData.current = null
})

describe('InviteCrewScreen', () => {
  it('shows the personal link and copies it', async () => {
    await renderScreen()
    expect(screen.getByText('https://scaffald.com/i/abc234xy')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Copy link'))
    await waitFor(() => expect(mockCopy).toHaveBeenCalledWith('https://scaffald.com/i/abc234xy'))
    expect(await screen.findByText('Link copied')).toBeInTheDocument()
  })

  it('counts what it can read, sends contacts with the note and source, and shows each result', async () => {
    mockMutateAsync.mockResolvedValueOnce({
      results: [
        { index: 0, status: 'sent', invitationId: 'i1', email: 'sam@example.test' },
        {
          index: 1,
          status: 'ready',
          invitationId: 'i2',
          phone: '+15550104411',
          link: 'https://scaffald.com/i/x',
          smsUrl: 'sms:+15550104411?&body=hi',
          shareText: 'hi',
        },
        { index: 2, status: 'skipped', reason: 'member' },
        { index: 3, status: 'failed', reason: 'email_not_configured' },
      ],
      summary: { sent: 1, ready: 1, skipped: 1, failed: 1 },
    })
    await renderScreen('onboarding')
    fireEvent.change(field('invite-contacts-input'), {
      target: { value: 'sam@example.test\nPat 555-010-4411\nzach@example.test\nnew@example.test\ngibberish' },
    })
    expect(screen.getByText(/4 to invite · 1 we can't read/)).toBeInTheDocument()
    fireEvent.change(field('invite-message-input'), { target: { value: 'Come work with us' } })
    fireEvent.click(screen.getByText('Invite 4 people'))

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled())
    expect(mockMutateAsync).toHaveBeenCalledWith({
      contacts: [
        { email: 'sam@example.test', name: null },
        { phone: '555-010-4411', name: 'Pat' },
        { email: 'zach@example.test', name: null },
        { email: 'new@example.test', name: null },
      ],
      message: 'Come work with us',
      source: 'onboarding',
    })
    expect(await screen.findByText('Invite emailed')).toBeInTheDocument()
    expect(screen.getByText('Already on Scaffald')).toBeInTheDocument()
    expect(screen.getByText(/Email invites aren't switched on yet/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Text invite'))
    expect(mockOpenURL).toHaveBeenCalledWith('sms:+15550104411?&body=hi')
    // What couldn't be read stays in the box to fix.
    expect((field('invite-contacts-input') as HTMLTextAreaElement).value).toBe('gibberish')
  })

  it('lists invites with their status and the joined count', async () => {
    invitesData.current = {
      invites: [
        { id: '1', kind: 'targeted', name: 'Sam', email: null, phone: null, status: 'onboarded' },
        { id: '2', kind: 'targeted', name: null, email: 'pat@example.test', phone: null, status: 'joined' },
        { id: '3', kind: 'targeted', name: null, email: null, phone: '+15550104411', status: 'pending' },
        { id: '4', kind: 'link', name: null, email: null, phone: null, status: 'pending' },
      ],
      counts: { invited: 3, joined: 2, onboarded: 1 },
    }
    await renderScreen()
    expect(screen.getByText('2 joined of 3')).toBeInTheDocument()
    expect(screen.getByText('Set up profile')).toBeInTheDocument()
    expect(screen.getByText('Joined')).toBeInTheDocument()
    expect(screen.getByText('Invited')).toBeInTheDocument()
    expect(screen.getByText('+15550104411')).toBeInTheDocument()
  })

  it('the send button is disabled until something readable is entered', async () => {
    await renderScreen()
    fireEvent.change(field('invite-contacts-input'), { target: { value: 'nope' } })
    fireEvent.click(field('invite-send'))
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })
})
