/**
 * Task Auto-Generation from Compliance Gaps
 * Task templates for each gap type
 */

import { GapType, ComplianceGap } from '../compliance/evaluator/types';
import { TaskTemplate, DEFAULT_PRIORITY_MAPPING, DEFAULT_DUE_DATE_DAYS, TASK_TYPES } from './types';

/**
 * Format currency amount
 */
function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US');
}

/**
 * Format coverage type for display
 */
function formatCoverageType(coverageType: string): string {
  return coverageType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format endorsement name for display
 */
function formatEndorsement(endorsement: string): string {
  return endorsement
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Missing Coverage Template
 */
const MISSING_COVERAGE_TEMPLATE: TaskTemplate = {
  gap_type: GapType.MISSING_COVERAGE,
  task_type: TASK_TYPES.COI_UPLOAD,
  priority_mapping: DEFAULT_PRIORITY_MAPPING,
  due_date_days: DEFAULT_DUE_DATE_DAYS,
  title_template: (gap: ComplianceGap) => {
    const coverageType = gap.coverage_type ? formatCoverageType(gap.coverage_type) : 'Required Coverage';
    return `Upload ${coverageType} Certificate of Insurance`;
  },
  description_template: (gap: ComplianceGap) => {
    const coverageType = gap.coverage_type ? formatCoverageType(gap.coverage_type) : 'required coverage';

    return `## Missing Coverage

Your project requires ${coverageType} insurance, which is currently missing from your certificate of insurance.

### Required Action:
1. Contact your insurance broker or agent
2. Obtain a valid ${coverageType} certificate of insurance
3. Upload the certificate to ForSured platform

### Remediation:
${gap.remediation}

### Additional Information:
- Required: ${gap.required_value}
- Gap ID: ${gap.id}

Please complete this task as soon as possible to maintain project compliance.`;
  }
};

/**
 * Missing Endorsement Template
 */
const MISSING_ENDORSEMENT_TEMPLATE: TaskTemplate = {
  gap_type: GapType.MISSING_ENDORSEMENT,
  task_type: TASK_TYPES.ENDORSEMENT_CORRECTION,
  priority_mapping: DEFAULT_PRIORITY_MAPPING,
  due_date_days: DEFAULT_DUE_DATE_DAYS,
  title_template: (gap: ComplianceGap) => {
    const endorsement = gap.endorsement ? formatEndorsement(gap.endorsement) : 'Required Endorsement';
    return `Add ${endorsement} Endorsement`;
  },
  description_template: (gap: ComplianceGap) => {
    const endorsement = gap.endorsement ? formatEndorsement(gap.endorsement) : 'required endorsement';

    return `## Missing Endorsement

Your policy is missing the ${endorsement} endorsement required for this project.

### Required Action:
1. Contact your insurance broker or agent
2. Request addition of ${endorsement} endorsement
3. Upload updated certificate of insurance showing the endorsement

### Remediation:
${gap.remediation}

### Additional Information:
- Required Endorsement: ${gap.required_value}
- Gap ID: ${gap.id}

Endorsements are critical compliance items. Please address this promptly.`;
  }
};

/**
 * Insufficient Coverage Amount Template
 */
const INSUFFICIENT_AMOUNT_TEMPLATE: TaskTemplate = {
  gap_type: GapType.INSUFFICIENT_AMOUNT,
  task_type: TASK_TYPES.COVERAGE_INCREASE,
  priority_mapping: DEFAULT_PRIORITY_MAPPING,
  due_date_days: DEFAULT_DUE_DATE_DAYS,
  title_template: (gap: ComplianceGap) => {
    const coverageType = gap.coverage_type ? formatCoverageType(gap.coverage_type) : 'Coverage';
    return `Increase ${coverageType} Coverage Limits`;
  },
  description_template: (gap: ComplianceGap) => {
    const coverageType = gap.coverage_type ? formatCoverageType(gap.coverage_type) : 'coverage';
    const currentValue = typeof gap.current_value === 'number' ? `$${formatCurrency(gap.current_value)}` : gap.current_value || 'Not specified';
    const requiredValue = typeof gap.required_value === 'number' ? `$${formatCurrency(gap.required_value)}` : gap.required_value;

    return `## Insufficient Coverage Limits

Your current ${coverageType} coverage limits are insufficient for this project's requirements.

### Current vs. Required:
- **Current Limit:** ${currentValue}
- **Required Limit:** ${requiredValue}

### Required Action:
1. Contact your insurance broker or agent
2. Request increase in coverage limits to meet project requirements
3. Upload updated certificate of insurance showing increased limits

### Remediation:
${gap.remediation}

### Additional Information:
- Gap ID: ${gap.id}

Increasing coverage limits may require policy endorsement or new policy issuance.`;
  }
};

/**
 * Expired Policy Template
 */
const EXPIRED_POLICY_TEMPLATE: TaskTemplate = {
  gap_type: GapType.EXPIRED_POLICY,
  task_type: TASK_TYPES.POLICY_RENEWAL,
  priority_mapping: DEFAULT_PRIORITY_MAPPING,
  due_date_days: DEFAULT_DUE_DATE_DAYS,
  title_template: (gap: ComplianceGap) => {
    const coverageType = gap.coverage_type ? formatCoverageType(gap.coverage_type) : 'Insurance';
    return `Renew Expired ${coverageType} Policy`;
  },
  description_template: (gap: ComplianceGap) => {
    const coverageType = gap.coverage_type ? formatCoverageType(gap.coverage_type) : 'insurance';
    const expirationDate = gap.current_value || 'unknown date';

    return `## Expired Policy - Urgent Action Required

Your ${coverageType} policy has expired and is no longer valid.

### Policy Information:
- **Expiration Date:** ${expirationDate}
- **Status:** EXPIRED

### Required Action (URGENT):
1. Contact your insurance broker or agent immediately
2. Renew or replace the expired policy
3. Ensure policy coverage extends through the project end date
4. Upload new certificate of insurance immediately

### Remediation:
${gap.remediation}

### Additional Information:
- Required: ${gap.required_value}
- Gap ID: ${gap.id}

⚠️ **WARNING:** Expired policies represent critical compliance violations. Project work may need to be suspended until valid coverage is provided.`;
  }
};

/**
 * Expiring Soon Policy Template
 */
const EXPIRING_SOON_TEMPLATE: TaskTemplate = {
  gap_type: GapType.EXPIRING_SOON,
  task_type: TASK_TYPES.POLICY_EXTENSION,
  priority_mapping: DEFAULT_PRIORITY_MAPPING,
  due_date_days: DEFAULT_DUE_DATE_DAYS,
  title_template: (gap: ComplianceGap) => {
    const coverageType = gap.coverage_type ? formatCoverageType(gap.coverage_type) : 'Insurance';
    return `Renew Policy Expiring Soon - ${coverageType}`;
  },
  description_template: (gap: ComplianceGap) => {
    const coverageType = gap.coverage_type ? formatCoverageType(gap.coverage_type) : 'insurance';
    const expirationDate = gap.current_value || 'unknown date';

    return `## Policy Expiring Soon

Your ${coverageType} policy is expiring within 30 days and needs to be renewed to maintain project compliance.

### Policy Information:
- **Expiration Date:** ${expirationDate}
- **Status:** Expiring Soon (within 30 days)

### Required Action:
1. Contact your insurance broker or agent
2. Renew or extend the policy before expiration
3. Ensure new policy coverage extends through the project end date
4. Upload new certificate of insurance

### Remediation:
${gap.remediation}

### Additional Information:
- Required: ${gap.required_value}
- Gap ID: ${gap.id}

Acting now prevents compliance violations and project disruptions.`;
  }
};

/**
 * Template Registry
 */
const TEMPLATE_REGISTRY: Map<GapType, TaskTemplate> = new Map([
  [GapType.MISSING_COVERAGE, MISSING_COVERAGE_TEMPLATE],
  [GapType.MISSING_ENDORSEMENT, MISSING_ENDORSEMENT_TEMPLATE],
  [GapType.INSUFFICIENT_AMOUNT, INSUFFICIENT_AMOUNT_TEMPLATE],
  [GapType.EXPIRED_POLICY, EXPIRED_POLICY_TEMPLATE],
  [GapType.EXPIRING_SOON, EXPIRING_SOON_TEMPLATE]
]);

/**
 * Task Templates Service
 */
export class TaskTemplates {
  /**
   * Get template for specific gap type
   */
  static getTemplate(gapType: GapType): TaskTemplate {
    const template = TEMPLATE_REGISTRY.get(gapType);

    if (!template) {
      throw new Error(`No task template found for gap type: ${gapType}`);
    }

    return template;
  }

  /**
   * Get all templates
   */
  static getAllTemplates(): TaskTemplate[] {
    return Array.from(TEMPLATE_REGISTRY.values());
  }

  /**
   * Check if template exists for gap type
   */
  static hasTemplate(gapType: GapType): boolean {
    return TEMPLATE_REGISTRY.has(gapType);
  }
}
