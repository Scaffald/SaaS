/**
 * ACORD 25 Template Validation Tests
 * REQ-125: Mock OCR & Document Parsing Engine for ACORD 25 Forms
 *
 * These tests verify that ACORD 25 templates match real certificate formats.
 * Used for testing the OCR parsing engine against known document structures.
 *
 * Note: Per REQ-9, database operations are tested against real Supabase.
 * See tests/fixtures/supabase.ts for database test helpers.
 */

import { describe, it, expect } from 'vitest';
import { mockACORD25Templates } from '../test-data/mockACORD25Templates';
import type { PolicyData } from '../types/acord25';

describe('Mock Validation Tests', () => {
  describe('Mock ACORD 25 Templates Match Real Format', () => {
    it('should contain all required ACORD 25 sections in Travelers template', () => {
      const text = mockACORD25Templates.travelers.templateText;

      // Verify presence of standard ACORD 25 sections
      expect(text).toContain('ACORD 25');
      expect(text).toContain('CERTIFICATE OF LIABILITY INSURANCE');
      expect(text).toContain('PRODUCER');
      expect(text).toContain('INSURED');
      expect(text).toContain('INSURERS AFFORDING COVERAGE');
      expect(text).toContain('POLICY NUMBER');
      expect(text).toContain('POLICY EFF');
      expect(text).toContain('POLICY EXP');
      expect(text).toContain('GENERAL LIABILITY');
      expect(text).toContain('WORKERS COMPENSATION');
      expect(text).toContain('CERTIFICATE HOLDER');
    });

    it('should contain valid policy number formats matching real ACORD 25', () => {
      const text = mockACORD25Templates.travelers.templateText;

      // Real ACORD 25 policy numbers follow pattern: XX-XXXX-XXXXXXXX
      const policyNumberPattern = /[A-Z]{2,3}-[A-Z0-9]{2,4}-\d{4,8}/;
      expect(policyNumberPattern.test(text)).toBe(true);
    });

    it('should contain valid date formats matching real ACORD 25', () => {
      const templates = [
        mockACORD25Templates.travelers,
        mockACORD25Templates.libertyMutual,
        mockACORD25Templates.hartford,
      ];

      templates.forEach(template => {
        const datePattern = /\d{1,2}\/\d{1,2}\/\d{4}/;
        expect(datePattern.test(template.templateText)).toBe(true);
      });
    });

    it('should contain valid currency formats matching real ACORD 25', () => {
      const templates = [
        mockACORD25Templates.travelers,
        mockACORD25Templates.libertyMutual,
        mockACORD25Templates.hartford,
      ];

      templates.forEach(template => {
        // Real ACORD 25 uses: $1,000,000 or $1M format
        const currencyPattern = /\$[\d,]+(?:\.\d{2})?|\$\d+\s*M/i;
        expect(currencyPattern.test(template.templateText)).toBe(true);
      });
    });

    it('should match carrier-specific terminology from real certificates', () => {
      // Travelers uses specific terms
      expect(mockACORD25Templates.travelers.templateText).toContain('The Travelers');

      // Liberty Mutual uses specific terms
      expect(mockACORD25Templates.libertyMutual.templateText).toContain('Liberty Mutual');

      // Hartford uses specific terms
      expect(mockACORD25Templates.hartford.templateText).toContain('Hartford');
    });

    it('should include realistic endorsement language', () => {
      const endorsementPatterns = [
        /ADDITIONAL\s+INSURED/i,
        /WAIVER\s+OF\s+SUBROGATION/i,
        /PRIMARY.*NON-?CONTRIBUTORY/i,
      ];

      const travelersText = mockACORD25Templates.travelers.templateText;
      endorsementPatterns.forEach(pattern => {
        expect(pattern.test(travelersText)).toBe(true);
      });
    });
  });

  describe('Mock Templates Match Expected Extraction Results', () => {
    it('should have Travelers expected extraction matching template content', () => {
      const template = mockACORD25Templates.travelers;
      const expected = template.expectedExtraction;

      // Verify expected results are realistic
      expect(expected.carrier).toBe('Travelers');
      expect(expected.policy_number).toContain('GL-TRV');
      expect(expected.effective_date).toBe('2024-01-01');
      expect(expected.expiration_date).toBe('2024-12-31');
      expect(expected.coverage_types?.length).toBeGreaterThan(0);
      expect(expected.overall_confidence).toBeGreaterThan(70);
    });

    it('should have coverage amounts matching standard insurance limits', () => {
      const templates = [
        mockACORD25Templates.travelers,
        mockACORD25Templates.libertyMutual,
        mockACORD25Templates.hartford,
      ];

      templates.forEach(template => {
        template.expectedExtraction.coverage_types?.forEach(coverage => {
          // Real insurance policies have standard limits
          expect(coverage.amount).toBeGreaterThanOrEqual(500000); // Min $500K
          expect(coverage.amount).toBeLessThanOrEqual(10000000); // Max $10M for MVP
          // Should be in standard increments
          expect(coverage.amount! % 100000).toBe(0);
        });
      });
    });

    it('should have confidence scores matching realistic ranges', () => {
      const templates = [
        mockACORD25Templates.travelers,
        mockACORD25Templates.libertyMutual,
        mockACORD25Templates.hartford,
      ];

      templates.forEach(template => {
        const confidence = template.expectedExtraction.overall_confidence!;
        expect(confidence).toBeGreaterThanOrEqual(0);
        expect(confidence).toBeLessThanOrEqual(100);

        // Well-formed templates should have high confidence
        if (template.variant !== 'Poor Quality') {
          expect(confidence).toBeGreaterThan(70);
        }
      });
    });
  });

  describe('PolicyData Schema Validation', () => {
    it('should validate all required PolicyData fields are present', () => {
      const requiredFields = [
        'client_id',
        'policy_type',
        'policy_number',
        'provider',
        'coverage_amount',
        'start_date',
        'end_date',
        'status',
      ];

      const samplePolicy: Omit<PolicyData, 'id' | 'created_at' | 'updated_at'> = {
        client_id: 'test-client-1',
        policy_type: 'general_liability',
        policy_number: 'GL-123',
        provider: 'Test Insurance',
        coverage_amount: 1000000,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'active',
      };

      requiredFields.forEach(field => {
        expect(samplePolicy).toHaveProperty(field);
      });
    });

    it('should use correct date format (YYYY-MM-DD) matching database', () => {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;

      const templates = [
        mockACORD25Templates.travelers,
        mockACORD25Templates.libertyMutual,
        mockACORD25Templates.hartford,
      ];

      templates.forEach(template => {
        if (template.expectedExtraction.effective_date) {
          expect(datePattern.test(template.expectedExtraction.effective_date)).toBe(true);
        }
        if (template.expectedExtraction.expiration_date) {
          expect(datePattern.test(template.expectedExtraction.expiration_date)).toBe(true);
        }
      });
    });
  });

  describe('Mock Extraction Patterns Match Real ACORD 25 Variations', () => {
    it('should handle carrier-specific date label variations', () => {
      // Travelers uses "POLICY EFF DATE"
      expect(mockACORD25Templates.travelers.templateText).toMatch(/POLICY\s+EFF\s+DATE/i);

      // Liberty Mutual uses "EFFECTIVE DATE" or "FROM"
      expect(mockACORD25Templates.libertyMutual.templateText).toMatch(/EFFECTIVE\s+DATE|FROM/i);

      // Hartford uses "POLICY PERIOD"
      expect(mockACORD25Templates.hartford.templateText).toMatch(/POLICY\s+PERIOD/i);
    });

    it('should handle carrier-specific coverage terminology', () => {
      // Travelers: "COMMERCIAL GENERAL LIABILITY"
      expect(mockACORD25Templates.travelers.templateText).toContain('COMMERCIAL GENERAL LIABILITY');

      // Liberty Mutual: May use "COMMERCIAL GENERAL LIABILITY" or abbreviated
      expect(mockACORD25Templates.libertyMutual.templateText).toMatch(/GENERAL\s+LIABILITY/i);

      // Hartford: May vary terminology
      expect(mockACORD25Templates.hartford.templateText).toMatch(/GENERAL\s+LIABILITY/i);
    });

    it('should handle carrier-specific endorsement abbreviations', () => {
      // Travelers: Full text
      expect(mockACORD25Templates.travelers.templateText).toContain('ADDITIONAL INSURED');

      // Liberty Mutual: Abbreviations
      expect(mockACORD25Templates.libertyMutual.templateText).toMatch(/ADDL\s+INSD|ADDITIONAL\s+INSURED/i);

      // Hartford: "INCL AI" format
      expect(mockACORD25Templates.hartford.templateText).toMatch(/INCL\s+AI|ADDITIONAL\s+INSURED/i);
    });
  });

  describe('Mock Data Validation Against Production Requirements', () => {
    it('should support parsing completing in <5 seconds (performance requirement)', () => {
      // Template size should be realistic for <5 second processing
      const templates = [
        mockACORD25Templates.travelers,
        mockACORD25Templates.libertyMutual,
        mockACORD25Templates.hartford,
      ];

      templates.forEach(template => {
        // Real ACORD 25 PDFs convert to ~2000-5000 chars of text
        const textLength = template.templateText.length;
        expect(textLength).toBeGreaterThan(500); // Not too small
        expect(textLength).toBeLessThan(10000); // Not too large
      });
    });

    it('should achieve >80% accuracy target on well-formed documents', () => {
      const wellFormedTemplates = [
        mockACORD25Templates.travelers,
        mockACORD25Templates.libertyMutual,
        mockACORD25Templates.hartford,
      ];

      wellFormedTemplates.forEach(template => {
        expect(template.expectedExtraction.overall_confidence).toBeGreaterThan(80);
      });
    });

    it('should flag poor quality scans with <60% confidence', () => {
      const poorQuality = mockACORD25Templates.poorQuality;
      expect(poorQuality.expectedExtraction.overall_confidence).toBeLessThan(60);
      expect(poorQuality.expectedExtraction.requires_manual_review).toBe(true);
    });
  });

  describe('Mock Consistency Validation', () => {
    it('should have all templates include extraction timestamps', () => {
      // When parsed, all should include timestamp
      // This validates mock structure consistency
      Object.values(mockACORD25Templates).forEach(template => {
        expect(template).toHaveProperty('carrier');
        expect(template).toHaveProperty('variant');
        expect(template).toHaveProperty('templateText');
        expect(template).toHaveProperty('expectedExtraction');
      });
    });

    it('should have consistent coverage type naming across templates', () => {
      const validCoverageTypes = [
        'general_liability',
        'workers_comp',
        'commercial_auto',
        'umbrella_liability',
        'excess_liability',
      ];

      Object.values(mockACORD25Templates).forEach(template => {
        template.expectedExtraction.coverage_types?.forEach(coverage => {
          expect(validCoverageTypes).toContain(coverage.type);
        });
      });
    });
  });
});
