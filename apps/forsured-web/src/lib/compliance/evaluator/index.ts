/**
 * REQ-128: Compliance Rule Evaluation Engine
 * Main exports for evaluation system
 */

// Main engine
export {
  ComplianceEvaluationEngine,
  createEvaluationEngine
} from './evaluationEngine';

// Types
export type {
  ComplianceStatus,
  GapType,
  GapSeverity,
  ExtractedPolicyData,
  PolicyCoverage,
  ComplianceGap,
  RuleApplication,
  EvaluationResult,
  EvaluationRequest,
  BatchEvaluationRequest,
  BatchEvaluationResult,
  EvaluationMetadata,
  ScoreDeductions,
  ScoreBoundaries
} from './types';

export {
  DEFAULT_SCORE_DEDUCTIONS,
  DEFAULT_SCORE_BOUNDARIES,
  GRACE_PERIOD_DAYS,
  RULE_ENGINE_VERSION
} from './types';

// Scoring functions
export {
  calculateComplianceScore,
  determineComplianceStatus,
  validateScoreInvariants,
  calculateTotalDeductions,
  groupGapsByType,
  groupGapsBySeverity
} from './scoringAlgorithm';

// Validation functions
export {
  validateCoverageAmounts,
  checkMissingCoverageTypes,
  checkInsufficientLimits,
  compareCoverageLimits
} from './coverageValidation';

export {
  validatePolicyDates,
  checkPolicyExpired,
  checkPolicyExpiringSoon,
  checkPolicyEffectiveDate,
  parseDateString
} from './dateValidation';

export {
  validateEndorsements,
  checkMissingEndorsements,
  matchEndorsementFuzzy,
  normalizeEndorsementName
} from './endorsementValidation';

// REQ-269: Flag compliance checking
export {
  FlagComplianceChecker,
  createFlagComplianceChecker,
  flagSeverityToGapSeverity,
  getLocationLabel,
  flagToComplianceIssue
} from './flagComplianceChecker';

export type {
  FlagComplianceIssue,
  FlagComplianceReport,
  FlagFilterOptions
} from './flagComplianceChecker';
