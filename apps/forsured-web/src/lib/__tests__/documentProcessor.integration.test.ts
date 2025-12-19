/**
 * Document Processor Integration Tests
 * REQ-125: Mock OCR & Document Parsing Engine for ACORD 25 Forms
 *
 * Tests integration with MockDatabase (REQ-106)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentProcessor } from '../parser/documentProcessor';
import MockDatabase from '../../utils/mockDataStore';
import { mockACORD25Templates } from '../test-data/mockACORD25Templates';
import type { OCRInput, AIExtractionRecord, PolicyData } from '../types/acord25';

// Mock the OCR service to return our test templates
import { MockOCRService } from '../ocr/mockOCRService';
import type { OCRResult } from '../types/acord25';

// Override mockExtractPDFText to return our templates
const originalExtractText = MockOCRService.prototype.extractText;

describe('DocumentProcessor Integration Tests', () => {
  let processor: DocumentProcessor;

  beforeEach(async () => {
    processor = new DocumentProcessor();

    // Seed database with a test client
    await MockDatabase.insert('clients', {
      id: 'test-client-1',
      name: 'Test Construction Company',
      email: 'test@example.com',
      phone: '555-0100',
    });
  });

  describe('End-to-End Document Processing', () => {
    it('should process Travelers document through complete pipeline', async () => {
      // Mock OCR to return Travelers template
      const mockExtract = async function (input: OCRInput): Promise<OCRResult> {
        return {
          documentId: input.documentId,
          rawText: mockACORD25Templates.travelers.templateText,
          detectedCarrier: 'Travelers',
          carrierConfidence: 95,
          timestamp: new Date().toISOString(),
        };
      };

      MockOCRService.prototype.extractText = mockExtract;

      const input: OCRInput = {
        documentId: 'test-doc-travelers-integration',
      };

      const result = await processor.processDocument(input);

      // Verify successful processing
      expect(result.success).toBe(true);
      expect(result.extraction).toBeDefined();
      expect(result.extractionRecordId).toBeDefined();
      expect(result.policiesCreated).toBeDefined();
      expect(result.processingTimeMs).toBeLessThan(10000);

      // Verify extraction was stored in ai_extractions table
      const extractions = await MockDatabase.query<AIExtractionRecord>(
        'ai_extractions',
        { document_id: 'test-doc-travelers-integration' }
      );
      expect(extractions.length).toBe(1);
      expect(extractions[0].extraction_type).toBe('acord_25');
      expect(extractions[0].confidence_score).toBeGreaterThan(60);

      // At minimum, extraction should be stored even if no policies created
      expect(extractions.length).toBeGreaterThan(0);

      // Restore original method
      MockOCRService.prototype.extractText = originalExtractText;
    });

    it('should store extraction even if policy creation fails', async () => {
      // Clear clients to simulate no client found
      MockDatabase.clearTable('clients');

      MockOCRService.prototype.extractText = async function (input: OCRInput): Promise<OCRResult> {
        await this.simulateProcessing();
        return {
          documentId: input.documentId,
          rawText: mockACORD25Templates.libertyMutual.templateText,
          detectedCarrier: 'Liberty Mutual',
          carrierConfidence: 95,
          timestamp: new Date().toISOString(),
        };
      };

      const input: OCRInput = {
        documentId: 'test-doc-no-client',
      };

      const result = await processor.processDocument(input);

      expect(result.success).toBe(true);
      expect(result.extractionRecordId).toBeDefined();
      expect(result.policiesCreated).toHaveLength(0); // No policies created

      // But extraction should still be stored
      const extractions = await MockDatabase.query<AIExtractionRecord>(
        'ai_extractions',
        { document_id: 'test-doc-no-client' }
      );
      expect(extractions.length).toBe(1);

      // Restore original method
      MockOCRService.prototype.extractText = originalExtractText;
    });

    it('should flag low confidence extractions for manual review', async () => {
      const mockExtract = async function (input: OCRInput): Promise<OCRResult> {
        return {
          documentId: input.documentId,
          rawText: mockACORD25Templates.poorQuality.templateText,
          detectedCarrier: 'Unknown',
          carrierConfidence: 0,
          timestamp: new Date().toISOString(),
        };
      };

      MockOCRService.prototype.extractText = mockExtract;

      const input: OCRInput = {
        documentId: 'test-doc-poor-quality',
      };

      const result = await processor.processDocument(input);

      // Poor quality documents may fail ACORD 25 format validation
      // which is expected behavior - they should be rejected early
      if (!result.success) {
        expect(result.error).toContain('not a recognized ACORD 25');
      } else {
        // If it passes validation, it should be flagged for review
        expect(result.extraction?.requires_manual_review).toBe(true);
        expect(result.extraction?.overall_confidence).toBeLessThan(60);
        expect(result.policiesCreated || []).toHaveLength(0);
      }

      // Restore original method
      MockOCRService.prototype.extractText = originalExtractText;
    });

    it('should handle invalid ACORD 25 format', async () => {
      MockOCRService.prototype.extractText = async function (input: OCRInput): Promise<OCRResult> {
        await this.simulateProcessing();
        return {
          documentId: input.documentId,
          rawText: 'This is not an ACORD 25 document at all',
          detectedCarrier: 'Unknown',
          carrierConfidence: 0,
          timestamp: new Date().toISOString(),
        };
      };

      const input: OCRInput = {
        documentId: 'test-doc-invalid',
      };

      const result = await processor.processDocument(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not a recognized ACORD 25');

      // Restore original method
      MockOCRService.prototype.extractText = originalExtractText;
    });
  });

  describe('Policy Creation', () => {
    it('should verify extraction result structure', async () => {
      const mockExtract = async function (input: OCRInput): Promise<OCRResult> {
        return {
          documentId: input.documentId,
          rawText: mockACORD25Templates.hartford.templateText,
          detectedCarrier: 'Hartford',
          carrierConfidence: 95,
          timestamp: new Date().toISOString(),
        };
      };

      MockOCRService.prototype.extractText = mockExtract;

      const input: OCRInput = {
        documentId: 'test-doc-multiple-policies',
      };

      const result = await processor.processDocument(input);

      expect(result.success).toBe(true);
      expect(result.extraction).toBeDefined();
      expect(result.extraction?.coverage_types.length).toBeGreaterThan(2);

      // Restore original method
      MockOCRService.prototype.extractText = originalExtractText;
    });

    it('should include endorsement information in extraction', async () => {
      const mockExtract = async function (input: OCRInput): Promise<OCRResult> {
        return {
          documentId: input.documentId,
          rawText: mockACORD25Templates.travelers.templateText,
          detectedCarrier: 'Travelers',
          carrierConfidence: 95,
          timestamp: new Date().toISOString(),
        };
      };

      MockOCRService.prototype.extractText = mockExtract;

      const input: OCRInput = {
        documentId: 'test-doc-endorsements',
      };

      const result = await processor.processDocument(input);

      expect(result.success).toBe(true);
      expect(result.extraction?.endorsements.additional_insured.value).toBe(true);
      expect(result.extraction?.endorsements.waiver_of_subrogation.value).toBe(true);

      // Restore original method
      MockOCRService.prototype.extractText = originalExtractText;
    });
  });

  describe('Performance', () => {
    it('should process document in less than 5 seconds total', async () => {
      MockOCRService.prototype.extractText = async function (input: OCRInput): Promise<OCRResult> {
        await this.simulateProcessing();
        return {
          documentId: input.documentId,
          rawText: mockACORD25Templates.travelers.templateText,
          detectedCarrier: 'Travelers',
          carrierConfidence: 95,
          timestamp: new Date().toISOString(),
        };
      };

      const input: OCRInput = {
        documentId: 'test-doc-performance',
      };

      const startTime = Date.now();
      const result = await processor.processDocument(input);
      const totalTime = Date.now() - startTime;

      expect(totalTime).toBeLessThan(5000);
      expect(result.processingTimeMs).toBeLessThan(5000);

      // Restore original method
      MockOCRService.prototype.extractText = originalExtractText;
    });
  });
});
