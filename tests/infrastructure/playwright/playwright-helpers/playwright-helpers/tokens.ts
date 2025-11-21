// @ts-nocheck
// Utility for reading cached Supabase tokens produced by the Deno tests.
import { readFile } from 'fs/promises'
import { join } from 'path'

type CachedToken = {
  token: string
  email: string
  userId: string
  expiresAt: number
}

type TokenCache = {
  regular?: CachedToken
  admin?: CachedToken
  cachedAt?: number
}

const TOKENS_PATH = join(process.cwd(), 'packages/supabase/tokens.json')

export type TestPersona = 'regular' | 'admin'

export async function readCachedToken(persona: TestPersona): Promise<CachedToken | null> {
  try {
    const raw = await readFile(TOKENS_PATH, 'utf-8')
    const data = JSON.parse(raw) as TokenCache
    const entry = data?.[persona]
    if (!entry) return null
    if (!entry.token || !entry.expiresAt) return null
    const now = Date.now()
    if (entry.expiresAt <= now) {
      console.warn(`[tokens] Cached ${persona} token expired at ${entry.expiresAt}, current ${now}`)
      return null
    }
    return entry
  } catch (error) {
    console.warn('[tokens] Unable to read cached tokens:', error)
    return null
  }
}
