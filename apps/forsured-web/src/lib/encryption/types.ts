/**
 * Encryption Types and Interfaces
 *
 * Defines types for field-level encryption, key management, and audit logging
 * following AES-256-GCM encryption standards.
 */

/**
 * Encrypted field structure with authenticated encryption
 */
export interface EncryptedField {
  /** Base64-encoded ciphertext */
  ciphertext: string;

  /** Hex-encoded initialization vector (16 bytes for AES-256-GCM) */
  iv: string;

  /** Hex-encoded authentication tag for integrity verification */
  authTag: string;

  /** Key ID used for encryption (for key rotation support) */
  keyId: string;

  /** Encryption algorithm identifier */
  algorithm: "aes-256-gcm";

  /** ISO 8601 timestamp of encryption */
  encryptedAt: string;

  /** Optional field name for audit logging */
  fieldName?: string;
}

/**
 * Data encryption key metadata
 */
export interface DataEncryptionKey {
  /** Unique key identifier */
  id: string;

  /** Key version for rotation tracking */
  version: number;

  /** ISO 8601 timestamp of key creation */
  createdAt: string;

  /** ISO 8601 timestamp of key rotation (if rotated) */
  rotatedAt?: string;

  /** ISO 8601 timestamp when key should be deprecated */
  deprecatedAt?: string;

  /** Status of the key */
  status: "active" | "deprecated" | "deleted";

  /** Human-readable description */
  description?: string;
}

/**
 * Encryption configuration
 */
export interface EncryptionConfig {
  /** Algorithm to use for field encryption */
  algorithm: "aes-256-gcm";

  /** IV length in bytes (16 for AES-256-GCM) */
  ivLength: 16;

  /** Auth tag length in bytes (16 for AES-256-GCM) */
  authTagLength: 16;

  /** Key cache TTL in milliseconds (default: 5 minutes) */
  keyCacheTTL: number;

  /** Maximum key age in days before rotation required */
  maxKeyAgeDays: number;
}

/**
 * Default encryption configuration
 */
export const DEFAULT_ENCRYPTION_CONFIG: EncryptionConfig = {
  algorithm: "aes-256-gcm",
  ivLength: 16,
  authTagLength: 16,
  keyCacheTTL: 5 * 60 * 1000, // 5 minutes
  maxKeyAgeDays: 90, // Rotate every 90 days
};

/**
 * Encryption audit event types
 */
export enum EncryptionAuditEvent {
  FIELD_ENCRYPTED = "encryption.field.encrypted",
  FIELD_DECRYPTED = "encryption.field.decrypted",
  ENCRYPTION_FAILED = "encryption.field.failed",
  DECRYPTION_FAILED = "encryption.field.decryption_failed",
  KEY_RETRIEVED = "encryption.key.retrieved",
  KEY_CACHED = "encryption.key.cached",
  KEY_ROTATION_STARTED = "encryption.key.rotation_started",
  KEY_ROTATION_COMPLETED = "encryption.key.rotation_completed",
  KEY_ROTATION_FAILED = "encryption.key.rotation_failed",
  KEY_ACCESS_DENIED = "encryption.key.access_denied",
}

/**
 * Audit log entry for encryption operations
 */
export interface EncryptionAuditLog {
  /** Event type */
  event: EncryptionAuditEvent;

  /** ISO 8601 timestamp */
  timestamp: string;

  /** User ID who triggered the operation (if applicable) */
  userId?: string;

  /** Key ID involved in the operation */
  keyId?: string;

  /** Field name being encrypted/decrypted */
  fieldName?: string;

  /** Success status */
  success: boolean;

  /** Error message if operation failed */
  errorMessage?: string;

  /** Performance metrics in milliseconds */
  durationMs?: number;

  /** Additional context */
  metadata?: Record<string, unknown>;
}

/**
 * Key rotation configuration
 */
export interface KeyRotationConfig {
  /** Old key ID being rotated out */
  oldKeyId: string;

  /** New key ID being rotated in */
  newKeyId: string;

  /** ISO 8601 timestamp when rotation started */
  startedAt: string;

  /** ISO 8601 timestamp when rotation completed */
  completedAt?: string;

