/**
 * Unit tests for Procore OAuth token encryption module.
 *
 * Tests AES-256-GCM encrypt/decrypt functions used to protect
 * Procore OAuth tokens stored at rest in the database.
 *
 * Uses a deterministic test key: 'a'.repeat(64) => 32 bytes hex-encoded.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// A valid 32-byte key expressed as 64 hex characters
const TEST_KEY = 'a'.repeat(64);

describe('procore/crypto', () => {
  let originalKey: string | undefined;

  beforeEach(() => {
    // Preserve any existing value so we can restore after each test
    originalKey = process.env.INTEGRATION_ENCRYPTION_KEY;
    // Set the test key for most tests
    process.env.INTEGRATION_ENCRYPTION_KEY = TEST_KEY;
  });

  afterEach(() => {
    // Restore original env
    if (originalKey !== undefined) {
      process.env.INTEGRATION_ENCRYPTION_KEY = originalKey;
    } else {
      delete process.env.INTEGRATION_ENCRYPTION_KEY;
    }
    // Reset module cache so crypto.ts re-evaluates on next import
    vi.resetModules();
  });

  it('round-trip encrypt then decrypt produces original plaintext', async () => {
    const { encrypt, decrypt } = await import(
      '@/server/lib/procore/crypto'
    );

    const plaintext = 'my-secret-oauth-token-value-12345';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(plaintext);
  });

  it('encrypting the same input twice produces different ciphertext (random IV)', async () => {
    const { encrypt } = await import('@/server/lib/procore/crypto');

    const plaintext = 'identical-input';
    const a = encrypt(plaintext);
    const b = encrypt(plaintext);

    expect(a).not.toBe(b);
  });

  it('tampered ciphertext throws an error on decrypt', async () => {
    const { encrypt, decrypt } = await import(
      '@/server/lib/procore/crypto'
    );

    const encrypted = encrypt('sensitive-data');
    // Flip one hex character in the ciphertext portion (third segment)
    const parts = encrypted.split(':');
    const cipherHex = parts[2];
    const flipped =
      cipherHex[0] === 'a'
        ? 'b' + cipherHex.slice(1)
        : 'a' + cipherHex.slice(1);
    const tampered = `${parts[0]}:${parts[1]}:${flipped}`;

    expect(() => decrypt(tampered)).toThrow();
  });

  it('throws at module load when INTEGRATION_ENCRYPTION_KEY is missing', async () => {
    delete process.env.INTEGRATION_ENCRYPTION_KEY;
    vi.resetModules();

    await expect(
      import('@/server/lib/procore/crypto')
    ).rejects.toThrow('Missing required env var: INTEGRATION_ENCRYPTION_KEY');
  });

  it('throws at module load when INTEGRATION_ENCRYPTION_KEY is wrong length', async () => {
    // 32 hex chars = only 16 bytes, not the required 32
    process.env.INTEGRATION_ENCRYPTION_KEY = 'a'.repeat(32);
    vi.resetModules();

    await expect(
      import('@/server/lib/procore/crypto')
    ).rejects.toThrow('INTEGRATION_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  });

  it('encrypted output has the format iv:authTag:ciphertext (all hex)', async () => {
    const { encrypt } = await import('@/server/lib/procore/crypto');

    const encrypted = encrypt('format-check');
    const parts = encrypted.split(':');

    expect(parts).toHaveLength(3);
    // IV is 16 bytes = 32 hex chars
    expect(parts[0]).toMatch(/^[0-9a-f]{32}$/);
    // Auth tag is 16 bytes = 32 hex chars
    expect(parts[1]).toMatch(/^[0-9a-f]{32}$/);
    // Ciphertext is non-empty hex
    expect(parts[2]).toMatch(/^[0-9a-f]+$/);
  });

  it('handles empty string encrypt/decrypt round-trip', async () => {
    const { encrypt, decrypt } = await import(
      '@/server/lib/procore/crypto'
    );

    const encrypted = encrypt('');
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe('');
  });

  it('handles unicode content encrypt/decrypt round-trip', async () => {
    const { encrypt, decrypt } = await import(
      '@/server/lib/procore/crypto'
    );

    const plaintext = 'OAuth token with unicode: \u00e9\u00e0\u00fc \u{1F512}';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(plaintext);
  });
});
