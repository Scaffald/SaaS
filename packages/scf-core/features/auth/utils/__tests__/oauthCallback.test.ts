import { describe, expect, it } from 'vitest'
import { readOAuthErrorParams } from '../oauthCallback'

describe('readOAuthErrorParams', () => {
  it('returns null when no error params are present', () => {
    expect(readOAuthErrorParams('', '')).toBeNull()
    expect(readOAuthErrorParams('?code=abc123', '')).toBeNull()
    expect(readOAuthErrorParams('', '#access_token=foo')).toBeNull()
  })

  it('reads ?error=, ?error_code=, ?error_description= from the query string', () => {
    const result = readOAuthErrorParams(
      '?error=server_error&error_code=unexpected_failure&error_description=Unable+to+exchange+external+code',
      ''
    )
    expect(result).toEqual({
      error: 'server_error',
      errorCode: 'unexpected_failure',
      errorDescription: 'Unable to exchange external code',
    })
  })

  it('reads #error= from the URL hash (implicit flow style)', () => {
    const result = readOAuthErrorParams(
      '',
      '#error=access_denied&error_description=User+rejected+the+request'
    )
    expect(result).toEqual({
      error: 'access_denied',
      errorCode: null,
      errorDescription: 'User rejected the request',
    })
  })

  it('prefers the query string when both query and hash carry the same key', () => {
    const result = readOAuthErrorParams('?error=from_query', '#error=from_hash')
    expect(result?.error).toBe('from_query')
  })

  it('handles missing leading "?" and "#" gracefully', () => {
    const result = readOAuthErrorParams(
      'error=server_error&error_description=Bad+thing',
      'error_code=oauth_provider_error'
    )
    expect(result).toEqual({
      error: 'server_error',
      errorCode: 'oauth_provider_error',
      errorDescription: 'Bad thing',
    })
  })
})
