/**
 * PKCE Utilities Tests
 * OAuth 2.0 + RBAC Authentication System
 */

import { describe, it, expect } from 'vitest';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  generatePKCEParams,
  validateCodeVerifier,
  validateState,
} from '../pkce';

describe('PKCE Utilities', () => {
  describe('generateCodeVerifier', () => {
    it('should generate a valid code verifier', () => {
      const verifier = generateCodeVerifier();

      // Should be 43 characters (32 bytes in base64url)
      expect(verifier).toHaveLength(43);

      // Should only contain base64url characters
      expect(verifier).toMatch(/^[A-Za-z0-9\-_]+$/);
    });

    it('should generate unique verifiers', () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();

      expect(verifier1).not.toBe(verifier2);
    });

    it('should generate verifiers without padding', () => {
      const verifier = generateCodeVerifier();

      // Should not contain = padding
      expect(verifier).not.toContain('=');
    });
  });

  describe('generateCodeChallenge', () => {
    it('should generate deterministic challenge from verifier', async () => {
      const verifier = 'test-verifier-123';
      const challenge1 = await generateCodeChallenge(verifier);
      const challenge2 = await generateCodeChallenge(verifier);

      expect(challenge1).toBe(challenge2);
    });

    it('should generate different challenges for different verifiers', async () => {
      const verifier1 = 'test-verifier-1';
      const verifier2 = 'test-verifier-2';

      const challenge1 = await generateCodeChallenge(verifier1);
      const challenge2 = await generateCodeChallenge(verifier2);

      expect(challenge1).not.toBe(challenge2);
    });

    it('should generate base64url encoded challenge', async () => {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);

      // Should only contain base64url characters
      expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/);

      // Should not contain padding
      expect(challenge).not.toContain('=');
    });
  });

  describe('generateState', () => {
    it('should generate a valid state parameter', () => {
      const state = generateState();

      // Should be at least 8 characters
      expect(state.length).toBeGreaterThanOrEqual(8);

      // Should only contain base64url characters
      expect(state).toMatch(/^[A-Za-z0-9\-_]+$/);
    });

    it('should generate unique state values', () => {
      const state1 = generateState();
      const state2 = generateState();

      expect(state1).not.toBe(state2);
    });
  });

  describe('generatePKCEParams', () => {
    it('should generate complete PKCE parameters', async () => {
      const params = await generatePKCEParams();

      expect(params).toHaveProperty('codeVerifier');
      expect(params).toHaveProperty('codeChallenge');
      expect(params).toHaveProperty('state');

      expect(params.codeVerifier).toHaveLength(43);
      expect(params.codeChallenge.length).toBeGreaterThan(0);
      expect(params.state.length).toBeGreaterThanOrEqual(8);
    });

    it('should generate unique PKCE parameters each time', async () => {
      const params1 = await generatePKCEParams();
      const params2 = await generatePKCEParams();

      expect(params1.codeVerifier).not.toBe(params2.codeVerifier);
      expect(params1.codeChallenge).not.toBe(params2.codeChallenge);
      expect(params1.state).not.toBe(params2.state);
    });
  });

  describe('validateCodeVerifier', () => {
    it('should validate correct code verifier', () => {
      const verifier = generateCodeVerifier();
      expect(validateCodeVerifier(verifier)).toBe(true);
    });

    it('should reject verifier that is too short', () => {
      const shortVerifier = 'abc'; // Less than 43 characters
      expect(validateCodeVerifier(shortVerifier)).toBe(false);
    });

    it('should reject verifier that is too long', () => {
      const longVerifier = 'a'.repeat(129); // More than 128 characters
      expect(validateCodeVerifier(longVerifier)).toBe(false);
    });

    it('should reject verifier with invalid characters', () => {
      const invalidVerifier = 'a'.repeat(43) + '!'; // Contains !
      expect(validateCodeVerifier(invalidVerifier)).toBe(false);
    });

    it('should reject empty verifier', () => {
      expect(validateCodeVerifier('')).toBe(false);
    });
  });

  describe('validateState', () => {
    it('should validate correct state', () => {
      const state = generateState();
      expect(validateState(state)).toBe(true);
    });

    it('should reject state that is too short', () => {
      const shortState = 'abc'; // Less than 8 characters
      expect(validateState(shortState)).toBe(false);
    });

    it('should reject state with invalid characters', () => {
      const invalidState = 'abcdefgh!'; // Contains !
      expect(validateState(invalidState)).toBe(false);
    });

    it('should reject empty state', () => {
      expect(validateState('')).toBe(false);
    });
  });
});
