import { ROUTES } from '@scf/core/constants/routes'
import { describe, expect, it } from 'vitest'
import { splitOnEmails, SUPPORT_EMAIL, SUPPORT_FAQS } from '../../marketing/content/support'
import { supportRedirectFor } from '../support-route'

describe('supportRedirectFor', () => {
  it('sends a signed-in user to the in-app Support screen', () => {
    expect(supportRedirectFor({ hasSession: true, isLoadingSession: false })).toBe(
      ROUTES.DASHBOARD.SUPPORT.path
    )
  })

  it('keeps a signed-out visitor on the public page', () => {
    expect(supportRedirectFor({ hasSession: false, isLoadingSession: false })).toBeNull()
  })

  it('does not move while the session is still loading (server render, first paint)', () => {
    expect(supportRedirectFor({ hasSession: false, isLoadingSession: true })).toBeNull()
    expect(supportRedirectFor({ hasSession: true, isLoadingSession: true })).toBeNull()
  })

  it('the two Support routes are distinct', () => {
    expect(ROUTES.SUPPORT.path).toBe('/support')
    expect(ROUTES.DASHBOARD.SUPPORT.path).not.toBe(ROUTES.SUPPORT.path)
  })
})

describe('splitOnEmails', () => {
  it('splits an address out of a sentence, leaving trailing punctuation outside', () => {
    expect(splitOnEmails(`Email ${SUPPORT_EMAIL}.`)).toEqual([
      { text: 'Email ', email: false },
      { text: SUPPORT_EMAIL, email: true },
      { text: '.', email: false },
    ])
  })

  it('returns plain copy whole', () => {
    expect(splitOnEmails('No address here')).toEqual([{ text: 'No address here', email: false }])
  })

  it('finds the support address in the FAQ answers that mention it', () => {
    const withEmail = SUPPORT_FAQS.filter((f) => f.a.includes(SUPPORT_EMAIL))
    expect(withEmail.length).toBeGreaterThan(0)
    for (const faq of withEmail) {
      expect(splitOnEmails(faq.a).some((p) => p.email && p.text === SUPPORT_EMAIL)).toBe(true)
    }
  })
})
