import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const LOCAL = 'http://127.0.0.1:54321'
const REMOTE = 'https://abcdefgh.supabase.co'

/**
 * The module memoizes "already warned", so every case needs a fresh copy.
 * Importing dynamically after setting env also matters: the resolvers read
 * process.env at call time, but a stale module instance would carry the
 * warned flag from the previous test and silently pass.
 */
async function load() {
  vi.resetModules()
  return import('../api-base-url')
}

describe('supabase base url resolution', () => {
  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL
    delete process.env.EXPO_PUBLIC_SCAFFALD_API_URL
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('derives the SDK base url from the auth url', async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = LOCAL
    const { getSupabaseApiBaseUrl, getSupabaseAuthUrl } = await load()

    expect(getSupabaseAuthUrl()).toBe(LOCAL)
    expect(getSupabaseApiBaseUrl()).toBe(`${LOCAL}/functions/v1/api`)
  })

  it('strips a trailing slash rather than producing a double slash', async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = `${LOCAL}/`
    const { getSupabaseApiBaseUrl } = await load()

    expect(getSupabaseApiBaseUrl()).toBe(`${LOCAL}/functions/v1/api`)
  })

  it('does not double-append when the url already carries the api path', async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = `${LOCAL}/functions/v1/api`
    const { getSupabaseApiBaseUrl } = await load()

    expect(getSupabaseApiBaseUrl()).toBe(`${LOCAL}/functions/v1/api`)
  })

  it('lets an explicit api url override the derived one', async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = LOCAL
    process.env.EXPO_PUBLIC_SCAFFALD_API_URL = `${REMOTE}/functions/v1/api`
    const { getSupabaseApiBaseUrl } = await load()

    expect(getSupabaseApiBaseUrl()).toBe(`${REMOTE}/functions/v1/api`)
  })

  it('returns empty rather than a bare api path when nothing is configured', async () => {
    const { getSupabaseApiBaseUrl } = await load()

    expect(getSupabaseApiBaseUrl()).toBe('')
  })
})

describe('warnOnBackendMismatch', () => {
  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL
    delete process.env.EXPO_PUBLIC_SCAFFALD_API_URL
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /** The exact #376 shape: auth local, SDK left pointing at the dev project. */
  it('warns when auth and the SDK resolve to different origins', async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = LOCAL
    process.env.EXPO_PUBLIC_SCAFFALD_API_URL = `${REMOTE}/functions/v1/api`
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { warnOnBackendMismatch } = await load()

    warnOnBackendMismatch()

    expect(spy).toHaveBeenCalledOnce()
    const message = String(spy.mock.calls[0]?.[0])
    // Both origins have to appear — a warning that does not say which two
    // backends disagree sends you back to reading env files by hand.
    expect(message).toContain('127.0.0.1:54321')
    expect(message).toContain('abcdefgh.supabase.co')
    expect(message).toContain('#376')
  })

  it('warns only once even when both providers call it', async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = LOCAL
    process.env.EXPO_PUBLIC_SCAFFALD_API_URL = `${REMOTE}/functions/v1/api`
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { warnOnBackendMismatch } = await load()

    warnOnBackendMismatch()
    warnOnBackendMismatch()
    warnOnBackendMismatch()

    expect(spy).toHaveBeenCalledOnce()
  })

  it('stays silent when both point at the same project', async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = LOCAL
    process.env.EXPO_PUBLIC_SCAFFALD_API_URL = `${LOCAL}/functions/v1/api`
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { warnOnBackendMismatch } = await load()

    warnOnBackendMismatch()

    expect(spy).not.toHaveBeenCalled()
  })

  it('stays silent on the ordinary derived case, where no override is set', async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = REMOTE
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { warnOnBackendMismatch } = await load()

    warnOnBackendMismatch()

    expect(spy).not.toHaveBeenCalled()
  })

  it('stays silent when configuration is missing rather than blaming a mismatch', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { warnOnBackendMismatch } = await load()

    warnOnBackendMismatch()

    expect(spy).not.toHaveBeenCalled()
  })
})
