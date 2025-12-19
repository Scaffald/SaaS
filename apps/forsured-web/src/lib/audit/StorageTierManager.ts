/**
 * Storage Tier Manager
 *
 * Manages 3-tier storage for audit logs:
 * - Hot Storage: PostgreSQL (0-90 days) - Fast queries
 * - Warm Storage: S3 Standard (90 days - 2 years) - Medium cost
 * - Cold Storage: S3 Glacier (2-7 years) - Low cost, slow retrieval
 *
 * Automated archival transitions and retention policy enforcement
 */

import type {
  AuditLogRecord,
  AuditLogArchiveMetadata,
} from './types';

// Storage tier configuration
const STORAGE_TIERS = {
  hot: {
    name: 'hot',
    duration_days: 90,
    storage: 'PostgreSQL',
    cost_per_gb_month: 0.23,
  },
  warm: {
    name: 'warm',
    duration_days: 730, // 2 years
    storage: 'S3 Standard',
    cost_per_gb_month: 0.023,
  },
  cold: {
    name: 'cold',
    duration_days: 2555, // 7 years total
    storage: 'S3 Glacier',
    cost_per_gb_month: 0.004,
  },
} as const;

// Supabase client - will be injected
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabaseClient: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initializeStorageTierManager(client: any) {
  supabaseClient = client;
}

/**
 * Storage Tier Manager class
 */
export class StorageTierManager {
  /**
   * Archive old logs from hot storage to warm storage
   * Runs daily to move logs older than 90 days
   *
   * @returns Number of logs archived
   */
  async archiveToWarmStorage(): Promise<number> {
    const archiveDate = new Date();
    archiveDate.setDate(archiveDate.getDate() - STORAGE_TIERS.hot.duration_days);

    // 1. Query logs to archive
    const { data: logs, error } = await supabaseClient
      .from('audit_log')
      .select('*')
      .lt('created_at', archiveDate.toISOString())
      .is('archived_at', null)
      .order('created_at', { ascending: true })
      .limit(10000); // Batch size

    if (error) {
      throw new Error(`Failed to query logs for archival: ${error.message}`);
    }

    if (!logs || logs.length === 0) {
      return 0;
    }

    // 2. Compress and write to S3 (warm storage)
    const archiveMetadata = await this.writeToS3WarmStorage(logs);

    // 3. Create archive index entry
    await this.createArchiveIndex(archiveMetadata);

    // 4. Mark logs as archived in database
    const logIds = logs.map((log: AuditLogRecord) => log.id);
    await supabaseClient
      .from('audit_log')
      .update({ archived_at: new Date().toISOString() })
      .in('id', logIds);

    // 5. Verify archive integrity
    const verified = await this.verifyArchiveIntegrity(
      archiveMetadata.file_path,
      archiveMetadata.checksum
    );

    if (!verified) {
      throw new Error(
        `Archive integrity check failed for ${archiveMetadata.file_path}`
      );
    }

    // 6. Delete from hot storage (after 7 day grace period)
    const gracePeriod = new Date();
    gracePeriod.setDate(gracePeriod.getDate() - 7);

    await supabaseClient
      .from('audit_log')
      .delete()
      .lt('archived_at', gracePeriod.toISOString());

    console.log(`Archived ${logs.length} audit logs to ${archiveMetadata.file_path}`);
    return logs.length;
  }

