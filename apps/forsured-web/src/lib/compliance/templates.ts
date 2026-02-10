/**
 * Compliance Requirements Management System
 * Predefined templates for common insurance types
 */

import {
  CoverageType,
  RequirementStatus,
  RequirementDefinition,
  CreateComplianceRequirementInput
} from './types';

/**
 * Template for General Liability - $1M/$2M
 */
export function getGeneralLiabilityTemplate1M2M(
  organizationId: string,
  createdBy: string
): CreateComplianceRequirementInput {
  const definition: RequirementDefinition = {
    coverage_limits: {
      per_occurrence: 1000000,
      aggregate: 2000000
    },
    required_endorsements: [
      {
        endorsement_type: 'Additional Insured',
        description: 'General contractor and project owner must be named as additional insureds'
      },
      {
        endorsement_type: 'Waiver of Subrogation',
        description: 'Waiver of subrogation in favor of general contractor and project owner'
      },
      {
        endorsement_type: 'Primary and Non-Contributory',
        description: 'Coverage must be primary and non-contributory to any other insurance'
      }
    ],
    policy_conditions: [
      {
        condition_type: '30-Day Notice of Cancellation',
        description: 'Insurer must provide 30 days written notice of cancellation or non-renewal'
      },
      {
        condition_type: 'Claims Made or Occurrence',
        description: 'Occurrence-based coverage preferred'
      }
    ],
    documentation_requirements: [
      {
        document_type: 'Certificate of Insurance',
        is_required: true
      },
      {
        document_type: 'Additional Insured Endorsement',
        is_required: true
      },
      {
        document_type: 'Policy Declarations',
        is_required: false
      }
    ]
  };

  return {
    name: 'General Liability - $1M/$2M',
    type: CoverageType.GENERAL_LIABILITY,
    description: 'Standard General Liability coverage with $1M per occurrence and $2M aggregate limits',
    status: RequirementStatus.ACTIVE,
    is_template: true,
    created_by: createdBy,
    organization_id: organizationId,
    requirement_definition: definition,
    effective_date: new Date().toISOString()
  };
}

/**
 * Template for General Liability - $2M/$4M
 */
export function getGeneralLiabilityTemplate2M4M(
  organizationId: string,
  createdBy: string
): CreateComplianceRequirementInput {
  const definition: RequirementDefinition = {
    coverage_limits: {
      per_occurrence: 2000000,
      aggregate: 4000000
    },
    required_endorsements: [
      {
        endorsement_type: 'Additional Insured',
        description: 'General contractor and project owner must be named as additional insureds'
      },
      {
        endorsement_type: 'Waiver of Subrogation',
        description: 'Waiver of subrogation in favor of general contractor and project owner'
      },
      {
        endorsement_type: 'Primary and Non-Contributory',
        description: 'Coverage must be primary and non-contributory to any other insurance'
      }
    ],
    policy_conditions: [
      {
        condition_type: '30-Day Notice of Cancellation',
        description: 'Insurer must provide 30 days written notice of cancellation or non-renewal'
      },
      {
        condition_type: 'Claims Made or Occurrence',
        description: 'Occurrence-based coverage preferred'
      }
    ],
    documentation_requirements: [
      {
        document_type: 'Certificate of Insurance',
        is_required: true
      },
      {
        document_type: 'Additional Insured Endorsement',
        is_required: true
      },
      {
        document_type: 'Policy Declarations',
        is_required: false
      }
    ]
  };

  return {
    name: 'General Liability - $2M/$4M',
    type: CoverageType.GENERAL_LIABILITY,
    description: 'Enhanced General Liability coverage with $2M per occurrence and $4M aggregate limits',
    status: RequirementStatus.ACTIVE,
    is_template: true,
    created_by: createdBy,
    organization_id: organizationId,
    requirement_definition: definition,
    effective_date: new Date().toISOString()
  };
}

/**
 * Template for Workers Compensation - Statutory
 */
export function getWorkersCompensationTemplate(
  organizationId: string,
  createdBy: string
): CreateComplianceRequirementInput {
  const definition: RequirementDefinition = {
    coverage_limits: {
      // Statutory limits vary by state
    },
    required_endorsements: [
      {
        endorsement_type: 'Waiver of Subrogation',
        description: 'Waiver of subrogation in favor of general contractor and project owner'
      }
    ],
    policy_conditions: [
      {
        condition_type: 'State Coverage',
        description: 'Coverage must meet or exceed statutory requirements for all states where work is performed'
      },
      {
        condition_type: 'All-States Coverage',
        description: 'Policy should include all-states endorsement if work spans multiple jurisdictions'
      },
      {
        condition_type: 'Employer\'s Liability',
        description: 'Employer\'s Liability limits of at least $1M per accident, $1M disease per employee, $1M disease aggregate'
      }
    ],
    documentation_requirements: [
      {
        document_type: 'Certificate of Insurance',
        is_required: true
      },
      {
        document_type: 'Experience Modification Rate (EMR) Letter',
        is_required: true
      },
      {
        document_type: 'Waiver of Subrogation Endorsement',
        is_required: true
      }
    ]
  };

  return {
    name: 'Workers Compensation - Statutory',
    type: CoverageType.WORKERS_COMP,
    description: 'Workers Compensation insurance meeting statutory requirements with waiver of subrogation',
    status: RequirementStatus.ACTIVE,
    is_template: true,
    created_by: createdBy,
    organization_id: organizationId,
    requirement_definition: definition,
    effective_date: new Date().toISOString()
  };
}

