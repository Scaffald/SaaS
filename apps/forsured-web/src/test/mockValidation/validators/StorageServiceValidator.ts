/**
 * REQ-306: Storage Service Mock Validator
 *
 * Validates that the DocumentService and its underlying storage mocks
 * accurately represent the database schema and Supabase Storage API behavior.
 * Performance target: < 3 seconds (TR-2)
 */

import type { MockValidator, ValidationResult, ValidationError } from '../types';
import {
  createValidationError,
  createSuccessResult,
  createFailedResult,
} from '../MockValidationFramework';
import { DocumentService } from '../../../lib/documents/documentService';
import MockDatabase from '../../../utils/mockDataStore';
import {
  MAX_FILE_SIZE,
  MIN_FILE_SIZE,
  ALLOWED_FILE_TYPE,
  ALLOWED_FILE_EXTENSION,
} from '../../../types/document';

// Expected columns in the documents table
const EXPECTED_DOCUMENT_COLUMNS = [
  'id',
  'project_id',
  'subcontractor_id',
  'uploader_id',
  'file_name',
  'file_size',
  'file_type',
  'file_data',
  'file_hash',
  'upload_date',
  'status',
  'error_message',
  'created_at',
  'updated_at',
];

// Expected document status values
const VALID_DOCUMENT_STATUSES = ['pending', 'processing', 'completed', 'error'];

/**
 * StorageServiceValidator - Validates storage service mocks against schema
 *
 * Validates:
 * - DocumentService API methods exist and work correctly
 * - File validation logic matches constraints
 * - MockDatabase documents table schema
 * - Response format consistency
 * - CRUD operations work correctly
 */
export class StorageServiceValidator implements MockValidator {
  readonly name = 'StorageService';
  private documentService: DocumentService;

  constructor() {
    this.documentService = new DocumentService();
  }

