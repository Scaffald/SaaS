import { describe, it, expect } from 'vitest'
import { generateCodeVerifier, generateCodeChallenge, generateState } from '../auth/pkce'

describe('PKCE Utilities', () => {
  describe('generateCodeVerifier', () => {
    it('should generate a code verifier', () => {
      const verifier = generateCodeVerifier()

      expect(verifier).toBeDefined()
      expect(typeof verifier).toBe('string')
      expect(verifier.length).toBeGreaterThan(40)
    })

    it('should generate unique verifiers', () => {
      const verifier1 = generateCodeVerifier()
      const verifier2 = generateCodeVerifier()

      expect(verifier1).not.toBe(verifier2)
    })

    it('should use base64url encoding (no +, /, or =)', () => {
      const verifier = generateCodeVerifier()

      expect(verifier).not.toContain('+')
      expect(verifier).not.toContain('/')
      expect(verifier).not.toContain('=')
    })
  })

  describe('generateCodeChallenge', () => {
    it('should generate a code challenge from verifier', async () => {
      const verifier = generateCodeVerifier()
      const challenge = await generateCodeChallenge(verifier)

      expect(challenge).toBeDefined()
      expect(typeof challenge).toBe('string')
      expect(challenge.length).toBeGreaterThan(40)
    })

    it('should generate same challenge for same verifier', async () => {
      const verifier = 'test_verifier_12345678901234567890123'
      const challenge1 = await generateCodeChallenge(verifier)
      const challenge2 = await generateCodeChallenge(verifier)

      expect(challenge1).toBe(challenge2)
    })

    it('should generate different challenges for different verifiers', async () => {
      const verifier1 = generateCodeVerifier()
      const verifier2 = generateCodeVerifier()
      const challenge1 = await generateCodeChallenge(verifier1)
      const challenge2 = await generateCodeChallenge(verifier2)

      expect(challenge1).not.toBe(challenge2)
    })

    it('should use base64url encoding', async () => {
      const verifier = generateCodeVerifier()
      const challenge = await generateCodeChallenge(verifier)

      expect(challenge).not.toContain('+')
      expect(challenge).not.toContain('/')
      expect(challenge).not.toContain('=')
    })

    it('should implement SHA-256 hashing', async () => {
      const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
      const challenge = await generateCodeChallenge(verifier)

      // Known SHA-256 hash of this verifier (from RFC 7636 example)
      const expected = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
      expect(challenge).toBe(expected)
    })
  })

  describe('generateState', () => {
    it('should generate a state parameter', () => {
      const state = generateState()

      expect(state).toBeDefined()
      expect(typeof state).toBe('string')
      expect(state.length).toBeGreaterThan(40)
    })

    it('should generate unique states', () => {
      const state1 = generateState()
      const state2 = generateState()

      expect(state1).not.toBe(state2)
    })

    it('should use base64url encoding', () => {
      const state = generateState()

      expect(state).not.toContain('+')
      expect(state).not.toContain('/')
      expect(state).not.toContain('=')
    })
  })
})
