/**
 * Unit Tests for RiskBreakdown Component
 * REQ: Phase 5 - Risk Level Algorithm Implementation
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { RiskBreakdown, RiskSummary } from '../RiskBreakdown';
import { RiskBreakdown as RiskBreakdownType, RiskLevel } from '../../../lib/compliance/riskCalculationService';

// Test data factory
function createMockBreakdown(overrides: Partial<RiskBreakdownType> = {}): RiskBreakdownType {
  return {
    coverage: {
      score: 85,
      weight: 0.4,
      weighted: 34,
      metRequirements: 4,
      totalRequirements: 5,
      ...overrides.coverage,
    },
    policy: {
      score: 75,
      weight: 0.25,
      weighted: 19,
      penalty: 25,
      anyExpiredOver60: false,
      ...overrides.policy,
    },
    issues: {
      score: 90,
      weight: 0.2,
      weighted: 18,
      infoPenalty: 4,
      warningPenalty: 6,
      errorPenalty: 0,
      criticalCount: 0,
      anyCriticalOver14Days: false,
      ...overrides.issues,
    },
    history: {
      score: 80,
      weight: 0.15,
      weighted: 12,
      currentScore: 83,
      score90DaysAgo: 78,
      trend: 'stable',
      ...overrides.history,
    },
    overrides: {
      hasCriticalOverride: false,
      expiredPolicyOverride: false,
      criticalIssueOverride: false,
      lowCoverageOverride: false,
      ...overrides.overrides,
    },
  };
}

describe('RiskBreakdown Component', () => {
  describe('Basic Rendering', () => {
    it('should render the title', () => {
      const breakdown = createMockBreakdown();
      render(
        <RiskBreakdown
          breakdown={breakdown}
          riskLevel="medium"
          complianceScore={83}
        />
      );
      expect(screen.getByText('Risk Score Breakdown')).toBeInTheDocument();
    });

    it('should render overall score', () => {
      const breakdown = createMockBreakdown();
      render(
        <RiskBreakdown
          breakdown={breakdown}
          riskLevel="medium"
          complianceScore={83}
        />
      );
      expect(screen.getByText(/Overall Score: 83%/)).toBeInTheDocument();
    });

    it('should render all component labels', () => {
      const breakdown = createMockBreakdown();
      render(
        <RiskBreakdown
          breakdown={breakdown}
          riskLevel="medium"
          complianceScore={83}
        />
      );
      expect(screen.getByText('Coverage')).toBeInTheDocument();
      expect(screen.getByText('Policy Status')).toBeInTheDocument();
      expect(screen.getByText('Issues')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
    });
  });

  describe('Component Scores Display', () => {
    it('should display coverage score and weight', () => {
      const breakdown = createMockBreakdown({
        coverage: { score: 85, weight: 0.4, weighted: 34, metRequirements: 4, totalRequirements: 5 },
      });
      render(
        <RiskBreakdown
          breakdown={breakdown}
          riskLevel="medium"
          complianceScore={83}
        />
      );
      // Text is split across elements, check for key parts
      expect(screen.getByText('Coverage')).toBeInTheDocument();
      expect(screen.getByText(/85%/)).toBeInTheDocument();
    });

    it('should display policy score and weight', () => {
      const breakdown = createMockBreakdown({
        policy: { score: 75, weight: 0.25, weighted: 19, penalty: 25, anyExpiredOver60: false },
      });
      render(
        <RiskBreakdown
          breakdown={breakdown}
          riskLevel="medium"
          complianceScore={83}
        />
      );
      // Text is split across elements, check for key parts
      expect(screen.getByText('Policy Status')).toBeInTheDocument();
      expect(screen.getByText(/75%/)).toBeInTheDocument();
    });
  });

  describe('Details Display', () => {
    it('should show details when showDetails is true', () => {
      const breakdown = createMockBreakdown({
        coverage: { score: 80, weight: 0.4, weighted: 32, metRequirements: 4, totalRequirements: 5 },
      });
      render(
        <RiskBreakdown
          breakdown={breakdown}
          riskLevel="medium"
          complianceScore={80}
          showDetails
        />
      );
      expect(screen.getByText('4/5 requirements met')).toBeInTheDocument();
    });

    it('should show history trend in details', () => {
      const breakdown = createMockBreakdown({
        history: { score: 80, weight: 0.15, weighted: 12, currentScore: 80, score90DaysAgo: 70, trend: 'improving' },
      });
      render(
        <RiskBreakdown
          breakdown={breakdown}
          riskLevel="medium"
          complianceScore={80}
          showDetails
        />
      );
      expect(screen.getByText('Trend: improving')).toBeInTheDocument();
    });

    it('should show legend when showDetails is true', () => {
      const breakdown = createMockBreakdown();
      render(
        <RiskBreakdown
          breakdown={breakdown}
          riskLevel="medium"
          complianceScore={80}
          showDetails
        />
      );
      expect(screen.getByText('Risk Level Thresholds')).toBeInTheDocument();
      expect(screen.getByText('90-100: LOW')).toBeInTheDocument();
      expect(screen.getByText('0-49: CRITICAL')).toBeInTheDocument();
    });
  });

  describe('Override Alerts', () => {
    it('should show override alert when hasCriticalOverride is true', () => {
      const breakdown = createMockBreakdown({
        overrides: {
          hasCriticalOverride: true,
          expiredPolicyOverride: true,
          criticalIssueOverride: false,
          lowCoverageOverride: false,
        },
      });
      render(
        <RiskBreakdown
          breakdown={breakdown}
          riskLevel="critical"
          complianceScore={45}
        />
      );
      expect(screen.getByText('Override Active')).toBeInTheDocument();
      expect(screen.getByText('Policy expired more than 60 days')).toBeInTheDocument();
    });

    it('should show critical issue override', () => {
      const breakdown = createMockBreakdown({
        overrides: {
          hasCriticalOverride: true,
          expiredPolicyOverride: false,
          criticalIssueOverride: true,
          lowCoverageOverride: false,
        },
      });
      render(
        <RiskBreakdown
          breakdown={breakdown}
          riskLevel="critical"
          complianceScore={45}
        />
      );
      expect(screen.getByText('Critical issue open more than 14 days')).toBeInTheDocument();
    });

    it('should show low coverage override', () => {
      const breakdown = createMockBreakdown({
        overrides: {
          hasCriticalOverride: true,
          expiredPolicyOverride: false,
          criticalIssueOverride: false,
          lowCoverageOverride: true,
        },
      });
      render(
        <RiskBreakdown
          breakdown={breakdown}
          riskLevel="high"
          complianceScore={55}
        />
      );
      expect(screen.getByText('Coverage below 50%')).toBeInTheDocument();
    });

    it('should not show override alert when showOverrides is false', () => {
      const breakdown = createMockBreakdown({
        overrides: {
          hasCriticalOverride: true,
          expiredPolicyOverride: true,
          criticalIssueOverride: false,
          lowCoverageOverride: false,
        },
      });
      render(
        <RiskBreakdown
          breakdown={breakdown}
          riskLevel="critical"
          complianceScore={45}
          showOverrides={false}
        />
      );
      expect(screen.queryByText('Override Active')).not.toBeInTheDocument();
    });

    it('should not show override alert when no overrides are active', () => {
      const breakdown = createMockBreakdown(); // Default has no overrides
      render(
        <RiskBreakdown
          breakdown={breakdown}
          riskLevel="medium"
          complianceScore={80}
        />
      );
      expect(screen.queryByText('Override Active')).not.toBeInTheDocument();
    });
  });

  describe('Risk Level Badge', () => {
    it.each([
      ['low', 95],
      ['medium', 75],
      ['high', 55],
      ['critical', 35],
    ] as [RiskLevel, number][])('should render %s risk badge with score %d', (level, score) => {
      const breakdown = createMockBreakdown();
      render(
        <RiskBreakdown
          breakdown={breakdown}
          riskLevel={level}
          complianceScore={score}
        />
      );
      // RiskBadge is rendered with aria-label containing the level
      expect(screen.getByLabelText(new RegExp(`Risk level: ${level}`, 'i'))).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero requirements', () => {
      const breakdown = createMockBreakdown({
        coverage: { score: 100, weight: 0.4, weighted: 40, metRequirements: 0, totalRequirements: 0 },
      });
      render(
        <RiskBreakdown
          breakdown={breakdown}
          riskLevel="low"
          complianceScore={90}
          showDetails
        />
      );
      expect(screen.getByText('No requirements defined')).toBeInTheDocument();
    });

    it('should handle critical issues count', () => {
      const breakdown = createMockBreakdown({
        issues: {
          score: 40,
          weight: 0.2,
          weighted: 8,
          infoPenalty: 0,
          warningPenalty: 0,
          errorPenalty: 0,
          criticalCount: 2,
          anyCriticalOver14Days: true,
        },
      });
      render(
        <RiskBreakdown
          breakdown={breakdown}
          riskLevel="critical"
          complianceScore={45}
          showDetails
        />
      );
      expect(screen.getByText('2 critical issues open')).toBeInTheDocument();
    });
  });
});

describe('RiskSummary Component', () => {
  describe('Basic Rendering', () => {
    it('should render compliance score label', () => {
      const breakdown = createMockBreakdown();
      render(
        <RiskSummary
          breakdown={breakdown}
          riskLevel="medium"
          complianceScore={80}
        />
      );
      expect(screen.getByText('Compliance Score')).toBeInTheDocument();
    });

    it('should render risk badge', () => {
      const breakdown = createMockBreakdown();
      render(
        <RiskSummary
          breakdown={breakdown}
          riskLevel="high"
          complianceScore={60}
        />
      );
      // RiskBadge is rendered with aria-label containing the level
      expect(screen.getByLabelText(/Risk level: high/i)).toBeInTheDocument();
    });
  });

  describe('Component Summaries', () => {
    it('should display coverage percentage', () => {
      const breakdown = createMockBreakdown({
        coverage: { score: 85, weight: 0.4, weighted: 34, metRequirements: 4, totalRequirements: 5 },
      });
      render(
        <RiskSummary
          breakdown={breakdown}
          riskLevel="medium"
          complianceScore={80}
        />
      );
      expect(screen.getByText('Coverage: 85%')).toBeInTheDocument();
    });

    it('should display policy percentage', () => {
      const breakdown = createMockBreakdown({
        policy: { score: 75, weight: 0.25, weighted: 19, penalty: 25, anyExpiredOver60: false },
      });
      render(
        <RiskSummary
          breakdown={breakdown}
          riskLevel="medium"
          complianceScore={80}
        />
      );
      expect(screen.getByText('Policy: 75%')).toBeInTheDocument();
    });

    it('should display issues percentage', () => {
      const breakdown = createMockBreakdown({
        issues: {
          score: 90,
          weight: 0.2,
          weighted: 18,
          infoPenalty: 4,
          warningPenalty: 6,
          errorPenalty: 0,
          criticalCount: 0,
          anyCriticalOver14Days: false,
        },
      });
      render(
        <RiskSummary
          breakdown={breakdown}
          riskLevel="medium"
          complianceScore={80}
        />
      );
      expect(screen.getByText('Issues: 90%')).toBeInTheDocument();
    });

    it('should display trend', () => {
      const breakdown = createMockBreakdown({
        history: { score: 100, weight: 0.15, weighted: 15, currentScore: 90, score90DaysAgo: 70, trend: 'improving' },
      });
      render(
        <RiskSummary
          breakdown={breakdown}
          riskLevel="low"
          complianceScore={92}
        />
      );
      expect(screen.getByText('Trend: improving')).toBeInTheDocument();
    });
  });

  describe('All Trend Types', () => {
    it.each(['improving', 'stable', 'declining', 'new'] as const)(
      'should display %s trend',
      (trend) => {
        const breakdown = createMockBreakdown({
          history: { score: 80, weight: 0.15, weighted: 12, currentScore: 80, score90DaysAgo: null, trend },
        });
        render(
          <RiskSummary
            breakdown={breakdown}
            riskLevel="medium"
            complianceScore={80}
          />
        );
        expect(screen.getByText(`Trend: ${trend}`)).toBeInTheDocument();
      }
    );
  });
});
