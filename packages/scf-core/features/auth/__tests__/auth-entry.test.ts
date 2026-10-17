import { describe, expect, it } from 'vitest'
import enAuth from '../../../locales/en/auth.json'
import {
  AUTH_MODES,
  AUTH_SLIDES,
  canUsePassword,
  initialAuthMode,
  modeDescriptionKey,
  nextSlideIndex,
  primaryActionKey,
} from '../auth-entry'

/** Resolve a dotted `auth.*` key against the real English bundle. */
const en = (key: string): string | undefined => {
  const path = key.replace(/^auth\./, '').split('.')
  let node: unknown = enAuth
  for (const part of path) {
    node = (node as Record<string, unknown> | undefined)?.[part]
  }
  return typeof node === 'string' ? node : undefined
}

describe('initialAuthMode', () => {
  it('opens on Sign in with no params', () => {
    expect(initialAuthMode({})).toBe('signin')
  })

  it('opens on Create account when the landing CTA carried an intent', () => {
    expect(initialAuthMode({ intent: 'worker' })).toBe('create')
    expect(initialAuthMode({ intent: 'org' })).toBe('create')
    expect(initialAuthMode({ intent: ['org'] })).toBe('create')
  })

  it('ignores an intent it does not know', () => {
    expect(initialAuthMode({ intent: 'admin' })).toBe('signin')
    expect(initialAuthMode({ intent: '' })).toBe('signin')
  })
})

describe('canUsePassword', () => {
  it('offers the password path on Sign in only', () => {
    expect(canUsePassword('signin')).toBe(true)
    expect(canUsePassword('create')).toBe(false)
  })
})

describe('primaryActionKey', () => {
  it('labels the magic-link button by tab', () => {
    expect(primaryActionKey('signin', false, false)).toBe('auth.login.submitButton')
    expect(primaryActionKey('create', false, false)).toBe('auth.login.createButton')
  })

  it('labels the password button on Sign in', () => {
    expect(primaryActionKey('signin', true, false)).toBe('auth.login.passwordSignIn')
    expect(primaryActionKey('signin', true, true)).toBe('auth.login.passwordSigningIn')
  })

  it('never shows a password label on Create account, even if the flag lingers', () => {
    expect(primaryActionKey('create', true, false)).toBe('auth.login.createButton')
    expect(primaryActionKey('create', true, true)).toBe('auth.login.sending')
  })

  it('shows the sending state while the link is requested', () => {
    expect(primaryActionKey('signin', false, true)).toBe('auth.login.sending')
  })
})

describe('copy', () => {
  it('every key the card resolves exists in the English bundle', () => {
    const keys = AUTH_MODES.flatMap((mode) => [
      modeDescriptionKey(mode),
      primaryActionKey(mode, false, false),
      primaryActionKey(mode, false, true),
      primaryActionKey(mode, true, false),
      primaryActionKey(mode, true, true),
    ])
    for (const key of keys) {
      expect(en(key), key).toBeTruthy()
    }
  })

  it('says "Sign in", never "Login", on the sign-in screens (#1210)', () => {
    // Values only — the bundle's own `login` key is not copy.
    const leaves = (node: unknown): string[] =>
      typeof node === 'string'
        ? [node]
        : Object.values(node as Record<string, unknown>).flatMap(leaves)
    const copy = [enAuth.login, enAuth.verify, enAuth.errors].flatMap(leaves)
    expect(copy.length).toBeGreaterThan(0)
    for (const line of copy) {
      expect(line).not.toMatch(/\blog ?in\b/i)
    }
  })
})

describe('AUTH_SLIDES', () => {
  it('is numbered in order', () => {
    expect(AUTH_SLIDES.map((s) => s.n)).toEqual(
      AUTH_SLIDES.map((_, i) => String(i + 1).padStart(2, '0'))
    )
  })

  it('makes no anonymity promise the product does not keep', () => {
    expect(JSON.stringify(AUTH_SLIDES)).not.toMatch(/anonymous|autofill/i)
  })
})

describe('nextSlideIndex', () => {
  it('advances and wraps', () => {
    expect(nextSlideIndex(0, 4)).toBe(1)
    expect(nextSlideIndex(3, 4)).toBe(0)
  })

  it('stays at 0 with no slides', () => {
    expect(nextSlideIndex(0, 0)).toBe(0)
  })
})
