import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TeamInvitationList } from '../TeamInvitationsWidget'

const invitation = {
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
  createdAt: new Date().toISOString(),
  createdBy: 'user-admin',
  metadata: {},
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
} as const

describe('TeamInvitationList', () => {
  it('renders empty state when there are no invitations', () => {
    render(<TeamInvitationList invitations={[]} onRespond={vi.fn()} />)
    expect(screen.getByText('No pending invitations')).toBeVisible()
  })

  it('invokes callbacks when accepting or declining invitations', async () => {
    const user = userEvent.setup()
    const onRespond = vi.fn()

    render(
      <TeamInvitationList
        invitations={[invitation]}
        onRespond={onRespond}
      />,
    )

    await user.click(screen.getByRole('button', { name: /accept/i }))
    expect(onRespond).toHaveBeenCalledWith(invitation.id, 'accept')

    await user.click(screen.getByRole('button', { name: /decline/i }))
    expect(onRespond).toHaveBeenCalledWith(invitation.id, 'decline')
  })
})


