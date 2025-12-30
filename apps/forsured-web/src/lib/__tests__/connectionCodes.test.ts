import { describe, it, expect } from 'vitest';
import {
  generateRelationshipCode,
  generateReferralCode,
  parseCodeType,
} from '../connectionCodes';

describe('connectionCodes', () => {
  describe('generateRelationshipCode', () => {
    it('should generate BKR- code for broker type', () => {
      const code = generateRelationshipCode('BKR');
      expect(code).toMatch(/^BKR-[A-Z0-9]{6}$/);
    });

    it('should generate CTR- code for contractor type', () => {
      const code = generateRelationshipCode('CTR');
      expect(code).toMatch(/^CTR-[A-Z0-9]{6}$/);
    });

    it('should generate MGR- code for manager type', () => {
      const code = generateRelationshipCode('MGR');
      expect(code).toMatch(/^MGR-[A-Z0-9]{6}$/);
    });

    it('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateRelationshipCode('BKR'));
      }
      expect(codes.size).toBe(100);
    });

    it('should only use valid characters (A-Z, 0-9)', () => {
      const code = generateRelationshipCode('BKR');
      const codeWithoutPrefix = code.split('-')[1];
      expect(codeWithoutPrefix).toMatch(/^[A-Z0-9]+$/);
    });

    it('should generate codes with exactly 6 characters after prefix', () => {
      const code = generateRelationshipCode('MGR');
      const codeWithoutPrefix = code.split('-')[1];
      expect(codeWithoutPrefix).toHaveLength(6);
    });
  });

  describe('generateReferralCode', () => {
    it('should generate RFR- code', () => {
      const code = generateReferralCode();
      expect(code).toMatch(/^RFR-[A-Z0-9]{6}$/);
    });

    it('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateReferralCode());
      }
      expect(codes.size).toBe(100);
    });

    it('should only use valid characters (A-Z, 0-9)', () => {
      const code = generateReferralCode();
      const codeWithoutPrefix = code.split('-')[1];
      expect(codeWithoutPrefix).toMatch(/^[A-Z0-9]+$/);
    });

    it('should generate codes with exactly 6 characters after prefix', () => {
      const code = generateReferralCode();
      const codeWithoutPrefix = code.split('-')[1];
      expect(codeWithoutPrefix).toHaveLength(6);
    });
  });

  describe('parseCodeType', () => {
    it('should identify broker codes', () => {
      expect(parseCodeType('BKR-ABC123')).toBe('BKR');
    });

    it('should identify contractor codes', () => {
      expect(parseCodeType('CTR-XYZ789')).toBe('CTR');
    });

    it('should identify manager codes', () => {
      expect(parseCodeType('MGR-DEF456')).toBe('MGR');
    });

    it('should identify referral codes', () => {
      expect(parseCodeType('RFR-ABCD12')).toBe('RFR');
    });

    it('should return null for invalid codes', () => {
      expect(parseCodeType('INVALID-CODE')).toBeNull();
      expect(parseCodeType('ABC-123456')).toBeNull();
      expect(parseCodeType('BKR123456')).toBeNull();
      expect(parseCodeType('BKR-')).toBeNull();
      expect(parseCodeType('')).toBeNull();
    });

    it('should be case-insensitive', () => {
      expect(parseCodeType('bkr-abc123')).toBe('BKR');
      expect(parseCodeType('Ctr-XYZ789')).toBe('CTR');
      expect(parseCodeType('mGr-DEF456')).toBe('MGR');
      expect(parseCodeType('rfr-ABCD12')).toBe('RFR');
    });

    it('should handle codes with spaces', () => {
      expect(parseCodeType(' BKR-ABC123 ')).toBe('BKR');
    });
  });

  describe('code format validation', () => {
    it('should reject codes with wrong length', () => {
      expect(parseCodeType('BKR-ABC12')).toBeNull(); // Too short
      expect(parseCodeType('BKR-ABC1234')).toBeNull(); // Too long
      expect(parseCodeType('RFR-ABC12345')).toBeNull(); // RFR should be 6 chars
    });

    it('should reject codes with invalid characters', () => {
      expect(parseCodeType('BKR-ABC12$')).toBeNull();
      expect(parseCodeType('BKR-ABC 12')).toBeNull();
      expect(parseCodeType('BKR-abc!@#')).toBeNull(); // Special characters not allowed
    });

    it('should reject codes without hyphen', () => {
      expect(parseCodeType('BKRABC123')).toBeNull();
    });
  });

  describe('code collision probability', () => {
    it('should have very low collision probability', () => {
      // With 6 characters from 36 possible (A-Z, 0-9), we have 36^6 = 2,176,782,336 possibilities
      // Generate 10,000 codes and check for no collisions
      const codes = new Set();
      for (let i = 0; i < 10000; i++) {
        const code = generateRelationshipCode('BKR');
        expect(codes.has(code)).toBe(false);
        codes.add(code);
      }
    });
  });
});

