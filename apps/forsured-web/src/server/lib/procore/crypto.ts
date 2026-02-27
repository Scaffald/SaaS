/**
 * AES-256-GCM encryption module for Procore OAuth token storage.
 *
 * Encrypts and decrypts OAuth tokens before storing them at rest
 * in the database. Uses authenticated encryption (GCM) to ensure
 * both confidentiality and integrity of stored tokens.
 *
 * Environment requirement:
 *   INTEGRATION_ENCRYPTION_KEY - 64 hex characters (32 bytes) AES key.
 *   The application hard-fails at startup if this is missing or invalid.
 *
 * Encrypted format: "iv:authTag:ciphertext" (all hex-encoded)
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128-bit IV for GCM

const keyHex = process.env.INTEGRATION_ENCRYPTION_KEY;
if (!keyHex) {
  throw new Error('Missing required env var: INTEGRATION_ENCRYPTION_KEY');
}

const key = Buffer.from(keyHex, 'hex');
if (key.length !== 32) {
  throw new Error(
    'INTEGRATION_ENCRYPTION_KEY must be 64 hex characters (32 bytes)',
  );
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 *
 * @param plaintext - The string to encrypt (e.g. an OAuth access token)
 * @returns Encrypted payload as "iv:authTag:ciphertext" (all hex)
 */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a payload previously produced by encrypt().
 *
 * @param encryptedStr - The "iv:authTag:ciphertext" string from encrypt()
 * @returns The original plaintext
 * @throws If the data has been tampered with (GCM auth tag verification fails)
 */
export function decrypt(encryptedStr: string): string {
  const [ivHex, authTagHex, ciphertext] = encryptedStr.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