/**
 * Template for Auto Liability - $1M CSL
 */
export function getAutoLiabilityTemplate(
  organizationId: string,
  createdBy: string
): CreateComplianceRequirementInput {
  const definition: RequirementDefinition = {
    coverage_limits: {
      per_occurrence: 1000000
    },
    required_endorsements: [
      {
        endorsement_type: 'Additional Insured (Auto)',
        description: 'General contractor and project owner must be named as additional insureds for liability arising from auto operations'
      }
    ],
    policy_conditions: [
      {
        condition_type: 'Hired and Non-Owned Coverage',
        description: 'Policy must include coverage for hired and non-owned vehicles'
      },
      {
        condition_type: '30-Day Notice of Cancellation',
        description: 'Insurer must provide 30 days written notice of cancellation or non-renewal'
      },
      {
        condition_type: 'Commercial Auto',
        description: 'Coverage for all owned, hired, and non-owned vehicles used in business operations'
      }
    ],
    documentation_requirements: [
      {
        document_type: 'Certificate of Insurance',
        is_required: true
      },
      {
        document_type: 'Additional Insured Endorsement',
        is_required: false
      }
    ]
  };

  return {
    name: 'Auto Liability - $1M CSL',
    type: CoverageType.AUTO_LIABILITY,
    description: 'Commercial Auto Liability with $1M combined single limit including hired and non-owned coverage',
    status: RequirementStatus.ACTIVE,
    is_template: true,
    created_by: createdBy,
    organization_id: organizationId,
    requirement_definition: definition,
    effective_date: new Date().toISOString()
  };
}

/**
 * Template for Umbrella Liability - $5M
 */
export function getUmbrellaTemplate5M(
  organizationId: string,
  createdBy: string
): CreateComplianceRequirementInput {
  const definition: RequirementDefinition = {
    coverage_limits: {
      per_occurrence: 5000000,
      aggregate: 5000000
    },
    required_endorsements: [
      {
        endorsement_type: 'Additional Insured',
        description: 'General contractor and project owner must be named as additional insureds on umbrella policy'
      }
    ],
    policy_conditions: [
      {
        condition_type: 'Excess Over Underlying Policies',
        description: 'Umbrella must be excess over General Liability, Auto Liability, and Employer\'s Liability'
      },
      {
        condition_type: 'Follow Form',
        description: 'Umbrella should follow the form of underlying policies'
      },
      {
        condition_type: 'Drop Down Coverage',
        description: 'Umbrella should provide drop-down coverage if underlying policy limits are exhausted'
      }
    ],
    documentation_requirements: [
      {
        document_type: 'Certificate of Insurance',
        is_required: true
      },
      {
        document_type: 'Umbrella Policy Declarations',
        is_required: true
      },
      {
        document_type: 'Schedule of Underlying Insurance',
        is_required: false
      }
    ]
  };

  return {
    name: 'Umbrella Liability - $5M',
    type: CoverageType.UMBRELLA,
    description: 'Umbrella/Excess Liability with $5M limits excess over primary GL, Auto, and Employer\'s Liability',
    status: RequirementStatus.ACTIVE,
    is_template: true,
    created_by: createdBy,
    organization_id: organizationId,
    requirement_definition: definition,
    effective_date: new Date().toISOString()
  };
}

/**
 * Template for Umbrella Liability - $10M
 */
export function getUmbrellaTemplate10M(
  organizationId: string,
  createdBy: string
): CreateComplianceRequirementInput {
  const definition: RequirementDefinition = {
    coverage_limits: {
      per_occurrence: 10000000,
      aggregate: 10000000
    },
    required_endorsements: [
      {
        endorsement_type: 'Additional Insured',
        description: 'General contractor and project owner must be named as additional insureds on umbrella policy'
      }
    ],
    policy_conditions: [
      {
        condition_type: 'Excess Over Underlying Policies',
        description: 'Umbrella must be excess over General Liability, Auto Liability, and Employer\'s Liability'
      },
      {
        condition_type: 'Follow Form',
        description: 'Umbrella should follow the form of underlying policies'
      },
      {
        condition_type: 'Drop Down Coverage',
        description: 'Umbrella should provide drop-down coverage if underlying policy limits are exhausted'
      }
    ],
    documentation_requirements: [
      {
        document_type: 'Certificate of Insurance',
        is_required: true
      },
      {
        document_type: 'Umbrella Policy Declarations',
        is_required: true
      },
      {
        document_type: 'Schedule of Underlying Insurance',
        is_required: true
      }
    ]
  };

  return {
    name: 'Umbrella Liability - $10M',
    type: CoverageType.UMBRELLA,
    description: 'Umbrella/Excess Liability with $10M limits excess over primary GL, Auto, and Employer\'s Liability',
    status: RequirementStatus.ACTIVE,
    is_template: true,
    created_by: createdBy,
    organization_id: organizationId,
    requirement_definition: definition,
    effective_date: new Date().toISOString()
  };
}

/**
 * Get all default templates for an organization
 */
export function getAllDefaultTemplates(
  organizationId: string,
  createdBy: string
): CreateComplianceRequirementInput[] {
  return [
    getGeneralLiabilityTemplate1M2M(organizationId, createdBy),
    getGeneralLiabilityTemplate2M4M(organizationId, createdBy),
    getWorkersCompensationTemplate(organizationId, createdBy),
    getAutoLiabilityTemplate(organizationId, createdBy),
    getUmbrellaTemplate5M(organizationId, createdBy),
    getUmbrellaTemplate10M(organizationId, createdBy)
  ];
}
