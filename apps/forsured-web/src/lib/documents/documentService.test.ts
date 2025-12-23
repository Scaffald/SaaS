/**
 * REQ-124: Document Upload & Storage - DocumentService Tests
 * REQ-1: Document Management with Scaffald integration (Scaffald-only mode)
 * Following TDD approach from REQ-112
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DocumentService } from './documentService';
import type { DocumentUpload } from '../../types/document';
import { MAX_FILE_SIZE, MIN_FILE_SIZE } from '../../types/document';

// Mock scaffaldClient for upload tests
vi.mock('../scaffald/client', () => ({
  scaffaldClient: {
    documents: {
      upload: vi.fn().mockResolvedValue({
        id: 'scaffald-doc-123',
        name: 'certificate.pdf',
        category: 'compliance',
        storageBackend: 'supabase',
        storagePath: 'org/org-123/docs/certificate.pdf',
        downloadUrl: null,
        oauthAppId: 'forsured',
        version: 1,
        fileSize: 1600,
        mimeType: 'application/pdf',
        checksum: 'abc123',
        createdAt: '2024-01-01T00:00:00Z',
        uploadedBy: 'user-123',
      }),
      get: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock File.prototype.arrayBuffer for Node.js test environment
if (typeof File !== 'undefined' && !File.prototype.arrayBuffer) {
  File.prototype.arrayBuffer = async function(this: File) {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as ArrayBuffer);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(this);
    });
  };
}

describe('DocumentService', () => {
  let documentService: DocumentService;

  beforeEach(() => {
    mockDatabase.clearTable('documents');
    documentService = new DocumentService();
    vi.clearAllMocks();
  });

  describe('validateFile', () => {
    it('should validate a valid PDF file', () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 5000 });

      const result = documentService.validateFile(file);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject files that are not PDFs', () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(file, 'size', { value: 5000 });

      const result = documentService.validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File type not supported. Please upload PDF files only.');
    });

    it('should reject files with invalid PDF extension', () => {
      const file = new File(['test content'], 'test.doc', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 5000 });

      const result = documentService.validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File type not supported. Please upload PDF files only.');
    });

    it('should reject files exceeding max size', () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: MAX_FILE_SIZE + 1 });

      const result = documentService.validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File size exceeds 10MB limit. Please compress or split the file.');
    });

    it('should reject files below min size', () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: MIN_FILE_SIZE - 1 });

      const result = documentService.validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File is too small (minimum 1KB). The file may be corrupted.');
    });

    it('should sanitize file names', () => {
      const file = new File(['test content'], 'test@#$%.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 5000 });

      const sanitized = documentService.sanitizeFileName(file.name);

      expect(sanitized).toBe('test.pdf');
      expect(sanitized).not.toContain('@');
      expect(sanitized).not.toContain('#');
      expect(sanitized).not.toContain('$');
      expect(sanitized).not.toContain('%');
    });
  });

  describe('uploadDocument', () => {
    it('should upload a valid document via Scaffald API', async () => {
      // Create file content > 1KB
      const fileContent = 'PDF content here'.repeat(100);
      const file = new File([fileContent], 'certificate.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: fileContent.length });

      const uploadData = {
        project_id: 'project-123',
        uploader_id: 'user-123',
        file,
        organizationId: 'org-123',
      };

      const document = await documentService.uploadDocument(uploadData);

      expect(document.id).toBe('scaffald-doc-123');
      expect(document.filename).toBe('certificate.pdf');
      expect(document.scaffaldId).toBe('scaffald-doc-123');
      expect(document.storageBackend).toBe('supabase');
    });

    it('should reject upload of invalid file', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(file, 'size', { value: 5000 });

      const uploadData = {
        project_id: 'project-123',
        uploader_id: 'user-123',
        file,
        organizationId: 'org-123',
      };

      await expect(documentService.uploadDocument(uploadData)).rejects.toThrow('File validation failed');
    });

    it('should require organizationId for upload', async () => {
      const fileContent = 'PDF content here'.repeat(100);
      const file = new File([fileContent], 'certificate.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: fileContent.length });

      const uploadData = {
        project_id: 'project-123',
        uploader_id: 'user-123',
        file,
        organizationId: '', // Empty organizationId
      };

      await expect(documentService.uploadDocument(uploadData)).rejects.toThrow('organizationId is required');
    });

    it('should call scaffaldClient.documents.upload with correct parameters', async () => {
      const { scaffaldClient } = await import('../scaffald/client');
      const fileContent = 'PDF content here'.repeat(100);
      const file = new File([fileContent], 'certificate.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: fileContent.length });

      await documentService.uploadDocument({
        project_id: 'project-123',
        uploader_id: 'user-123',
        file,
        organizationId: 'org-123',
        category: 'compliance',
        tags: ['insurance', 'coi'],
      });

      expect(scaffaldClient.documents.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-123',
          name: 'certificate.pdf',
          fileName: 'certificate.pdf',
          contentType: 'application/pdf',
          category: 'compliance',
          tags: ['insurance', 'coi'],
        })
      );
    });
  });

  describe('getDocuments (MockDatabase for development)', () => {
    it('should retrieve documents from MockDatabase', async () => {
      // Insert test document directly into MockDatabase
      await mockDatabase.insert('documents', {
        project_id: 'project-123',
        uploader_id: 'user-123',
        file_name: 'test.pdf',
        file_size: 5000,
        file_type: 'application/pdf',
        status: 'pending',
        upload_date: new Date().toISOString(),
      });

      const documents = await documentService.getDocuments({ project_id: 'project-123' });

      expect(documents).toHaveLength(1);
      expect(documents[0].project_id).toBe('project-123');
    });

    it('should filter documents by status', async () => {
      const doc1 = await mockDatabase.insert('documents', {
        project_id: 'project-123',
        status: 'pending',
      });
      await mockDatabase.insert('documents', {
        project_id: 'project-123',
        status: 'completed',
      });

      const pendingDocs = await documentService.getDocuments({
        project_id: 'project-123',
        status: 'pending'
      });

      expect(pendingDocs).toHaveLength(1);
      expect(pendingDocs[0].id).toBe(doc1.id);
    });

    it('should filter documents by uploader', async () => {
      await mockDatabase.insert('documents', {
        project_id: 'project-123',
        uploader_id: 'user-123',
      });
      await mockDatabase.insert('documents', {
        project_id: 'project-123',
        uploader_id: 'user-456',
      });

      const user123Docs = await documentService.getDocuments({
        project_id: 'project-123',
        uploader_id: 'user-123'
      });

      expect(user123Docs).toHaveLength(1);
      expect(user123Docs[0].uploader_id).toBe('user-123');
    });
  });

  describe('deleteDocument (MockDatabase for development)', () => {
    it('should delete a document by id', async () => {
      const doc = await mockDatabase.insert('documents', {
        project_id: 'project-123',
      });

      await documentService.deleteDocument(doc.id);

      const documents = await documentService.getDocuments({ project_id: 'project-123' });
      expect(documents).toHaveLength(0);
    });

    it('should throw error when deleting non-existent document', async () => {
      await expect(documentService.deleteDocument('non-existent')).rejects.toThrow('Record not found');
    });
  });

  describe('getDocumentById (MockDatabase for development)', () => {
    it('should retrieve document data by id', async () => {
      const fileContent = 'PDF content here';
      const doc = await mockDatabase.insert('documents', {
        file_name: 'certificate.pdf',
        file_data: btoa(fileContent),
      });

      const document = await documentService.getDocumentById(doc.id);

      expect(document).toBeDefined();
      expect(document?.file_name).toBe('certificate.pdf');
      expect(document?.file_data).toBeDefined();

      // Verify decoded content matches original
      const decoded = atob(document!.file_data);
      expect(decoded).toBe(fileContent);
    });
  });

  describe('updateDocumentStatus (MockDatabase for development)', () => {
    it('should update document status', async () => {
      const doc = await mockDatabase.insert('documents', {
        status: 'pending',
        updated_at: '2024-01-01T00:00:00Z',
      });

      const updated = await documentService.updateDocumentStatus(doc.id, 'completed');

      expect(updated.status).toBe('completed');
    });

    it('should update status to error with error message', async () => {
      const doc = await mockDatabase.insert('documents', {
        status: 'pending',
      });

      const updated = await documentService.updateDocumentStatus(
        doc.id,
        'error',
        'Failed to extract data'
      );

      expect(updated.status).toBe('error');
      expect(updated.error_message).toBe('Failed to extract data');
    });
  });
});