  async validate(): Promise<ValidationResult> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];

    try {
      // 1. Validate DocumentService API methods exist
      const apiErrors = this.validateDocumentServiceAPI();
      errors.push(...apiErrors);

      // 2. Validate file validation logic
      const validationErrors = this.validateFileValidation();
      errors.push(...validationErrors);

      // 3. Validate documents table schema in MockDatabase
      const schemaErrors = this.validateDocumentsTableSchema();
      errors.push(...schemaErrors);

      // 4. Validate CRUD operations work correctly
      const crudErrors = await this.validateCRUDOperations();
      errors.push(...crudErrors);

      // 5. Validate response format
      const responseErrors = await this.validateResponseFormat();
      errors.push(...responseErrors);

      const duration = Date.now() - startTime;

      // TR-2: Warn if approaching time limit
      if (duration > 2500) {
        console.warn(`⚠️ StorageServiceValidator approaching time limit: ${duration}ms`);
      }

      if (errors.length > 0) {
        return createFailedResult(this.name, errors, duration);
      }

      return createSuccessResult(this.name, duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      return createFailedResult(
        this.name,
        [createValidationError(
          'execution',
          'successful validation',
          error instanceof Error ? error.message : 'unknown error',
          'Validator threw an exception'
        )],
        duration
      );
    }
  }

  /**
   * Validate DocumentService API methods exist
   */
  private validateDocumentServiceAPI(): ValidationError[] {
    const errors: ValidationError[] = [];
    const service = this.documentService;

    const requiredMethods = [
      'validateFile',
      'sanitizeFileName',
      'uploadDocument',
      'getDocuments',
      'getDocumentById',
      'updateDocumentStatus',
      'deleteDocument',
      'deleteDocuments',
    ];

    for (const method of requiredMethods) {
      if (typeof (service as Record<string, unknown>)[method] !== 'function') {
        errors.push(createValidationError(
          `DocumentService.${method}()`,
          'function',
          typeof (service as Record<string, unknown>)[method],
          `DocumentService must have ${method}() method`,
          `Add ${method}() method to DocumentService`
        ));
      }
    }

    return errors;
  }

  /**
   * Validate file validation logic matches constraints
   */
  private validateFileValidation(): ValidationError[] {
    const errors: ValidationError[] = [];

    // Test valid PDF file
    const validFile = new File(['%PDF-1.4 test content'.repeat(100)], 'test.pdf', {
      type: ALLOWED_FILE_TYPE,
    });
    const validResult = this.documentService.validateFile(validFile);

    if (!validResult.valid) {
      errors.push(createValidationError(
        'validateFile(valid PDF)',
        'valid: true',
        `valid: ${validResult.valid}, errors: ${validResult.errors.join(', ')}`,
        'Valid PDF should pass validation'
      ));
    }

    // Test invalid file type
    const invalidTypeFile = new File(['test content'], 'test.txt', {
      type: 'text/plain',
    });
    const invalidTypeResult = this.documentService.validateFile(invalidTypeFile);

    if (invalidTypeResult.valid) {
      errors.push(createValidationError(
        'validateFile(invalid type)',
        'valid: false',
        'valid: true',
        'Non-PDF file should fail validation'
      ));
    }

    // Test file too small
    const tooSmallFile = new File(['x'], 'tiny.pdf', {
      type: ALLOWED_FILE_TYPE,
    });
    const tooSmallResult = this.documentService.validateFile(tooSmallFile);

    if (tooSmallResult.valid) {
      errors.push(createValidationError(
        'validateFile(too small)',
        'valid: false',
        'valid: true',
        `File smaller than ${MIN_FILE_SIZE} bytes should fail validation`
      ));
    }

    // Validate constraints are exported correctly
    if (MAX_FILE_SIZE !== 10 * 1024 * 1024) {
      errors.push(createValidationError(
        'MAX_FILE_SIZE constant',
        '10485760 (10MB)',
        String(MAX_FILE_SIZE),
        'MAX_FILE_SIZE should be 10MB'
      ));
    }

    if (MIN_FILE_SIZE !== 1024) {
      errors.push(createValidationError(
        'MIN_FILE_SIZE constant',
        '1024 (1KB)',
        String(MIN_FILE_SIZE),
        'MIN_FILE_SIZE should be 1KB'
      ));
    }

    if (ALLOWED_FILE_TYPE !== 'application/pdf') {
      errors.push(createValidationError(
        'ALLOWED_FILE_TYPE constant',
        'application/pdf',
        ALLOWED_FILE_TYPE,
        'ALLOWED_FILE_TYPE should be application/pdf'
      ));
    }

    if (ALLOWED_FILE_EXTENSION !== '.pdf') {
      errors.push(createValidationError(
        'ALLOWED_FILE_EXTENSION constant',
        '.pdf',
        ALLOWED_FILE_EXTENSION,
        'ALLOWED_FILE_EXTENSION should be .pdf'
      ));
    }

    return errors;
  }

  /**
   * Validate documents table schema in MockDatabase
   */
  private validateDocumentsTableSchema(): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check documents table exists
    try {
      const documents = MockDatabase.getAll('documents');
      if (!Array.isArray(documents)) {
        errors.push(createValidationError(
          'documents table',
          'array',
          typeof documents,
          'documents table should return array from getAll()'
        ));
      }
    } catch (e) {
      errors.push(createValidationError(
        'documents table access',
        'no error',
        e instanceof Error ? e.message : 'unknown error',
        'documents table should be accessible'
      ));
    }

    // Check QueryBuilder for documents table
    try {
      const builder = MockDatabase.from('documents');

      if (!builder) {
        errors.push(createValidationError(
          'MockDatabase.from("documents")',
          'QueryBuilder instance',
          'undefined/null',
          'from("documents") should return QueryBuilder'
        ));
      }
    } catch (e) {
      errors.push(createValidationError(
        'MockDatabase.from("documents")',
        'no error',
        e instanceof Error ? e.message : 'unknown error',
        'from("documents") should not throw'
      ));
    }

    return errors;
  }

  /**
   * Validate CRUD operations work correctly
   */
  private async validateCRUDOperations(): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Save original data
    const originalDocuments = MockDatabase.getAll('documents');
    const originalUsers = MockDatabase.getAll('users');

    try {
      // First, seed a test user to satisfy FK constraint
      const testUserId = 'storage-validator-test-user';
      MockDatabase.seedData('users', [
        ...originalUsers,
        {
          id: testUserId,
          email: 'storage-validator@test.com',
          role: 'admin',
        },
      ]);

      // Test INSERT via MockDatabase
      // Use schema-compliant fields: name, type, status, owner_user_id
      // This matches the SCHEMA_RULES in mockDatabase.validators.ts
      const testDoc = {
        name: 'validator-test.pdf',
        type: 'certificate_of_insurance',
        status: 'pending',
        owner_user_id: testUserId, // Use the test user we created
        project_id: null,
        subcontractor_id: null,
        policy_id: null,
        uploaded_by_user_id: null,
        file_size: 5000,
        file_type: 'application/pdf',
        file_data: 'base64encodeddata',
        file_hash: 'abc123hash',
        upload_date: new Date().toISOString(),
      };

      const insertResult = await MockDatabase.from('documents').insert(testDoc);

      if (!insertResult.data) {
        errors.push(createValidationError(
          'documents INSERT',
          'data array with inserted record',
          'null data',
          'Insert should return inserted record'
        ));
      }

      if (insertResult.error) {
        errors.push(createValidationError(
          'documents INSERT error',
          'null error',
          insertResult.error.message,
          'Insert should not return error'
        ));
      }

      // Verify inserted record has required fields
      if (insertResult.data && insertResult.data[0]) {
        const inserted = insertResult.data[0];

        if (!inserted.id) {
          errors.push(createValidationError(
            'inserted document.id',
            'auto-generated ID',
            'undefined/null',
            'Inserted record should have auto-generated ID'
          ));
        }

        if (!inserted.created_at) {
          errors.push(createValidationError(
            'inserted document.created_at',
            'auto-generated timestamp',
            'undefined/null',
            'Inserted record should have created_at timestamp'
          ));
        }

        // Test SELECT to verify insert worked
        const selectResult = await MockDatabase.from('documents')
          .select('*')
          .eq('id', inserted.id);

        if (!selectResult.data || selectResult.data.length !== 1) {
          errors.push(createValidationError(
            'documents SELECT after INSERT',
            '1 record',
            `${selectResult.data?.length ?? 0} records`,
            'Should find inserted record'
          ));
        }

        // Test UPDATE
        // Use valid status enum: 'pending', 'accepted', 'rejected', 'pending_review'
        const updateResult = await MockDatabase.from('documents')
          .update({ status: 'accepted' })
          .eq('id', inserted.id);

        if (updateResult.error) {
          errors.push(createValidationError(
            'documents UPDATE error',
            'null error',
            updateResult.error.message,
            'Update should not return error'
          ));
        }

        // Verify update worked
        const verifyUpdate = await MockDatabase.from('documents')
          .select('*')
          .eq('id', inserted.id);

        if (verifyUpdate.data && verifyUpdate.data[0]?.status !== 'accepted') {
          errors.push(createValidationError(
            'documents UPDATE verify',
            'status: accepted',
            `status: ${verifyUpdate.data[0]?.status}`,
            'Update should change status'
          ));
        }

        // Test DELETE
        const deleteResult = await MockDatabase.from('documents')
          .delete()
          .eq('id', inserted.id);

        if (deleteResult.error) {
          errors.push(createValidationError(
            'documents DELETE error',
            'null error',
            deleteResult.error.message,
            'Delete should not return error'
          ));
        }

        // Verify delete worked
        const verifyDelete = await MockDatabase.from('documents')
          .select('*')
          .eq('id', inserted.id);

        if (verifyDelete.data && verifyDelete.data.length !== 0) {
          errors.push(createValidationError(
            'documents DELETE verify',
            '0 records',
            `${verifyDelete.data.length} records`,
            'Delete should remove record'
          ));
        }
      }
    } catch (e) {
      errors.push(createValidationError(
        'CRUD operations',
        'no error',
        e instanceof Error ? e.message : 'unknown error',
        'CRUD operations should not throw'
      ));
    } finally {
      // Restore original data
      MockDatabase.seedData('documents', originalDocuments);
      MockDatabase.seedData('users', originalUsers);
    }

    return errors;
  }

  /**
   * Validate response format matches Supabase contract
   */
  private async validateResponseFormat(): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Test select response format
    const selectResult = await MockDatabase.from('documents').select('*');

    if (!('data' in selectResult)) {
      errors.push(createValidationError(
        'select() response.data',
        'property exists',
        'property missing',
        'Response must have data property'
      ));
    }

    if (!('error' in selectResult)) {
      errors.push(createValidationError(
        'select() response.error',
        'property exists',
        'property missing',
        'Response must have error property'
      ));
    }

    // Test single() not found returns proper error
    const singleResult = await MockDatabase.from('documents')
      .select('*')
      .eq('id', 'nonexistent-id-12345')
      .single();

    if (singleResult.data !== null) {
      errors.push(createValidationError(
        'single() not found - data',
        'null',
        String(singleResult.data),
        'single() should return null data when not found'
      ));
    }

    if (!singleResult.error) {
      errors.push(createValidationError(
        'single() not found - error',
        'error object',
        'null',
        'single() should return error when not found'
      ));
    }

    if (singleResult.error && singleResult.error.code !== 'PGRST116') {
      errors.push(createValidationError(
        'single() not found - error.code',
        'PGRST116',
        singleResult.error.code,
        'single() not found should return PGRST116 error code'
      ));
    }

    return errors;
  }
}
