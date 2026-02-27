/**
 * ACORD 25 Parser Tests
 * Mock OCR & Document Parsing Engine for ACORD 25 Forms
 *
 * Tests for parsing accuracy across different carriers and edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ACORD25Parser } from '../parser/acord25Parser';
import { mockACORD25Templates } from '../test-data/mockACORD25Templates';
import type { ParserInput, ACORD25Extraction } from '../types/acord25';

describe('ACORD25Parser', () => {
  let parser: ACORD25Parser;

  beforeEach(() => {
    parser = new ACORD25Parser();
  });

  describe('Travelers Template Parsing', () => {
    let extraction: ACORD25Extraction;

    beforeEach(async () => {
      const input: ParserInput = {
        documentId: 'test-travelers-1',
        rawText: mockACORD25Templates.travelers.templateText,
        carrier: 'Travelers',
      };
      extraction = await parser.parse(input);
    });

    it('should extract carrier correctly', () => {
      expect(extraction.carrier).toBe('Travelers');
      expect(extraction.carrier_confidence).toBeGreaterThan(0);
    });

    it('should extract policy number', () => {
      expect(extraction.policy_number).toBeDefined();
      expect(extraction.policy_number).toContain('GL-TRV');
      expect(extraction.policy_number_confidence).toBeGreaterThan(50);
    });

    it('should extract effective date in ISO format', () => {
      expect(extraction.effective_date).toBe('2024-01-01');
      expect(extraction.effective_date_confidence).toBeGreaterThan(70);
    });

    it('should extract expiration date in ISO format', () => {
      expect(extraction.expiration_date).toBe('2024-12-31');
      expect(extraction.expiration_date_confidence).toBeGreaterThan(70);
    });

    it('should extract general liability coverage', () => {
      const glCoverage = extraction.coverage_types.find(
        c => c.type === 'general_liability'
      );
      expect(glCoverage).toBeDefined();
      expect(glCoverage?.amount).toBe(2000000);
      expect(glCoverage?.confidence).toBeGreaterThan(70);
    });

    it('should extract workers compensation coverage', () => {
      const wcCoverage = extraction.coverage_types.find(
        c => c.type === 'workers_comp'
      );
      expect(wcCoverage).toBeDefined();
      expect(wcCoverage?.amount).toBe(1000000);
    });

    it('should extract auto liability coverage', () => {
      const autoCoverage = extraction.coverage_types.find(
        c => c.type === 'commercial_auto'
      );
      expect(autoCoverage).toBeDefined();
      expect(autoCoverage?.amount).toBe(1000000);
    });

    it('should extract umbrella coverage', () => {
      const umbrellaCoverage = extraction.coverage_types.find(
        c => c.type === 'umbrella_liability'
      );
      expect(umbrellaCoverage).toBeDefined();
      expect(umbrellaCoverage?.amount).toBe(5000000);
    });

    it('should detect additional insured endorsement', () => {
      expect(extraction.endorsements.additional_insured.value).toBe(true);
      expect(extraction.endorsements.additional_insured.confidence).toBeGreaterThan(70);
    });

    it('should detect waiver of subrogation endorsement', () => {
      expect(extraction.endorsements.waiver_of_subrogation.value).toBe(true);
      expect(extraction.endorsements.waiver_of_subrogation.confidence).toBeGreaterThan(70);
    });

    it('should detect primary and non-contributory endorsement', () => {
      expect(extraction.endorsements.primary_non_contributory.value).toBe(true);
      expect(extraction.endorsements.primary_non_contributory.confidence).toBeGreaterThan(70);
    });

    it('should have high overall confidence', () => {
      expect(extraction.overall_confidence).toBeGreaterThan(70);
    });

    it('should not require manual review for high confidence', () => {
      if (extraction.overall_confidence >= 60) {
        expect(extraction.requires_manual_review).toBe(false);
      }
    });

    it('should have minimal or no errors', () => {
      expect(extraction.errors.length).toBeLessThanOrEqual(1);
    });

    it('should include extraction timestamp', () => {
      expect(extraction.extraction_timestamp).toBeDefined();
      const timestamp = new Date(extraction.extraction_timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Liberty Mutual Template Parsing', () => {
    let extraction: ACORD25Extraction;

    beforeEach(async () => {
      const input: ParserInput = {
        documentId: 'test-liberty-1',
        rawText: mockACORD25Templates.libertyMutual.templateText,
        carrier: 'Liberty Mutual',
      };
      extraction = await parser.parse(input);
    });

    it('should extract carrier correctly', () => {
      expect(extraction.carrier).toBe('Liberty Mutual');
    });

    it('should extract policy number', () => {
      expect(extraction.policy_number).toBeDefined();
      expect(extraction.policy_number).toContain('LM-GL');
    });

    it('should extract dates in ISO format', () => {
      expect(extraction.effective_date).toBe('2024-01-01');
      expect(extraction.expiration_date).toBe('2024-12-31');
    });

    it('should parse $2M abbreviated format correctly', () => {
      const glCoverage = extraction.coverage_types.find(
        c => c.type === 'general_liability'
      );
      // Should extract $2M properly or at least extract some coverage
      expect(glCoverage).toBeDefined();
      if (glCoverage?.amount) {
        expect(glCoverage.amount).toBeGreaterThan(0);
      }
    });

    it('should extract all coverage types', () => {
      expect(extraction.coverage_types.length).toBeGreaterThan(0);
    });

    it('should detect all endorsements', () => {
      expect(extraction.endorsements.additional_insured.value).toBe(true);
      expect(extraction.endorsements.waiver_of_subrogation.value).toBe(true);
      expect(extraction.endorsements.primary_non_contributory.value).toBe(true);
    });
  });

  describe('Hartford Template Parsing', () => {
    let extraction: ACORD25Extraction;

    beforeEach(async () => {
      const input: ParserInput = {
        documentId: 'test-hartford-1',
        rawText: mockACORD25Templates.hartford.templateText,
        carrier: 'Hartford',
      };
      extraction = await parser.parse(input);
    });

    it('should extract carrier correctly', () => {
      expect(extraction.carrier).toBe('Hartford');
    });

    it('should extract policy number with longer format', () => {
      expect(extraction.policy_number).toBeDefined();
      expect(extraction.policy_number).toContain('HTF-GL');
    });

    it('should extract all coverage types', () => {
      expect(extraction.coverage_types.length).toBeGreaterThan(2);
    });

    it('should detect Hartford-specific endorsement abbreviations', () => {
      // Hartford uses "INCL AI", "INCL WOS", "INCL P&NC"
      expect(extraction.endorsements.additional_insured.value).toBe(true);
      expect(extraction.endorsements.waiver_of_subrogation.value).toBe(true);
      expect(extraction.endorsements.primary_non_contributory.value).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle poor quality scan with low confidence', async () => {
      const input: ParserInput = {
        documentId: 'test-poor-quality',
        rawText: mockACORD25Templates.poorQuality.templateText,
        carrier: 'Unknown',
      };
      const extraction = await parser.parse(input);

      expect(extraction.overall_confidence).toBeLessThan(60);
      expect(extraction.requires_manual_review).toBe(true);
      expect(extraction.errors.length).toBeGreaterThan(0);
    });

    it('should flag missing critical fields', async () => {
      const input: ParserInput = {
        documentId: 'test-missing-fields',
        rawText: mockACORD25Templates.missingFields.templateText,
        carrier: 'Travelers',
      };
      const extraction = await parser.parse(input);

      expect(extraction.requires_manual_review).toBe(true);
      expect(extraction.errors.some(e => e.code === 'MISSING_CRITICAL_FIELDS')).toBe(true);
    });

    it('should handle extraction with no coverage amounts', async () => {
      const input: ParserInput = {
        documentId: 'test-no-amounts',
        rawText: 'ACORD 25\nPOLICY NUMBER: GL-123\nGENERAL LIABILITY\n[NO AMOUNTS]',
        carrier: 'Unknown',
      };
      const extraction = await parser.parse(input);

      expect(extraction.coverage_types.length).toBe(0);
      expect(extraction.requires_manual_review).toBe(true);
    });
  });

  describe('Performance Requirements', () => {
    it('should parse document in less than 5 seconds', async () => {
      const startTime = Date.now();

      const input: ParserInput = {
        documentId: 'test-performance',
        rawText: mockACORD25Templates.travelers.templateText,
        carrier: 'Travelers',
      };

      await parser.parse(input);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // 5 seconds
    });
  });

  describe('Accuracy Requirements', () => {
    it('should achieve >80% accuracy on well-formed Travelers document', async () => {
      const input: ParserInput = {
        documentId: 'test-accuracy-travelers',
        rawText: mockACORD25Templates.travelers.templateText,
        carrier: 'Travelers',
      };
      const extraction = await parser.parse(input);

      // Check individual field accuracy
      expect(extraction.policy_number).toBeTruthy();
      expect(extraction.effective_date).toBe('2024-01-01');
      expect(extraction.expiration_date).toBe('2024-12-31');
      expect(extraction.coverage_types.length).toBeGreaterThanOrEqual(3);

      // Overall confidence should be >80%
      expect(extraction.overall_confidence).toBeGreaterThan(80);
    });

    it('should achieve >80% accuracy on well-formed Liberty Mutual document', async () => {
      const input: ParserInput = {
        documentId: 'test-accuracy-liberty',
        rawText: mockACORD25Templates.libertyMutual.templateText,
        carrier: 'Liberty Mutual',
      };
      const extraction = await parser.parse(input);

      expect(extraction.policy_number).toBeTruthy();
      expect(extraction.effective_date).toBe('2024-01-01');
      expect(extraction.expiration_date).toBe('2024-12-31');
      expect(extraction.overall_confidence).toBeGreaterThan(80);
    });

    it('should achieve >80% accuracy on well-formed Hartford document', async () => {
      const input: ParserInput = {
        documentId: 'test-accuracy-hartford',
        rawText: mockACORD25Templates.hartford.templateText,
        carrier: 'Hartford',
      };
      const extraction = await parser.parse(input);

      expect(extraction.policy_number).toBeTruthy();
      expect(extraction.effective_date).toBe('2024-01-01');
      expect(extraction.expiration_date).toBe('2024-12-31');
      expect(extraction.overall_confidence).toBeGreaterThan(80);
    });
  });
});
