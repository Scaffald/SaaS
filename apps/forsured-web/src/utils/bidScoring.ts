import { BidProposal, Project, CoverageGap } from '../types';

export interface BidScoreBreakdown {
  insuranceCoverage: number;
  documentCompleteness: number;
  carrierRatings: number;
  pastPerformance: number;
  responseTimeliness: number;
  overallScore: number;
  coverageGaps: CoverageGap[];
  riskAssessment: string;
}

/**
 * Mock AI scoring function for bid proposals
 * Calculates compliance score based on multiple factors
 */
export function mockCalculateComplianceScore(
  bid: BidProposal,
  project: Project
): BidScoreBreakdown {
  let score = 0;
  const gaps: CoverageGap[] = [];

  // Insurance coverage adequacy (40 points)
  const coverageScore = mockEvaluateCoverage(bid, project, gaps);
  score += coverageScore * 0.4;

  // Document completeness (20 points)
  const requiredDocs = ['coi', 'endorsement', 'proposal'];
  const submittedDocs = bid.documents.map((d) => d.type.toLowerCase());
  const completeness =
    requiredDocs.filter((d) =>
      submittedDocs.some((sd) => sd.includes(d) || d.includes(sd))
    ).length / requiredDocs.length;
  score += completeness * 20;

  // Carrier ratings (15 points) - mocked
  const carrierScore = Math.random() * 15;
  score += carrierScore;

  // Past performance (15 points) - mocked
  const performanceScore = Math.random() * 15;
  score += performanceScore;

  // Response timeliness (10 points)
  const daysToRespond = calculateDaysToRespond(
    bid.submitted_at,
    project.created_at
  );
  const timelinessScore = Math.max(0, 10 - daysToRespond * 0.5);
  score += timelinessScore;

  // Generate risk assessment
  const riskAssessment = generateRiskAssessment(score, gaps);

  return {
    insuranceCoverage: Math.round(coverageScore),
    documentCompleteness: Math.round(completeness * 20),
    carrierRatings: Math.round(carrierScore),
    pastPerformance: Math.round(performanceScore),
    responseTimeliness: Math.round(timelinessScore),
    overallScore: Math.round(score),
    coverageGaps: gaps,
    riskAssessment,
  };
}

function mockEvaluateCoverage(
  bid: BidProposal,
  project: Project,
  gaps: CoverageGap[]
): number {
  let coverageScore = 100;

  // Check General Liability
  if (project.general_liability_required) {
    const hasGL = Math.random() > 0.3; // 70% chance of having GL
    if (!hasGL) {
      gaps.push({
        type: 'General Liability',
        required: project.general_liability_required,
        actual: 0,
        status: 'insufficient',
      });
      coverageScore -= 20;
    } else {
      const glAmount =
        project.general_liability_required * (0.8 + Math.random() * 0.4);
      if (glAmount < project.general_liability_required) {
        gaps.push({
          type: 'General Liability',
          required: project.general_liability_required,
          actual: glAmount,
          status: 'insufficient',
        });
        coverageScore -= 10;
      }
    }
  }

  // Check Workers Comp
  if (project.workers_comp_required) {
    const hasWC = Math.random() > 0.2; // 80% chance of having WC
    if (!hasWC) {
      gaps.push({
        type: 'Workers Compensation',
        required: project.workers_comp_required,
        actual: 0,
        status: 'insufficient',
      });
      coverageScore -= 15;
    }
  }

  // Check Auto Liability
  if (project.auto_liability_required) {
    const hasAuto = Math.random() > 0.4; // 60% chance of having Auto
    if (!hasAuto) {
      gaps.push({
        type: 'Auto Liability',
        required: project.auto_liability_required,
        actual: 0,
        status: 'insufficient',
      });
      coverageScore -= 15;
    }
  }

  // Check Umbrella
  if (project.umbrella_required) {
    const hasUmbrella = Math.random() > 0.5; // 50% chance of having Umbrella
    if (!hasUmbrella) {
      gaps.push({
        type: 'Umbrella/Excess',
        required: project.umbrella_required,
        actual: 0,
        status: 'insufficient',
      });
      coverageScore -= 10;
    }
  }

  return Math.max(0, Math.min(100, coverageScore));
}

function calculateDaysToRespond(
  submittedAt: string,
  rfpSentAt?: string
): number {
  if (!rfpSentAt) return 0;
  const submitted = new Date(submittedAt);
  const sent = new Date(rfpSentAt);
  const diffTime = submitted.getTime() - sent.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function generateRiskAssessment(score: number, gaps: CoverageGap[]): string {
  if (score >= 90) {
    return 'Low risk. Strong compliance profile with adequate coverage and documentation.';
  } else if (score >= 70) {
    return 'Moderate risk. Generally compliant but some gaps in coverage or documentation may require attention.';
  } else if (score >= 50) {
    return 'Elevated risk. Significant gaps in coverage or documentation. Review required before award.';
  } else {
    return 'High risk. Major compliance issues identified. Not recommended for award without significant improvements.';
  }
}