  /** Total records to re-encrypt */
  totalRecords: number;

  /** Records successfully re-encrypted */
  completedRecords: number;

  /** Records failed during re-encryption */
  failedRecords: number;

  /** Rotation status */
  status: "pending" | "in_progress" | "completed" | "failed";

  /** Error message if rotation failed */
  errorMessage?: string;
}

/**
 * Data classification levels for PII protection
 */
export enum DataClassification {
  RESTRICTED = "restricted", // SSN, Tax ID, Bank Accounts - Requires field-level encryption
  CONFIDENTIAL = "confidential", // Policy numbers, financials - Database encryption only
  INTERNAL = "internal", // User emails, names - Database encryption only
  PUBLIC = "public", // Public information - TLS only
}

/**
 * Classified field metadata
 */
export interface ClassifiedField {
  /** Field identifier (e.g., 'user.ssn') */
  field: string;

  /** Data classification level */
  classification: DataClassification;

  /** Whether field-level encryption is required */
  encryptionRequired: boolean;

  /** Data retention period (ISO 8601 duration) */
  retentionPeriod: string;

  /** PII category if applicable */
  piiCategory?: "identifier" | "financial" | "biometric" | "health";
}

/**
 * Error types for encryption operations
 */
export class EncryptionError extends Error {
  constructor(
    message: string,
    public code:
      | "ENCRYPTION_FAILED"
      | "DECRYPTION_FAILED"
      | "INVALID_KEY"
      | "INVALID_CIPHERTEXT"
      | "KEY_NOT_FOUND",
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "EncryptionError";
  }
}

/**
 * Encryption performance metrics
 */
export interface EncryptionMetrics {
  /** Operation type */
  operation: "encrypt" | "decrypt" | "key_retrieval";

  /** Duration in milliseconds */
  durationMs: number;

  /** ISO 8601 timestamp */
  timestamp: string;

  /** Success status */
  success: boolean;

  /** Field name (for encrypt/decrypt) */
  fieldName?: string;

  /** Key ID used */
  keyId?: string;

  /** Whether key was retrieved from cache */
  fromCache?: boolean;
}

/**
 * Vault secret response
 */
export interface VaultSecret {
  /** Secret ID */
  id: string;

  /** Secret name/key */
  name: string;

  /** Base64-encoded secret value */
  secret: string;

  /** Secret version */
  version: number;

  /** ISO 8601 timestamp of creation */
  createdAt: string;

  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}

/**
 * Supabase Vault client interface
 */
export interface IVaultClient {
  /** Retrieve a data encryption key by ID */
  getDataKey(keyId: string): Promise<Buffer>;

  /** Create a new data encryption key */
  createDataKey(
    keyId: string,
    description?: string,
  ): Promise<DataEncryptionKey>;

  /** Rotate a data encryption key */
  rotateKey(oldKeyId: string, newKeyId: string): Promise<void>;

  /** List all encryption keys */
  listKeys(): Promise<DataEncryptionKey[]>;

  /** Check if a key exists */
  keyExists(keyId: string): Promise<boolean>;
}

/**
 * Field encryption service interface
 */
export interface IFieldEncryptionService {
  /** Encrypt a plaintext field */
  encrypt(plaintext: string, fieldName: string): Promise<EncryptedField>;

  /** Decrypt an encrypted field */
  decrypt(encryptedField: EncryptedField): Promise<string>;

  /** Verify encrypted field integrity */
  verify(encryptedField: EncryptedField): Promise<boolean>;

  /** Get current encryption metrics */
  getMetrics(): EncryptionMetrics[];
}

/**
 * Key rotation service interface
 */
export interface IKeyRotationService {
  /** Start a key rotation process */
  startRotation(oldKeyId: string, newKeyId: string): Promise<KeyRotationConfig>;

  /** Get rotation status */
  getRotationStatus(oldKeyId: string): Promise<KeyRotationConfig | null>;

  /** Continue a paused rotation */
  continueRotation(oldKeyId: string): Promise<void>;

  /** Cancel an in-progress rotation */
  cancelRotation(oldKeyId: string): Promise<void>;
}
