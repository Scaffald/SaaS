import type { TeamInvitation } from '@scaffald/sdk'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TeamInvitationList } from '../TeamInvitationsWidget'

vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}))

const invitation: TeamInvitation = {
  id: 'inv-1',
  teamId: 'team-1',
  email: 'teammate@example.com',
  invitedUserId: null,
  roleId: 'role-1',
  status: 'pending',
  expiresAt: new Date().toISOString(),
  acceptedAt: null,
  declinedAt: null,
  revokedAt: null,
  sentAt: new Date().toISOString(),
  notificationId: 'notif-1',
  lastDeliveryStatus: 'queued',
  lastDeliveryError: null,
  lastDeliveryChannels: ['email'],
  createdAt: new Date().toISOString(),
  createdBy: 'user-admin',
  metadata: {
    lastDelivery: {
      status: 'queued',
      channels: ['email'],
      updatedAt: new Date().toISOString(),
    },
  },
  role: {
    id: 'role-1',
    key: 'member',
    name: 'Member',
  },
  team: {
    id: 'team-1',
    name: 'Field Operations',
    organizationId: 'org-1',
    organizationName: 'Acme Construction',
  },
}

describe('TeamInvitationList', () => {
  it('renders empty state when there are no invitations', () => {
    render(<TeamInvitationList invitations={[]} onRespond={vi.fn()} />)
    expect(screen.getByText('No pending invitations')).toBeVisible()
  })

  it('invokes callbacks when accepting or declining invitations', async () => {
    const user = userEvent.setup()
    const onRespond = vi.fn()

    render(<TeamInvitationList invitations={[invitation]} onRespond={onRespond} />)

    expect(screen.getByText(/Sent/i)).toBeVisible()

    await user.click(screen.getByRole('button', { name: /accept/i }))
    expect(onRespond).toHaveBeenCalledWith(invitation.id, 'accept')

    await user.click(screen.getByRole('button', { name: /decline/i }))
    expect(onRespond).toHaveBeenCalledWith(invitation.id, 'decline')
  })

  it('displays invitation status correctly', () => {
    const acceptedInvitation: TeamInvitation = {
      ...invitation,
      id: 'inv-2',
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
    }

    render(<TeamInvitationList invitations={[acceptedInvitation]} onRespond={vi.fn()} />)

    expect(screen.getByText(/accepted/i)).toBeInTheDocument()
  })

  it('handles expired invitations', () => {
    const expiredInvitation: TeamInvitation = {
      ...invitation,
      id: 'inv-3',
      status: 'expired',
      expiresAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    }

    render(<TeamInvitationList invitations={[expiredInvitation]} onRespond={vi.fn()} />)

    expect(screen.getByText(/expired/i)).toBeInTheDocument()
  })

  it('displays empty state when no invitations', () => {
    render(<TeamInvitationList invitations={[]} onRespond={vi.fn()} />)

    expect(screen.getByText('No pending invitations')).toBeInTheDocument()
  })
})
