/**
 * Mock OCR Service Tests
 * REQ-125: Mock OCR & Document Parsing Engine for ACORD 25 Forms
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockOCRService } from '../ocr/mockOCRService';
import { mockACORD25Templates } from '../test-data/mockACORD25Templates';
import type { OCRInput } from '../types/acord25';

describe('MockOCRService', () => {
  let ocrService: MockOCRService;

  beforeEach(() => {
    ocrService = new MockOCRService();
  });

  describe('extractText', () => {
    it('should extract text and return OCR result structure', async () => {
      const testInput: OCRInput = {
        documentId: 'test-doc-1',
      };

      const result = await ocrService.extractText(testInput);

      expect(result).toBeDefined();
      expect(result.documentId).toBe('test-doc-1');
      expect(result.rawText).toBeDefined();
      expect(result.detectedCarrier).toBeDefined();
      expect(result.carrierConfidence).toBeGreaterThanOrEqual(0);
      expect(result.carrierConfidence).toBeLessThanOrEqual(100);
      expect(result.timestamp).toBeDefined();
    });

    it('should detect Travelers carrier from text', async () => {
      const input: OCRInput = {
        documentId: 'test-doc-travelers',
        carrierHint: 'Travelers',
      };

      // We need to mock the extractPDFText to return our template
      // For now, we'll test the detectCarrier method directly
      const detection = (ocrService as any).detectCarrier(
        mockACORD25Templates.travelers.templateText,
        'Travelers'
      );

      expect(detection.carrier).toBe('Travelers');
      expect(detection.confidence).toBeGreaterThan(80);
    });

    it('should detect Liberty Mutual carrier from text', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detection = (ocrService as any).detectCarrier(
        mockACORD25Templates.libertyMutual.templateText
      );

      expect(detection.carrier).toBe('Liberty Mutual');
      expect(detection.confidence).toBeGreaterThan(0);
    });

    it('should detect Hartford carrier from text', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detection = (ocrService as any).detectCarrier(
        mockACORD25Templates.hartford.templateText
      );

      expect(detection.carrier).toBe('Hartford');
      expect(detection.confidence).toBeGreaterThan(0);
    });

    it('should return Unknown for unrecognized carrier', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detection = (ocrService as any).detectCarrier(
        'Some random text without carrier information'
      );

      expect(detection.carrier).toBe('Unknown');
      expect(detection.confidence).toBe(0);
    });
  });

  describe('validateACORD25Format', () => {
    it('should validate Travelers ACORD 25 format', () => {
      const validation = ocrService.validateACORD25Format(
        mockACORD25Templates.travelers.templateText
      );

      expect(validation.isValid).toBe(true);
      expect(validation.confidence).toBeGreaterThan(50);
    });

    it('should validate Liberty Mutual ACORD 25 format', () => {
      const validation = ocrService.validateACORD25Format(
        mockACORD25Templates.libertyMutual.templateText
      );

      expect(validation.isValid).toBe(true);
      expect(validation.confidence).toBeGreaterThan(50);
    });

    it('should validate Hartford ACORD 25 format', () => {
      const validation = ocrService.validateACORD25Format(
        mockACORD25Templates.hartford.templateText
      );

      expect(validation.isValid).toBe(true);
      expect(validation.confidence).toBeGreaterThan(50);
    });

    it('should reject non-ACORD 25 text', () => {
      const validation = ocrService.validateACORD25Format(
        'This is just some random text that is not an ACORD 25 certificate'
      );

      expect(validation.isValid).toBe(false);
      expect(validation.confidence).toBeLessThan(50);
    });

    it('should have lower confidence for poor quality scan', () => {
      const validation = ocrService.validateACORD25Format(
        mockACORD25Templates.poorQuality.templateText
      );

      // Should still detect as ACORD 25 but with lower confidence
      expect(validation.confidence).toBeLessThan(60);
    });
  });

  describe('extractField', () => {
    it('should extract policy number from Travelers template', () => {
      const pattern = /POLICY NUMBER:\s*([A-Z0-9-]+)/i;
      const field = ocrService.extractField(
        mockACORD25Templates.travelers.templateText,
        pattern
      );

      expect(field).toBeDefined();
      expect(field).toContain('GL-TRV');
    });

    it('should return null if pattern not found', () => {
      const pattern = /NONEXISTENT FIELD:\s*(\w+)/;
      const field = ocrService.extractField(
        mockACORD25Templates.travelers.templateText,
        pattern
      );

      expect(field).toBe(null);
    });
  });

  describe('extractAllMatches', () => {
    it('should extract all policy numbers from template', () => {
      const pattern = /POLICY NUMBER:\s*([A-Z0-9-]+)/gi;
      const matches = ocrService.extractAllMatches(
        mockACORD25Templates.travelers.templateText,
        pattern
      );

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]).toContain('GL-TRV');
    });

    it('should return empty array if no matches', () => {
      const pattern = /NONEXISTENT:\s*(\w+)/g;
      const matches = ocrService.extractAllMatches(
        mockACORD25Templates.travelers.templateText,
        pattern
      );

      expect(matches).toEqual([]);
    });
  });

  describe('carrier confidence calculation', () => {
    it('should give high confidence for carrier in header', () => {
      const text = 'The Travelers Companies\n\n' + 'A'.repeat(1000);
      const pattern = /travelers/i;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const confidence = (ocrService as any).calculateCarrierConfidence(text, pattern);

      expect(confidence).toBeGreaterThanOrEqual(80);
    });

    it('should give lower confidence for carrier later in document', () => {
      const text = 'A'.repeat(1500) + '\nThe Travelers Companies';
      const pattern = /travelers/i;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const confidence = (ocrService as any).calculateCarrierConfidence(text, pattern);

      expect(confidence).toBeLessThan(80);
    });
  });
});
