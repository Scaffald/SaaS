/**
 * REQ-124: Document Upload & Storage - DocumentService Tests
 * Following TDD approach from REQ-112
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentService } from './documentService';
import mockDatabase from '../../utils/mockDataStore';
import type { DocumentUpload } from '../../types/document';
import { MAX_FILE_SIZE, MIN_FILE_SIZE } from '../../types/document';

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
    it('should upload a valid document and store it in database', async () => {
      // Create file content > 1KB
      const fileContent = 'PDF content here'.repeat(100);
      const file = new File([fileContent], 'certificate.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: fileContent.length });

      const uploadData: DocumentUpload = {
        project_id: 'project-123',
        uploader_id: 'user-123',
        file
      };

      const document = await documentService.uploadDocument(uploadData);

      expect(document.id).toBeDefined();
      expect(document.file_name).toBe('certificate.pdf');
      expect(document.file_size).toBe(fileContent.length);
      expect(document.file_type).toBe('application/pdf');
      expect(document.project_id).toBe('project-123');
      expect(document.uploader_id).toBe('user-123');
      expect(document.status).toBe('pending');
      expect(document.file_data).toBeDefined();
      expect(document.created_at).toBeDefined();
      expect(document.updated_at).toBeDefined();
    });

    it('should reject upload of invalid file', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(file, 'size', { value: 5000 });

      const uploadData: DocumentUpload = {
        project_id: 'project-123',
        uploader_id: 'user-123',
        file
      };

      await expect(documentService.uploadDocument(uploadData)).rejects.toThrow('File validation failed');
    });

    it('should encode file data as Base64', async () => {
      const fileContent = 'PDF content here'.repeat(100);
      const file = new File([fileContent], 'certificate.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: fileContent.length });

      const uploadData: DocumentUpload = {
        project_id: 'project-123',
        uploader_id: 'user-123',
        file
      };

      const document = await documentService.uploadDocument(uploadData);

      // Verify it's Base64 encoded
      expect(document.file_data).toMatch(/^[A-Za-z0-9+/=]+$/);

      // Verify we can decode it back
      const decoded = atob(document.file_data);
      expect(decoded).toBe(fileContent);
    });

    it('should generate SHA-256 hash for duplicate detection', async () => {
      const fileContent = 'PDF content here'.repeat(100);
      const file = new File([fileContent], 'certificate.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: fileContent.length });

      const uploadData: DocumentUpload = {
        project_id: 'project-123',
        uploader_id: 'user-123',
        file
      };

      const document = await documentService.uploadDocument(uploadData);

      expect(document.file_hash).toBeDefined();
      expect(document.file_hash).toHaveLength(64); // SHA-256 produces 64 hex chars
    });

    it('should detect duplicate files by hash', async () => {
      const fileContent = 'PDF content here'.repeat(100);
      const file1 = new File([fileContent], 'certificate1.pdf', { type: 'application/pdf' });
      Object.defineProperty(file1, 'size', { value: fileContent.length });

      const file2 = new File([fileContent], 'certificate2.pdf', { type: 'application/pdf' });
      Object.defineProperty(file2, 'size', { value: fileContent.length });

      const uploadData1: DocumentUpload = {
        project_id: 'project-123',
        uploader_id: 'user-123',
        file: file1
      };

      await documentService.uploadDocument(uploadData1);

      const isDuplicate = await documentService.checkDuplicate('project-123', file2);

      expect(isDuplicate).toBe(true);
    });
  });

  describe('getDocuments', () => {
    it('should retrieve documents for a project', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 5000 });

      await documentService.uploadDocument({
        project_id: 'project-123',
        uploader_id: 'user-123',
        file
      });

      const documents = await documentService.getDocuments({ project_id: 'project-123' });

      expect(documents).toHaveLength(1);
      expect(documents[0].project_id).toBe('project-123');
    });

    it('should filter documents by status', async () => {
      const file1 = new File(['content1'], 'test1.pdf', { type: 'application/pdf' });
      Object.defineProperty(file1, 'size', { value: 5000 });

      const file2 = new File(['content2'], 'test2.pdf', { type: 'application/pdf' });
      Object.defineProperty(file2, 'size', { value: 5000 });

      const doc1 = await documentService.uploadDocument({
        project_id: 'project-123',
        uploader_id: 'user-123',
        file: file1
      });

      const doc2 = await documentService.uploadDocument({
        project_id: 'project-123',
        uploader_id: 'user-123',
        file: file2
      });

      // Update one to completed
      await documentService.updateDocumentStatus(doc2.id, 'completed');

      const pendingDocs = await documentService.getDocuments({
        project_id: 'project-123',
        status: 'pending'
      });

      expect(pendingDocs).toHaveLength(1);
      expect(pendingDocs[0].id).toBe(doc1.id);
    });

    it('should filter documents by uploader', async () => {
      const file1 = new File(['content1'], 'test1.pdf', { type: 'application/pdf' });
      Object.defineProperty(file1, 'size', { value: 5000 });

      const file2 = new File(['content2'], 'test2.pdf', { type: 'application/pdf' });
      Object.defineProperty(file2, 'size', { value: 5000 });

      await documentService.uploadDocument({
        project_id: 'project-123',
        uploader_id: 'user-123',
        file: file1
      });

      await documentService.uploadDocument({
        project_id: 'project-123',
        uploader_id: 'user-456',
        file: file2
      });

      const user123Docs = await documentService.getDocuments({
        project_id: 'project-123',
        uploader_id: 'user-123'
      });

      expect(user123Docs).toHaveLength(1);
      expect(user123Docs[0].uploader_id).toBe('user-123');
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document by id', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 5000 });

      const doc = await documentService.uploadDocument({
        project_id: 'project-123',
        uploader_id: 'user-123',
        file
      });

      await documentService.deleteDocument(doc.id);

      const documents = await documentService.getDocuments({ project_id: 'project-123' });
      expect(documents).toHaveLength(0);
    });

    it('should throw error when deleting non-existent document', async () => {
      await expect(documentService.deleteDocument('non-existent')).rejects.toThrow('Record not found');
    });
  });

  describe('downloadDocument', () => {
    it('should retrieve document data for download', async () => {
      const fileContent = 'PDF content here'.repeat(100);
      const file = new File([fileContent], 'certificate.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: fileContent.length });

      const doc = await documentService.uploadDocument({
        project_id: 'project-123',
        uploader_id: 'user-123',
        file
      });

      const downloadData = await documentService.getDocumentById(doc.id);

      expect(downloadData).toBeDefined();
      expect(downloadData?.file_name).toBe('certificate.pdf');
      expect(downloadData?.file_data).toBeDefined();

      // Verify decoded content matches original
      const decoded = atob(downloadData!.file_data);
      expect(decoded).toBe(fileContent);
    });
  });

  describe('updateDocumentStatus', () => {
    it('should update document status', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 5000 });

      const doc = await documentService.uploadDocument({
        project_id: 'project-123',
        uploader_id: 'user-123',
        file
      });

      expect(doc.status).toBe('pending');

      const updated = await documentService.updateDocumentStatus(doc.id, 'completed');

      expect(updated.status).toBe('completed');
      expect(updated.updated_at).not.toBe(doc.updated_at);
    });

    it('should update status to error with error message', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 5000 });

      const doc = await documentService.uploadDocument({
        project_id: 'project-123',
        uploader_id: 'user-123',
        file
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
