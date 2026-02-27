/**
 * Risk Calculation Service
 *
 * TypeScript service for calculating and managing subcontractor compliance risk.
 * Uses PostgreSQL functions for accurate, multi-factor risk assessment.
 *
 * REQ: Phase 5 - Risk Level Algorithm Implementation
 *
 * Risk Levels:
 *   LOW (90-100): Fully compliant - routine monitoring only
 *   MEDIUM (70-89): Minor gaps - review within 30 days
 *   HIGH (50-69): Significant gaps - immediate attention required
 *   CRITICAL (0-49): Major violations - suspend or escalate
 */

import { supabase } from '../supabase';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskBreakdown {
  coverage: {
    score: number;
    weight: number;
    weighted: number;
    metRequirements: number;
    totalRequirements: number;
  };
  policy: {
    score: number;
    weight: number;
    weighted: number;
    penalty: number;
    anyExpiredOver60: boolean;
  };
  issues: {
    score: number;
    weight: number;
    weighted: number;
    infoPenalty: number;
    warningPenalty: number;
    errorPenalty: number;
    criticalCount: number;
    anyCriticalOver14Days: boolean;
  };
  history: {
    score: number;
    weight: number;
    weighted: number;
    currentScore: number | null;
    score90DaysAgo: number | null;
    trend: 'improving' | 'stable' | 'declining' | 'new';
  };
  overrides: {
    hasCriticalOverride: boolean;
    expiredPolicyOverride: boolean;
    criticalIssueOverride: boolean;
    lowCoverageOverride: boolean;
  };
}

export interface RiskCalculationResult {
  complianceScore: number;
  riskLevel: RiskLevel;
  coverageScore: number;
  policyScore: number;
  issueScore: number;
  historyScore: number;
  breakdown: RiskBreakdown;
}

export interface BatchRiskResult {
  subcontractorId: string;
  subcontractorName: string;
  complianceScore: number;
  riskLevel: RiskLevel;
}

export class RiskCalculationService {
  /**
   * Calculate risk for a subcontractor on a specific project
   * Uses PostgreSQL function for accurate calculation
   */
  async calculateRisk(
    subcontractorId: string,
    projectId: string
  ): Promise<RiskCalculationResult> {
    const { data, error } = await supabase.rpc('calculate_subcontractor_risk', {
      p_subcontractor_id: subcontractorId,
      p_project_id: projectId,
    });

    if (error) throw error;

    const result = Array.isArray(data) ? data[0] : data;
    if (!result) {
      throw new Error('No risk calculation result returned');
    }

    return {
      complianceScore: result.compliance_score,
      riskLevel: result.risk_level as RiskLevel,
      coverageScore: result.coverage_score,
      policyScore: result.policy_score,
      issueScore: result.issue_score,
      historyScore: result.history_score,
      breakdown: this.parseBreakdown(result.breakdown),
    };
  }

  /**
   * Calculate risk for all subcontractors on a project
   */
  async calculateAllRisks(projectId: string): Promise<BatchRiskResult[]> {
    const { data, error } = await supabase.rpc(
      'calculate_all_subcontractor_risks',
      { p_project_id: projectId }
    );

    if (error) throw error;

    return (data || []).map((row: Record<string, unknown>) => ({
      subcontractorId: row.subcontractor_id as string,
      subcontractorName: row.subcontractor_name as string,
      complianceScore: row.compliance_score as number,
      riskLevel: row.risk_level as RiskLevel,
    }));
  }

  /**
   * Update stored compliance score for a subcontractor
   */
  async updateComplianceScore(
    subcontractorId: string,
    projectId: string
  ): Promise<void> {
    const { error } = await supabase.rpc('update_compliance_score', {
      p_subcontractor_id: subcontractorId,
      p_project_id: projectId,
    });

    if (error) throw error;
  }

  /**
   * Get risk level from score (client-side calculation)
   * Useful for display purposes without DB call
   */
  getRiskLevel(score: number): RiskLevel {
    if (score >= 90) return 'low';
    if (score >= 70) return 'medium';
    if (score >= 50) return 'high';
    return 'critical';
  }

  /**
   * Get risk level color for UI (theme tokens)
   */
  getRiskColor(level: RiskLevel): string {
    const colors: Record<RiskLevel, string> = {
      low: '$green10',
      medium: '$yellow10',
      high: '$orange10',
      critical: '$red10',
    };
    return colors[level];
  }

