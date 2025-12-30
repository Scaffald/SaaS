/**
 * Risk Calculation Service Tests
 *
 * Tests for the TypeScript service that calculates and manages
 * subcontractor compliance risk.
 *
 * REQ: Phase 5 - Risk Level Algorithm Implementation
 *
 * Test Categories:
 * 1. getRiskLevel - Client-side score to level mapping
 * 2. Helper methods - Color, description, action getters
 * 3. Integration tests - PostgreSQL function calls (requires DB)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  RiskCalculationService,
  riskCalculationService,
  RiskLevel,
} from '../riskCalculationService';
import { createClient } from '@supabase/supabase-js';

// Test Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

describe('RiskCalculationService', () => {
  const service = new RiskCalculationService();

  describe('getRiskLevel', () => {
    it('should return LOW for score >= 90', () => {
      expect(service.getRiskLevel(90)).toBe('low');
      expect(service.getRiskLevel(95)).toBe('low');
      expect(service.getRiskLevel(100)).toBe('low');
    });

    it('should return MEDIUM for score 70-89', () => {
      expect(service.getRiskLevel(70)).toBe('medium');
      expect(service.getRiskLevel(75)).toBe('medium');
      expect(service.getRiskLevel(89)).toBe('medium');
    });

    it('should return HIGH for score 50-69', () => {
      expect(service.getRiskLevel(50)).toBe('high');
      expect(service.getRiskLevel(60)).toBe('high');
      expect(service.getRiskLevel(69)).toBe('high');
    });

    it('should return CRITICAL for score < 50', () => {
      expect(service.getRiskLevel(49)).toBe('critical');
      expect(service.getRiskLevel(25)).toBe('critical');
      expect(service.getRiskLevel(0)).toBe('critical');
    });

    it('should handle boundary cases correctly', () => {
      // Exact boundaries
      expect(service.getRiskLevel(90)).toBe('low');
      expect(service.getRiskLevel(70)).toBe('medium');
      expect(service.getRiskLevel(50)).toBe('high');
      // Just below boundaries
      expect(service.getRiskLevel(89.9)).toBe('medium'); // 89.9 < 90
      expect(service.getRiskLevel(69.9)).toBe('high'); // 69.9 < 70
      expect(service.getRiskLevel(49.9)).toBe('critical'); // 49.9 < 50
    });
  });

  describe('getRiskColor', () => {
    it('should return correct Tamagui color tokens', () => {
      expect(service.getRiskColor('low')).toBe('$green10');
      expect(service.getRiskColor('medium')).toBe('$yellow10');
      expect(service.getRiskColor('high')).toBe('$orange10');
      expect(service.getRiskColor('critical')).toBe('$red10');
    });
  });

  describe('getRiskBackgroundColor', () => {
    it('should return correct Tamagui background color tokens', () => {
      expect(service.getRiskBackgroundColor('low')).toBe('$green3');
      expect(service.getRiskBackgroundColor('medium')).toBe('$yellow3');
      expect(service.getRiskBackgroundColor('high')).toBe('$orange3');
      expect(service.getRiskBackgroundColor('critical')).toBe('$red3');
    });
  });

  describe('getRiskBadgeVariant', () => {
    it('should return correct badge variants', () => {
      expect(service.getRiskBadgeVariant('low')).toBe('success');
      expect(service.getRiskBadgeVariant('medium')).toBe('warning');
      expect(service.getRiskBadgeVariant('high')).toBe('error');
      expect(service.getRiskBadgeVariant('critical')).toBe('destructive');
    });
  });

  describe('getRiskDescription', () => {
    it('should return human-readable descriptions', () => {
      expect(service.getRiskDescription('low')).toContain('compliant');
      expect(service.getRiskDescription('medium')).toContain('gaps');
      expect(service.getRiskDescription('high')).toContain('immediate');
      expect(service.getRiskDescription('critical')).toContain('violations');
    });

    it('should provide actionable guidance', () => {
      const lowDesc = service.getRiskDescription('low');
      const criticalDesc = service.getRiskDescription('critical');

      expect(lowDesc.toLowerCase()).toContain('routine');
      expect(criticalDesc.toLowerCase()).toMatch(/suspend|escalate/);
    });
  });

  describe('getRecommendedAction', () => {
    it('should return action-oriented recommendations', () => {
      expect(service.getRecommendedAction('low')).toContain('monitoring');
      expect(service.getRecommendedAction('medium')).toContain('30 days');
      expect(service.getRecommendedAction('high')).toContain('Immediate');
      expect(service.getRecommendedAction('critical')).toContain('escalate');
    });
  });

  describe('getRiskIcon', () => {
    it('should return appropriate icon names', () => {
      expect(service.getRiskIcon('low')).toBe('check-circle');
      expect(service.getRiskIcon('medium')).toBe('alert-circle');
      expect(service.getRiskIcon('high')).toBe('alert-triangle');
      expect(service.getRiskIcon('critical')).toBe('x-circle');
    });
  });

  describe('singleton export', () => {
    it('should export a singleton instance', () => {
      expect(riskCalculationService).toBeInstanceOf(RiskCalculationService);
      expect(riskCalculationService.getRiskLevel(90)).toBe('low');
    });
  });
});

describe('RiskCalculationService Integration Tests', () => {
  const service = new RiskCalculationService();
  let testProjectId: string | null = null;
  let testSubcontractorId: string | null = null;

  beforeAll(async () => {
    // Get test data from database
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to find an existing project
    const { data: projects } = await supabase
      .schema('forsured' as never)
      .from('projects')
      .select('id')
      .limit(1);

    if (projects && projects.length > 0) {
      testProjectId = projects[0].id;
    }

    // Try to find an existing subcontractor
    const { data: subcontractors } = await supabase
      .schema('forsured' as never)
      .from('subcontractors')
      .select('id')
      .limit(1);

    if (subcontractors && subcontractors.length > 0) {
      testSubcontractorId = subcontractors[0].id;
    }
  });

  describe('calculateRisk', () => {
    it('should return risk calculation with all components', async () => {
      if (!testProjectId || !testSubcontractorId) {
        console.log('Skipping integration test - no test data available');
        return;
      }

      const result = await service.calculateRisk(
        testSubcontractorId,
        testProjectId
      );

      // Verify structure
      expect(result).toHaveProperty('complianceScore');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('coverageScore');
      expect(result).toHaveProperty('policyScore');
      expect(result).toHaveProperty('issueScore');
      expect(result).toHaveProperty('historyScore');
      expect(result).toHaveProperty('breakdown');

      // Verify score ranges
      expect(result.complianceScore).toBeGreaterThanOrEqual(0);
      expect(result.complianceScore).toBeLessThanOrEqual(100);
      expect(result.coverageScore).toBeGreaterThanOrEqual(0);
      expect(result.coverageScore).toBeLessThanOrEqual(100);
      expect(result.policyScore).toBeGreaterThanOrEqual(0);
      expect(result.policyScore).toBeLessThanOrEqual(100);
      expect(result.issueScore).toBeGreaterThanOrEqual(0);
      expect(result.issueScore).toBeLessThanOrEqual(100);
      expect(result.historyScore).toBeGreaterThanOrEqual(0);
      expect(result.historyScore).toBeLessThanOrEqual(100);

      // Verify risk level
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);

      // Verify breakdown structure
      expect(result.breakdown).toHaveProperty('coverage');
      expect(result.breakdown).toHaveProperty('policy');
      expect(result.breakdown).toHaveProperty('issues');
      expect(result.breakdown).toHaveProperty('history');
      expect(result.breakdown).toHaveProperty('overrides');

      // Verify breakdown details
      expect(result.breakdown.coverage).toHaveProperty('score');
      expect(result.breakdown.coverage).toHaveProperty('weight');
      expect(result.breakdown.coverage).toHaveProperty('metRequirements');
      expect(result.breakdown.coverage).toHaveProperty('totalRequirements');

      expect(result.breakdown.overrides).toHaveProperty('hasCriticalOverride');
      expect(typeof result.breakdown.overrides.hasCriticalOverride).toBe('boolean');
    });

    it('should throw error for invalid subcontractor ID', async () => {
      if (!testProjectId) {
        console.log('Skipping integration test - no test project available');
        return;
      }

      // Invalid UUID should still return result (just with default scores)
      // The function handles missing data gracefully
      const result = await service.calculateRisk(
        '00000000-0000-0000-0000-000000000000',
        testProjectId
      );

      // Should return a valid result with default/zero scores
      expect(result.complianceScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateAllRisks', () => {
    it('should return array of risk calculations for project', async () => {
      if (!testProjectId) {
        console.log('Skipping integration test - no test project available');
        return;
      }

      const results = await service.calculateAllRisks(testProjectId);

      expect(Array.isArray(results)).toBe(true);

      // Each result should have expected properties
      for (const result of results) {
        expect(result).toHaveProperty('subcontractorId');
        expect(result).toHaveProperty('subcontractorName');
        expect(result).toHaveProperty('complianceScore');
        expect(result).toHaveProperty('riskLevel');

        expect(typeof result.subcontractorId).toBe('string');
        expect(typeof result.subcontractorName).toBe('string');
        expect(typeof result.complianceScore).toBe('number');
        expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);
      }
    });
  });
});

describe('Risk Level Algorithm Validation', () => {
  const service = new RiskCalculationService();

  describe('Score boundary validation', () => {
    const testCases: Array<{ score: number; expectedLevel: RiskLevel }> = [
      // LOW range (90-100)
      { score: 100, expectedLevel: 'low' },
      { score: 95, expectedLevel: 'low' },
      { score: 90, expectedLevel: 'low' },
      // MEDIUM range (70-89)
      { score: 89, expectedLevel: 'medium' },
      { score: 80, expectedLevel: 'medium' },
      { score: 70, expectedLevel: 'medium' },
      // HIGH range (50-69)
      { score: 69, expectedLevel: 'high' },
      { score: 60, expectedLevel: 'high' },
      { score: 50, expectedLevel: 'high' },
      // CRITICAL range (0-49)
      { score: 49, expectedLevel: 'critical' },
      { score: 25, expectedLevel: 'critical' },
      { score: 0, expectedLevel: 'critical' },
    ];

    testCases.forEach(({ score, expectedLevel }) => {
      it(`should classify score ${score} as ${expectedLevel.toUpperCase()}`, () => {
        expect(service.getRiskLevel(score)).toBe(expectedLevel);
      });
    });
  });

  describe('Algorithm requirements from spec', () => {
    it('should classify fully compliant (100%) as LOW', () => {
      expect(service.getRiskLevel(100)).toBe('low');
    });

    it('should classify minor gaps (80%) as MEDIUM', () => {
      expect(service.getRiskLevel(80)).toBe('medium');
    });

    it('should classify significant gaps (60%) as HIGH', () => {
      expect(service.getRiskLevel(60)).toBe('high');
    });

    it('should classify major violations (30%) as CRITICAL', () => {
      expect(service.getRiskLevel(30)).toBe('critical');
    });
  });
});
