/**
 * Field Encryption Service
 *
 * Implements AES-256-GCM field-level encryption for PII protection
 * Provides authenticated encryption with key rotation support
 */

import {
  EncryptionError,
  type EncryptedField,
  type IFieldEncryptionService,
  type IVaultClient,
  type EncryptionMetrics,
  DEFAULT_ENCRYPTION_CONFIG,
} from './types';

/**
 * In-memory LRU cache for encryption keys
 */
class KeyCache {
  private cache = new Map<string, { key: Buffer; timestamp: number }>();
  private readonly ttl: number;

  constructor(ttl: number) {
    this.ttl = ttl;
  }

  get(keyId: string): Buffer | undefined {
    const entry = this.cache.get(keyId);
    if (!entry) return undefined;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(keyId);
      return undefined;
    }

    return entry.key;
  }

  set(keyId: string, key: Buffer): void {
    this.cache.set(keyId, { key, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Field Encryption Service Implementation
 */
export class FieldEncryptionService implements IFieldEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = DEFAULT_ENCRYPTION_CONFIG.ivLength;
  private readonly authTagLength = DEFAULT_ENCRYPTION_CONFIG.authTagLength;
  private readonly keyId: string;
  private readonly vaultClient: IVaultClient;
  private readonly keyCache: KeyCache;
  private readonly metrics: EncryptionMetrics[] = [];

  constructor(vaultClient: IVaultClient) {
    this.vaultClient = vaultClient;
    this.keyId = process.env.VITE_ENCRYPTION_KEY_ID || 'default-key-id';
    this.keyCache = new KeyCache(DEFAULT_ENCRYPTION_CONFIG.keyCacheTTL);
  }

  /**
   * Encrypt plaintext using AES-256-GCM
   */
  async encrypt(plaintext: string, fieldName: string): Promise<EncryptedField> {
    const startTime = performance.now();

    try {
      // Get encryption key
      const dataKey = await this.getDataKey(this.keyId);

      // Generate random IV (16 bytes for AES-256-GCM)
      const iv = this.generateIV();

      // Import key for Web Crypto API
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        dataKey,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );

      // Encrypt
      const plaintextBuffer = new TextEncoder().encode(plaintext);
      const cipherBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: this.authTagLength * 8, // Convert bytes to bits
        },
        cryptoKey,
        plaintextBuffer
      );

      // Extract ciphertext and auth tag
      // In AES-GCM, the auth tag is appended to the ciphertext
      const cipherArray = new Uint8Array(cipherBuffer);
      const ciphertext = cipherArray.slice(0, -this.authTagLength);
      const authTag = cipherArray.slice(-this.authTagLength);

      const encrypted: EncryptedField = {
        ciphertext: this.bufferToHex(ciphertext),
        iv: this.bufferToHex(iv),
        authTag: this.bufferToHex(authTag),
        keyId: this.keyId,
        algorithm: 'aes-256-gcm',
        encryptedAt: new Date().toISOString(),
        fieldName,
      };

      // Record metrics
      this.recordMetric({
        operation: 'encrypt',
        durationMs: performance.now() - startTime,
        timestamp: new Date().toISOString(),
        success: true,
        fieldName,
        keyId: this.keyId,
      });

      return encrypted;
    } catch (error) {
      // Record failure metric
      this.recordMetric({
        operation: 'encrypt',
        durationMs: performance.now() - startTime,
        timestamp: new Date().toISOString(),
        success: false,
        fieldName,
        keyId: this.keyId,
      });

      throw new EncryptionError(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ENCRYPTION_FAILED',
        { fieldName, error }
      );
    }
  }

  /**
   * Decrypt ciphertext using AES-256-GCM
   */
  async decrypt(encryptedField: EncryptedField): Promise<string> {
    const startTime = performance.now();

    try {
      // Validate encrypted field
      if (!this.isValidEncryptedField(encryptedField)) {
        throw new EncryptionError(
          'Invalid encrypted field structure',
          'INVALID_CIPHERTEXT',
          { encryptedField }
        );
      }

      // Get decryption key
      const dataKey = await this.getDataKey(encryptedField.keyId);

      // Parse hex values
      const iv = this.hexToBuffer(encryptedField.iv);
      const ciphertext = this.hexToBuffer(encryptedField.ciphertext);
      const authTag = this.hexToBuffer(encryptedField.authTag);

      // Combine ciphertext and auth tag for AES-GCM
      const combined = new Uint8Array(ciphertext.length + authTag.length);
      combined.set(ciphertext, 0);
      combined.set(authTag, ciphertext.length);

      // Import key for Web Crypto API
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        dataKey,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      // Decrypt
      const plaintextBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: this.authTagLength * 8, // Convert bytes to bits
        },
        cryptoKey,
        combined
      );

      const plaintext = new TextDecoder().decode(plaintextBuffer);

      // Record metrics
      this.recordMetric({
        operation: 'decrypt',
        durationMs: performance.now() - startTime,
        timestamp: new Date().toISOString(),
        success: true,
        keyId: encryptedField.keyId,
      });

      return plaintext;
    } catch (error: unknown) {
      // Record failure metric
      this.recordMetric({
        operation: 'decrypt',
        durationMs: performance.now() - startTime,
        timestamp: new Date().toISOString(),
        success: false,
        keyId: encryptedField.keyId,
      });

      // Check if it's an integrity/tampering error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorName = error instanceof Error ? error.name : '';

      // Web Crypto API throws OperationError for GCM authentication failures
      if (
        errorName === 'OperationError' ||
        errorMessage.toLowerCase().includes('decrypt') ||
        errorMessage.toLowerCase().includes('tag') ||
        errorMessage.toLowerCase().includes('authentication') ||
        errorMessage.toLowerCase().includes('integrity')
      ) {
        throw new EncryptionError(
          'Decryption failed: Data integrity check failed. The ciphertext may have been tampered with.',
          'DECRYPTION_FAILED',
          { error }
        );
      }

      throw new EncryptionError(
        `Decryption failed: ${errorMessage}`,
        'DECRYPTION_FAILED',
        { error }
      );
    }
  }

  /**
   * Verify encrypted field integrity without decrypting
   */
  async verify(encryptedField: EncryptedField): Promise<boolean> {
    try {
      // Basic structure validation
      if (!this.isValidEncryptedField(encryptedField)) {
        return false;
      }

      // Try to decrypt (this will verify auth tag)
      await this.decrypt(encryptedField);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get encryption metrics
   */
  getMetrics(): EncryptionMetrics[] {
    const metrics = [...this.metrics];
    this.metrics.length = 0; // Clear metrics after reading
    return metrics;
  }

  /**
   * Retrieve data encryption key from vault (with caching)
   */
  private async getDataKey(keyId: string, skipCache = false): Promise<Buffer> {
    const startTime = performance.now();
    let fromCache = false;

    try {
      // Check cache first (unless explicitly skipped)
      if (!skipCache) {
        const cached = this.keyCache.get(keyId);
        if (cached) {
          fromCache = true;
          this.recordMetric({
            operation: 'key_retrieval',
            durationMs: performance.now() - startTime,
            timestamp: new Date().toISOString(),
            success: true,
            keyId,
            fromCache: true,
          });
          return cached;
        }
      }

      // Fetch from vault
      const key = await this.vaultClient.getDataKey(keyId);

      // Validate key length (256 bits = 32 bytes)
      if (key.length !== 32) {
        throw new EncryptionError(
          `Invalid key length: expected 32 bytes, got ${key.length}`,
          'INVALID_KEY',
          { keyId, keyLength: key.length }
        );
      }

      // Cache the key
      this.keyCache.set(keyId, key);

      this.recordMetric({
        operation: 'key_retrieval',
        durationMs: performance.now() - startTime,
        timestamp: new Date().toISOString(),
        success: true,
        keyId,
        fromCache: false,
      });

      return key;
    } catch (error: unknown) {
      // Remove from cache if key retrieval failed
      this.keyCache.clear();

      this.recordMetric({
        operation: 'key_retrieval',
        durationMs: performance.now() - startTime,
        timestamp: new Date().toISOString(),
        success: false,
        keyId,
        fromCache,
      });

      if (error instanceof EncryptionError) {
        throw error;
      }

      throw new EncryptionError(
        `Key retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'KEY_NOT_FOUND',
        { keyId, error }
      );
    }
  }

  /**
   * Generate cryptographically random IV
   */
  private generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(this.ivLength));
  }

  /**
   * Validate encrypted field structure (basic validation only)
   */
  private isValidEncryptedField(field: EncryptedField): boolean {
    // Allow empty ciphertext (for empty string encryption)
    if (field.ciphertext === undefined || field.ciphertext === null || !field.iv || !field.authTag) {
      return false;
    }

    // Validate IV length (16 bytes = 32 hex chars)
    if (field.iv.length !== this.ivLength * 2) {
      return false;
    }

    // Validate auth tag length (16 bytes = 32 hex chars)
    if (field.authTag.length !== this.authTagLength * 2) {
      return false;
    }

    // Basic hex format validation (allow empty ciphertext)
    // We don't validate ciphertext length here as it varies based on plaintext
    const hexRegex = /^[0-9a-fA-F]*$/;
    if (!hexRegex.test(field.ciphertext)) {
      return false;
    }

    // IV and authTag must be valid hex
    if (!hexRegex.test(field.iv) || !hexRegex.test(field.authTag)) {
      return false;
    }

    // Ciphertext must have even length (valid hex encoding)
    if (field.ciphertext.length % 2 !== 0) {
      return false;
    }

    return true;
  }

  /**
   * Convert buffer to hex string
   */
  private bufferToHex(buffer: Uint8Array): string {
    return Array.from(buffer)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert hex string to buffer
   */
  private hexToBuffer(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  /**
   * Record performance metric
   */
  private recordMetric(metric: EncryptionMetrics): void {
    this.metrics.push(metric);

    // Keep only last 100 metrics to prevent memory leak
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
  }
}