  /**
   * Get risk level background color for UI (theme tokens)
   */
  getRiskBackgroundColor(level: RiskLevel): string {
    const colors: Record<RiskLevel, string> = {
      low: '$green3',
      medium: '$yellow3',
      high: '$orange3',
      critical: '$red3',
    };
    return colors[level];
  }

  /**
   * Get risk level badge variant for UI
   */
  getRiskBadgeVariant(
    level: RiskLevel
  ): 'success' | 'warning' | 'error' | 'destructive' {
    const variants: Record<
      RiskLevel,
      'success' | 'warning' | 'error' | 'destructive'
    > = {
      low: 'success',
      medium: 'warning',
      high: 'error',
      critical: 'destructive',
    };
    return variants[level];
  }

  /**
   * Get human-readable risk description
   */
  getRiskDescription(level: RiskLevel): string {
    const descriptions: Record<RiskLevel, string> = {
      low: 'Fully compliant - routine monitoring only',
      medium: 'Minor gaps - review within 30 days',
      high: 'Significant gaps - immediate attention required',
      critical: 'Major violations - suspend or escalate',
    };
    return descriptions[level];
  }

  /**
   * Get recommended action for a risk level
   */
  getRecommendedAction(level: RiskLevel): string {
    const actions: Record<RiskLevel, string> = {
      low: 'Continue routine monitoring',
      medium: 'Schedule compliance review within 30 days',
      high: 'Immediate attention required - address gaps',
      critical: 'Suspend work or escalate to management',
    };
    return actions[level];
  }

  /**
   * Get risk level icon name (for icon libraries)
   */
  getRiskIcon(level: RiskLevel): string {
    const icons: Record<RiskLevel, string> = {
      low: 'check-circle',
      medium: 'alert-circle',
      high: 'alert-triangle',
      critical: 'x-circle',
    };
    return icons[level];
  }

  /**
   * Parse breakdown from PostgreSQL JSON to TypeScript interface
   */
  private parseBreakdown(breakdown: Record<string, unknown>): RiskBreakdown {
    const coverage = breakdown.coverage as Record<string, unknown> || {};
    const policy = breakdown.policy as Record<string, unknown> || {};
    const issues = breakdown.issues as Record<string, unknown> || {};
    const history = breakdown.history as Record<string, unknown> || {};
    const overrides = breakdown.overrides as Record<string, unknown> || {};

    return {
      coverage: {
        score: (coverage.score as number) || 0,
        weight: (coverage.weight as number) || 0.4,
        weighted: (coverage.weighted as number) || 0,
        metRequirements: (coverage.met_requirements as number) || 0,
        totalRequirements: (coverage.total_requirements as number) || 0,
      },
      policy: {
        score: (policy.score as number) || 0,
        weight: (policy.weight as number) || 0.25,
        weighted: (policy.weighted as number) || 0,
        penalty: (policy.penalty as number) || 0,
        anyExpiredOver60: (policy.any_expired_over_60 as boolean) || false,
      },
      issues: {
        score: (issues.score as number) || 0,
        weight: (issues.weight as number) || 0.2,
        weighted: (issues.weighted as number) || 0,
        infoPenalty: (issues.info_penalty as number) || 0,
        warningPenalty: (issues.warning_penalty as number) || 0,
        errorPenalty: (issues.error_penalty as number) || 0,
        criticalCount: (issues.critical_count as number) || 0,
        anyCriticalOver14Days:
          (issues.any_critical_over_14_days as boolean) || false,
      },
      history: {
        score: (history.score as number) || 0,
        weight: (history.weight as number) || 0.15,
        weighted: (history.weighted as number) || 0,
        currentScore: (history.current_score as number | null) ?? null,
        score90DaysAgo: (history.score_90_days_ago as number | null) ?? null,
        trend: (history.trend as 'improving' | 'stable' | 'declining' | 'new') || 'new',
      },
      overrides: {
        hasCriticalOverride: (overrides.has_critical_override as boolean) || false,
        expiredPolicyOverride:
          (overrides.expired_policy_override as boolean) || false,
        criticalIssueOverride:
          (overrides.critical_issue_override as boolean) || false,
        lowCoverageOverride:
          (overrides.low_coverage_override as boolean) || false,
      },
    };
  }
}

// Singleton export
export const riskCalculationService = new RiskCalculationService();
