/**
 * Document Migration Script
 * REQ-1: Migrate documents from MockDatabase to Scaffald
 *
 * This script migrates existing documents from Forsured's MockDatabase
 * to Scaffald's document storage system.
 *
 * Usage:
 *   npx tsx scripts/migrate-documents-to-scaffald.ts --dry-run     # Preview migration
 *   npx tsx scripts/migrate-documents-to-scaffald.ts               # Execute migration
 *   npx tsx scripts/migrate-documents-to-scaffald.ts --verify      # Verify checksums
 */

import { scaffaldClient } from '../src/lib/scaffald/client';
import mockDatabase from '../src/utils/mockDataStore';
import type { Document as MockDocument } from '../src/types/document';
import type { UploadDocumentInput, DocumentCategory } from '../src/lib/scaffald/types';

interface MigrationResult {
  totalDocuments: number;
  migrated: number;
  failed: number;
  skipped: number;
  errors: Array<{ documentId: string; error: string }>;
}

interface MigrationOptions {
  dryRun: boolean;
  verify: boolean;
  organizationId: string;
}

/**
 * Map MockDatabase document type to Scaffald category
 */
function mapDocumentCategory(docType: string): DocumentCategory {
  const categoryMap: Record<string, DocumentCategory> = {
    coi: 'certifications',
    gl_coi: 'certifications',
    wc_coi: 'certifications',
    auto_coi: 'certifications',
    umbrella_coi: 'certifications',
    contract: 'contracts',
    template: 'templates',
    compliance: 'compliance',
    onboarding: 'onboarding',
  };

  return categoryMap[docType] || 'general';
}

/**
 * Convert base64 to Uint8Array for checksum verification
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Calculate SHA-256 checksum
 */
async function calculateChecksum(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Migrate a single document to Scaffald
 */
async function migrateDocument(
  doc: MockDocument & { file_data?: string; file_name?: string; file_type?: string },
  options: MigrationOptions
): Promise<{ success: boolean; scaffaldId?: string; error?: string }> {
  try {
    // Check if document has file data
    if (!doc.file_data) {
      return { success: false, error: 'No file data available' };
    }

    if (options.dryRun) {
      console.log(`  [DRY RUN] Would migrate: ${doc.file_name || doc.filename}`);
      return { success: true, scaffaldId: 'dry-run-id' };
    }

    // Prepare upload input
    const uploadInput: UploadDocumentInput = {
      organizationId: options.organizationId,
      name: doc.file_name || doc.filename,
      description: `Migrated from Forsured MockDatabase on ${new Date().toISOString()}`,
      category: mapDocumentCategory(doc.docType),
      tags: ['migrated-from-mockdb'],
      isTemplate: false,
      file: doc.file_data, // Already base64 encoded
      fileName: doc.file_name || doc.filename,
      contentType: doc.file_type || doc.mimeType || 'application/pdf',
      fileSize: doc.fileSize || doc.file_data.length * 0.75, // Approximate size from base64
    };

    // Upload to Scaffald
    const result = await scaffaldClient.documents.upload(uploadInput);

    console.log(`  ✓ Migrated: ${doc.file_name || doc.filename} → ${result.id}`);

    // Optionally verify checksum
    if (options.verify) {
      const originalBytes = base64ToUint8Array(doc.file_data);
      const originalChecksum = await calculateChecksum(originalBytes);

      if (result.checksum !== originalChecksum) {
        console.warn(`  ⚠ Checksum mismatch for ${doc.id}: expected ${originalChecksum}, got ${result.checksum}`);
      } else {
        console.log(`  ✓ Checksum verified for ${doc.id}`);
      }
    }

    return { success: true, scaffaldId: result.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`  ✗ Failed to migrate ${doc.id}: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

/**
 * Run the migration
 */
async function runMigration(options: MigrationOptions): Promise<MigrationResult> {
  console.log('Starting document migration...');
  console.log(`  Organization ID: ${options.organizationId}`);
  console.log(`  Dry run: ${options.dryRun}`);
  console.log(`  Verify checksums: ${options.verify}`);
  console.log('');

  const result: MigrationResult = {
    totalDocuments: 0,
    migrated: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Query all documents from MockDatabase
    const documents = await mockDatabase.query<
      MockDocument & { file_data?: string; file_name?: string; file_type?: string }
    >('documents', {});

    result.totalDocuments = documents.length;
    console.log(`Found ${documents.length} documents to migrate`);
    console.log('');

    for (const doc of documents) {
      // Skip if already migrated (has scaffaldId)
      if ('scaffaldId' in doc && (doc as { scaffaldId?: string }).scaffaldId) {
        console.log(`  - Skipping ${doc.id}: Already migrated`);
        result.skipped++;
        continue;
      }

      // Skip if no file data
      if (!doc.file_data) {
        console.log(`  - Skipping ${doc.id}: No file data`);
        result.skipped++;
        continue;
      }

      const migrationResult = await migrateDocument(doc, options);

      if (migrationResult.success) {
        result.migrated++;

        // Update MockDatabase record with Scaffald reference (if not dry run)
        if (!options.dryRun && migrationResult.scaffaldId) {
          await mockDatabase.update('documents', doc.id, {
            scaffaldId: migrationResult.scaffaldId,
            migratedAt: new Date().toISOString(),
          });
        }
      } else {
        result.failed++;
        result.errors.push({
          documentId: doc.id,
          error: migrationResult.error || 'Unknown error',
        });
      }
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }

  return result;
}

/**
 * Print migration summary
 */
function printSummary(result: MigrationResult): void {
  console.log('');
  console.log('='.repeat(50));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total documents:  ${result.totalDocuments}`);
  console.log(`Migrated:         ${result.migrated}`);
  console.log(`Skipped:          ${result.skipped}`);
  console.log(`Failed:           ${result.failed}`);
  console.log('');

  if (result.errors.length > 0) {
    console.log('ERRORS:');
    for (const err of result.errors) {
      console.log(`  - ${err.documentId}: ${err.error}`);
    }
    console.log('');
  }

  if (result.failed === 0) {
    console.log('✓ Migration completed successfully!');
  } else {
    console.log('⚠ Migration completed with errors. Please review the errors above.');
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verify = args.includes('--verify');
  const orgIdIndex = args.indexOf('--org-id');
  const organizationId = orgIdIndex !== -1 ? args[orgIdIndex + 1] : process.env.FORSURED_ORG_ID || '';

  if (!organizationId) {
    console.error('Error: Organization ID is required.');
    console.error('  Use --org-id <id> or set FORSURED_ORG_ID environment variable.');
    process.exit(1);
  }

  const options: MigrationOptions = {
    dryRun,
    verify,
    organizationId,
  };

  try {
    const result = await runMigration(options);
    printSummary(result);

    if (result.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runMigration, MigrationOptions, MigrationResult };
