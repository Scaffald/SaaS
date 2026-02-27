/**
 * Unit tests for the Procore collision detection module.
 *
 * Tests normalizeName() and detectCollision() which are used to match
 * incoming Procore entities against existing ForSured records.
 */
import { describe, it, expect } from 'vitest';
import {
  normalizeName,
  detectCollision,
  type CollisionResult,
} from '@/server/lib/procore/collision-detector';

const existingRecords = [
  { id: 'uuid-1', name: 'Acme Construction', procore_id: null },
  { id: 'uuid-2', name: 'Downtown Tower', procore_id: '999' },
  { id: 'uuid-3', name: 'Sunrise Builders', procore_id: null },
];

describe('procore/collision-detector', () => {
  describe('normalizeName', () => {
    it('lowercases and trims whitespace', () => {
      expect(normalizeName('  Acme Corp  ')).toBe('acme');
    });

    it('strips common business suffixes (llc)', () => {
      expect(normalizeName('Acme Construction LLC')).toBe(
        'acme construction',
      );
    });

    it('strips common business suffixes (inc with punctuation)', () => {
      expect(normalizeName('Bob Inc.')).toBe('bob');
    });

    it('strips multiple suffixes', () => {
      expect(normalizeName('Mega Services Group')).toBe('mega');
    });

    it('keeps meaningful domain words like construction and builders', () => {
      const result = normalizeName('Sunrise Builders');
      expect(result).toBe('sunrise builders');
    });

    it('strips punctuation', () => {
      expect(normalizeName("O'Brien & Sons, Ltd.")).toBe('obrien sons');
    });

    it('collapses extra whitespace', () => {
      expect(normalizeName('  Multiple   Spaces   Here  ')).toBe(
        'multiple spaces here',
      );
    });

    it('handles empty string', () => {
      expect(normalizeName('')).toBe('');
    });

    it('strips enterprises suffix', () => {
      expect(normalizeName('Pinnacle Enterprises')).toBe('pinnacle');
    });

    it('strips company suffix', () => {
      expect(normalizeName('Ajax Company')).toBe('ajax');
    });
  });

  describe('detectCollision', () => {
    it('returns exact_match with resolution link when procore_id matches', () => {
      const result = detectCollision(
        { id: 999, name: 'Some Random Name' },
        existingRecords,
        'procore_id',
      );

      expect(result.matchStatus).toBe('exact_match');
      expect(result.matchedEntityId).toBe('uuid-2');
      expect(result.confidence).toBe(1.0);
      expect(result.resolution).toBe('link');
      expect(result.matchReason).toContain('procore_id');
    });

    it('returns exact_match with resolution pending on exact normalized name match', () => {
      const result = detectCollision(
        { id: 5000, name: 'Acme Construction LLC' },
        existingRecords,
        'procore_id',
      );

      expect(result.matchStatus).toBe('exact_match');
      expect(result.matchedEntityId).toBe('uuid-1');
      expect(result.confidence).toBe(1.0);
      expect(result.resolution).toBe('pending');
      expect(result.matchReason).toContain('name');
    });

    it('returns fuzzy_match when names are similar but not identical', () => {
      // 'Sunrise Builder' vs 'Sunrise Builders' — very close
      const result = detectCollision(
        { id: 7000, name: 'Sunrise Builder' },
        existingRecords,
        'procore_id',
      );

      expect(result.matchStatus).toBe('fuzzy_match');
      expect(result.matchedEntityId).toBe('uuid-3');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.confidence).toBeLessThan(1.0);
      expect(result.resolution).toBe('pending');
    });

    it('returns no_match when nothing matches', () => {
      const result = detectCollision(
        { id: 8000, name: 'Completely Different Entity' },
        existingRecords,
        'procore_id',
      );

      expect(result.matchStatus).toBe('no_match');
      expect(result.matchedEntityId).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.resolution).toBe('pending');
      expect(result.matchReason).toBeNull();
    });

    it('supports procore_vendor_id field for matching', () => {
      const recordsWithVendorId = [
        {
          id: 'uuid-v1',
          name: 'Vendor Alpha',
          procore_id: null,
          procore_vendor_id: '42',
        },
      ];

      const result = detectCollision(
        { id: 42, name: 'Something Else' },
        recordsWithVendorId,
        'procore_vendor_id',
      );

      expect(result.matchStatus).toBe('exact_match');
      expect(result.matchedEntityId).toBe('uuid-v1');
      expect(result.resolution).toBe('link');
    });

    it('prioritizes procore_id match over name match', () => {
      const records = [
        { id: 'uuid-a', name: 'Acme Construction', procore_id: '123' },
        { id: 'uuid-b', name: 'Acme Construction', procore_id: null },
      ];

      const result = detectCollision(
        { id: 123, name: 'Acme Construction' },
        records,
        'procore_id',
      );

      // Should match on procore_id first (uuid-a), not just name
      expect(result.matchedEntityId).toBe('uuid-a');
      expect(result.resolution).toBe('link');
    });

    it('returns no_match for empty existing records', () => {
      const result = detectCollision(
        { id: 1, name: 'Something' },
        [],
        'procore_id',
      );

      expect(result.matchStatus).toBe('no_match');
      expect(result.matchedEntityId).toBeNull();
    });

    it('picks the best fuzzy match when multiple fuzzy candidates exist', () => {
      const records = [
        { id: 'uuid-x', name: 'Alpha Beta Gamma', procore_id: null },
        { id: 'uuid-y', name: 'Alpha Beta', procore_id: null },
      ];

      const result = detectCollision(
        { id: 9999, name: 'Alpha Beta' },
        records,
        'procore_id',
      );

      // Exact normalized match on uuid-y
      expect(result.matchedEntityId).toBe('uuid-y');
      expect(result.matchStatus).toBe('exact_match');
    });
  });
});