  /**
   * Transition logs from warm to cold storage
   * Runs based on S3 lifecycle policies (automatic)
   * This method primarily handles metadata updates
   */
  async transitionToColdStorage(): Promise<number> {
    const transitionDate = new Date();
    transitionDate.setDate(
      transitionDate.getDate() - STORAGE_TIERS.warm.duration_days
    );

    // Update archive index to reflect cold storage
    const { data, error } = await supabaseClient
      .from('audit_log_archive_index')
      .update({ storage_tier: 'cold' })
      .eq('storage_tier', 'warm')
      .lt('end_date', transitionDate.toISOString());

    if (error) {
      throw new Error(`Failed to transition to cold storage: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * Purge logs after 7-year retention period
   * @returns Number of logs purged
   */
  async purgeExpiredLogs(): Promise<number> {
    const purgeDate = new Date();
    purgeDate.setFullYear(purgeDate.getFullYear() - 7);

    // 1. Identify logs to purge
    const { data: logsToPurge, error: queryError } = await supabaseClient
      .from('audit_log')
      .select('id')
      .lt('purge_after', purgeDate.toISOString());

    if (queryError) {
      throw new Error(`Failed to query logs for purge: ${queryError.message}`);
    }

    if (!logsToPurge || logsToPurge.length === 0) {
      return 0;
    }

    // 2. Check for legal holds (don't purge if under legal hold)
    const legalHolds = await this.checkLegalHolds(
      logsToPurge.map((log: AuditLogRecord) => log.id!)
    );

    const purgeableIds = logsToPurge
      .filter((log: AuditLogRecord) => !legalHolds.includes(log.id!))
      .map((log: AuditLogRecord) => log.id);

    if (purgeableIds.length === 0) {
      return 0;
    }

    // 3. Create purge audit record (before deletion)
    await supabaseClient.from('audit_log_purge_history').insert({
      purge_date: new Date().toISOString(),
      records_purged: purgeableIds.length,
      purge_reason: 'retention_period_expired',
      purged_record_ids: purgeableIds,
    });

    // 4. Delete from database
    const { error: deleteError } = await supabaseClient
      .from('audit_log')
      .delete()
      .in('id', purgeableIds);

    if (deleteError) {
      throw new Error(`Failed to purge logs: ${deleteError.message}`);
    }

    // 5. Delete from S3 (archives older than 7 years)
    await this.purgeOldArchives(purgeDate);

    console.log(`Purged ${purgeableIds.length} expired audit logs`);
    return purgeableIds.length;
  }

  /**
   * Query logs from archived storage (warm or cold)
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Array of audit log records
   */
  async queryArchivedLogs(
    startDate: Date,
    endDate: Date
  ): Promise<AuditLogRecord[]> {
    // 1. Find relevant archive files
    const { data: archiveFiles, error } = await supabaseClient
      .from('audit_log_archive_index')
      .select('*')
      .gte('end_date', startDate.toISOString())
      .lte('start_date', endDate.toISOString());

    if (error) {
      throw new Error(`Failed to query archive index: ${error.message}`);
    }

    if (!archiveFiles || archiveFiles.length === 0) {
      return [];
    }

    const allLogs: AuditLogRecord[] = [];

    for (const file of archiveFiles) {
      // Check if in cold storage (Glacier)
      if (file.storage_tier === 'cold') {
        // TODO: Initiate Glacier restore (takes 12-48 hours)
        throw new Error(
          `Archive ${file.file_path} is in cold storage (Glacier). ` +
            `Restoration must be initiated and will be available in 12-48 hours.`
        );
      }

      // Download from S3 warm storage
      const logs = await this.downloadFromS3(file);
      allLogs.push(...logs);
    }

    // Filter by exact date range
    return allLogs.filter(log => {
      const logDate = new Date(log.created_at!);
      return logDate >= startDate && logDate <= endDate;
    });
  }

  /**
   * Get storage tier statistics
   */
  async getStorageStats(): Promise<{
    hot: { count: number; size_mb: number };
    warm: { count: number; size_mb: number };
    cold: { count: number; size_mb: number };
    total_cost_monthly: number;
  }> {
    // Hot storage (PostgreSQL)
    const { count: hotCount } = await supabaseClient
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .is('archived_at', null);

    // Warm and cold storage (from archive index)
    const { data: warmArchives } = await supabaseClient
      .from('audit_log_archive_index')
      .select('record_count, file_size_bytes')
      .eq('storage_tier', 'warm');

    const { data: coldArchives } = await supabaseClient
      .from('audit_log_archive_index')
      .select('record_count, file_size_bytes')
      .eq('storage_tier', 'cold');

    const warmStats = this.aggregateArchiveStats(warmArchives || []);
    const coldStats = this.aggregateArchiveStats(coldArchives || []);

    // Estimate hot storage size (average 2KB per record)
    const hotSizeMB = ((hotCount || 0) * 2048) / (1024 * 1024);

    // Calculate monthly costs
    const hotCost =
      (hotSizeMB / 1024) * STORAGE_TIERS.hot.cost_per_gb_month;
    const warmCost =
      (warmStats.size_mb / 1024) * STORAGE_TIERS.warm.cost_per_gb_month;
    const coldCost =
      (coldStats.size_mb / 1024) * STORAGE_TIERS.cold.cost_per_gb_month;

    return {
      hot: { count: hotCount || 0, size_mb: hotSizeMB },
      warm: { count: warmStats.count, size_mb: warmStats.size_mb },
      cold: { count: coldStats.count, size_mb: coldStats.size_mb },
      total_cost_monthly: hotCost + warmCost + coldCost,
    };
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Write logs to S3 warm storage (compressed JSONL)
   */
  private async writeToS3WarmStorage(
    logs: AuditLogRecord[]
  ): Promise<AuditLogArchiveMetadata> {
    const date = new Date().toISOString().split('T')[0];
    const [year, month, day] = date.split('-');
    const timestamp = Date.now();
    const filename = `audit_logs_${date}_${timestamp}.jsonl.gz`;
    const s3Key = `warm/${year}/${month}/${day}/${filename}`;

    // Convert to JSON Lines format
    const jsonl = logs.map(log => JSON.stringify(log)).join('\n');

    // Compress (in production, use pako or zlib)
    const compressed = this.compressGzip(jsonl);

    // Calculate checksum
    const checksum = this.calculateChecksum(compressed);

    // Upload to S3 (via Supabase Storage)
    const { error } = await supabaseClient.storage
      .from('audit-logs')
      .upload(s3Key, compressed, {
        contentType: 'application/gzip',
        cacheControl: 'max-age=31536000', // 1 year
      });

    if (error) {
      throw new Error(`Failed to upload to S3: ${error.message}`);
    }

    return {
      id: this.generateUUID(),
      file_path: s3Key,
      storage_tier: 'warm',
      start_date: logs[0].created_at!,
      end_date: logs[logs.length - 1].created_at!,
      record_count: logs.length,
      file_size_bytes: compressed.byteLength,
      checksum,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Download and decompress logs from S3
   */
  private async downloadFromS3(
    archiveMetadata: AuditLogArchiveMetadata
  ): Promise<AuditLogRecord[]> {
    // Download from S3
    const { data, error } = await supabaseClient.storage
      .from('audit-logs')
      .download(archiveMetadata.file_path);

    if (error) {
      throw new Error(`Failed to download from S3: ${error.message}`);
    }

    // Convert Blob to ArrayBuffer
    const arrayBuffer = await data.arrayBuffer();
    const compressed = new Uint8Array(arrayBuffer);

    // Verify checksum
    const checksum = this.calculateChecksum(compressed);
    if (checksum !== archiveMetadata.checksum) {
      throw new Error(`Checksum mismatch for ${archiveMetadata.file_path}`);
    }

    // Decompress
    const decompressed = this.decompressGzip(compressed);

    // Parse JSON Lines
    const logs = decompressed
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line) as AuditLogRecord);

    return logs;
  }

  /**
   * Create archive index entry
   */
  private async createArchiveIndex(
    metadata: AuditLogArchiveMetadata
  ): Promise<void> {
    const { error } = await supabaseClient
      .from('audit_log_archive_index')
      .insert(metadata);

    if (error) {
      throw new Error(`Failed to create archive index: ${error.message}`);
    }
  }

  /**
   * Verify archive integrity via checksum
   */
  private async verifyArchiveIntegrity(
    filePath: string,
    expectedChecksum: string
  ): Promise<boolean> {
    const { data, error } = await supabaseClient.storage
      .from('audit-logs')
      .download(filePath);

    if (error) {
      return false;
    }

    const arrayBuffer = await data.arrayBuffer();
    const actualChecksum = this.calculateChecksum(new Uint8Array(arrayBuffer));

    return actualChecksum === expectedChecksum;
  }

  /**
   * Check if logs are under legal hold
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async checkLegalHolds(_logIds: string[]): Promise<string[]> {
    // TODO: Implement legal hold checking
    // For now, return empty array (no holds)
    return [];
  }

  /**
   * Purge old archives from S3
   */
  private async purgeOldArchives(purgeDate: Date): Promise<void> {
    const { data: archivesToDelete, error } = await supabaseClient
      .from('audit_log_archive_index')
      .select('file_path')
      .lt('end_date', purgeDate.toISOString());

    if (error || !archivesToDelete) {
      return;
    }

    for (const archive of archivesToDelete) {
      // Delete from S3
      await supabaseClient.storage
        .from('audit-logs')
        .remove([archive.file_path]);

      // Delete from index
      await supabaseClient
        .from('audit_log_archive_index')
        .delete()
        .eq('file_path', archive.file_path);
    }
  }

  /**
   * Aggregate archive statistics
   */
  private aggregateArchiveStats(
    archives: Array<{ record_count: number; file_size_bytes: number }>
  ): { count: number; size_mb: number } {
    const count = archives.reduce((sum, a) => sum + a.record_count, 0);
    const sizeBytes = archives.reduce((sum, a) => sum + a.file_size_bytes, 0);
    const size_mb = sizeBytes / (1024 * 1024);

    return { count, size_mb };
  }

  /**
   * Compress data with gzip
   * In production, use pako or zlib library
   */
  private compressGzip(data: string): Uint8Array {
    // Placeholder: In production, use actual gzip compression
    // e.g., import pako from 'pako'; return pako.gzip(data);
    return new TextEncoder().encode(data);
  }

  /**
   * Decompress gzip data
   * In production, use pako or zlib library
   */
  private decompressGzip(data: Uint8Array): string {
    // Placeholder: In production, use actual gzip decompression
    // e.g., import pako from 'pako'; return pako.ungzip(data, { to: 'string' });
    return new TextDecoder().decode(data);
  }

  /**
   * Calculate SHA-256 checksum
   */
  private calculateChecksum(data: Uint8Array): string {
    // In browser, use Web Crypto API
    // In Node.js, use crypto module
    // Placeholder implementation
    return Array.from(data)
      .reduce((hash, byte) => ((hash << 5) - hash + byte) | 0, 0)
      .toString(16);
  }

  /**
   * Generate UUID
   */
  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

// Singleton instance
export const storageTierManager = new StorageTierManager();

/**
 * Convenience function to archive logs
 */
export const archiveOldLogs = () => storageTierManager.archiveToWarmStorage();

/**
 * Convenience function to query archived logs
 */
export const queryArchivedLogs = (startDate: Date, endDate: Date) =>
  storageTierManager.queryArchivedLogs(startDate, endDate);

/**
 * Convenience function to get storage statistics
 */
export const getStorageStats = () => storageTierManager.getStorageStats();
