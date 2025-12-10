/**
 * REQ-269: Policy & Endorsement Level Flags
 * Flag-based compliance checker that evaluates flags at policy, provision, and endorsement levels
 */

import {
  ComplianceFlag,
  FlaggableEntityType,
  InsurancePolicy,
  PolicyProvision,
  PolicyEndorsement,
  FlagSeverity,
} from '../../../types';
import { GapSeverity } from './types';

/**
 * Flag compliance issue with location metadata
 */
export interface FlagComplianceIssue {
  flagId: string;
  entityType: FlaggableEntityType;
  entityId: string;
  flagType: string;
  severity: FlagSeverity;
  title: string;
  description?: string;
  location: 'Policy Flag' | 'Provision Flag' | 'Endorsement Flag';
  // Optional entity details for display
  entityDetails?: {
    policyNumber?: string;
    policyType?: string;
    provisionType?: string;
    endorsementType?: string;
  };
}

/**
 * Aggregated compliance report with flags grouped by level
 */
export interface FlagComplianceReport {
  policyId: string;
  policyFlags: FlagComplianceIssue[];
  provisionFlags: FlagComplianceIssue[];
  endorsementFlags: FlagComplianceIssue[];
  summary: {
    totalFlags: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    byLevel: {
      policy: number;
      provision: number;
      endorsement: number;
    };
  };
}

/**
 * Filter options for compliance issues
 */
export interface FlagFilterOptions {
  entityType?: FlaggableEntityType;
  severity?: FlagSeverity;
}

/**
 * Convert flag severity to gap severity for scoring integration
 */
export function flagSeverityToGapSeverity(severity: FlagSeverity): GapSeverity {
  switch (severity) {
    case 'critical':
      return GapSeverity.CRITICAL;
    case 'warning':
      return GapSeverity.WARNING;
    case 'info':
      return GapSeverity.INFO;
    default:
      return GapSeverity.WARNING;
  }
}

/**
 * Get location label from entity type
 */
export function getLocationLabel(
  entityType: FlaggableEntityType
): 'Policy Flag' | 'Provision Flag' | 'Endorsement Flag' {
  switch (entityType) {
    case 'policy':
      return 'Policy Flag';
    case 'provision':
      return 'Provision Flag';
    case 'endorsement':
      return 'Endorsement Flag';
  }
}

/**
 * Convert a ComplianceFlag to a FlagComplianceIssue
 */
export function flagToComplianceIssue(
  flag: ComplianceFlag,
  entityDetails?: FlagComplianceIssue['entityDetails']
): FlagComplianceIssue {
  return {
    flagId: flag.id,
    entityType: flag.entity_type,
    entityId: flag.entity_id,
    flagType: flag.flag_type,
    severity: flag.severity,
    title: flag.title,
    description: flag.description,
    location: getLocationLabel(flag.entity_type),
    entityDetails,
  };
}

/**
 * Flag compliance checker class
 * Checks compliance flags at policy, provision, and endorsement levels
 */
export class FlagComplianceChecker {
  /**
   * Check policy-level flags for a given policy
   *
   * @param policyId The policy ID to check
   * @param allFlags All active flags (pre-filtered by status='active')
   * @param policy Optional policy object for entity details
   * @returns Array of policy-level compliance issues
   */
  checkPolicyFlags(
    policyId: string,
    allFlags: ComplianceFlag[],
    policy?: InsurancePolicy
  ): FlagComplianceIssue[] {
    const policyFlags = allFlags.filter(
      (flag) => flag.entity_type === 'policy' && flag.entity_id === policyId
    );

    return policyFlags.map((flag) =>
      flagToComplianceIssue(flag, {
        policyNumber: policy?.policy_number,
        policyType: policy?.policy_type,
      })
    );
  }

  /**
   * Check provision-level flags for all provisions of a policy
   *
   * @param provisions The provisions to check
   * @param allFlags All active flags
   * @returns Array of provision-level compliance issues
   */
  checkProvisionFlags(
    provisions: PolicyProvision[],
    allFlags: ComplianceFlag[]
  ): FlagComplianceIssue[] {
    if (!provisions || provisions.length === 0) {
      return [];
    }

    const provisionIds = new Set(provisions.map((p) => p.id));
    const provisionFlags = allFlags.filter(
      (flag) => flag.entity_type === 'provision' && provisionIds.has(flag.entity_id)
    );

    return provisionFlags.map((flag) => {
      const provision = provisions.find((p) => p.id === flag.entity_id);
      return flagToComplianceIssue(flag, {
        provisionType: provision?.provision_type,
      });
    });
  }

  /**
   * Check endorsement-level flags for all endorsements on a policy
   *
   * @param endorsements The endorsements to check
   * @param allFlags All active flags
   * @returns Array of endorsement-level compliance issues
   */
  checkEndorsementFlags(
    endorsements: PolicyEndorsement[],
    allFlags: ComplianceFlag[]
  ): FlagComplianceIssue[] {
    if (!endorsements || endorsements.length === 0) {
      return [];
    }

    const endorsementIds = new Set(endorsements.map((e) => e.id));
    const endorsementFlags = allFlags.filter(
      (flag) =>
        flag.entity_type === 'endorsement' && endorsementIds.has(flag.entity_id)
    );

    return endorsementFlags.map((flag) => {
      const endorsement = endorsements.find((e) => e.id === flag.entity_id);
      return flagToComplianceIssue(flag, {
        endorsementType: endorsement?.endorsement_type,
      });
    });
  }

  /**
   * Aggregate compliance report combining all flag levels
   *
   * @param policyId The policy ID
   * @param allFlags All active flags
   * @param policy Optional policy object with provisions and endorsements
   * @returns Aggregated compliance report
   */
  aggregateComplianceReport(
    policyId: string,
    allFlags: ComplianceFlag[],
    policy?: InsurancePolicy
  ): FlagComplianceReport {
    // Get flags at each level
    const policyFlags = this.checkPolicyFlags(policyId, allFlags, policy);
    const provisionFlags = this.checkProvisionFlags(
      policy?.provisions || [],
      allFlags
    );
    const endorsementFlags = this.checkEndorsementFlags(
      policy?.endorsements || [],
      allFlags
    );

    // Calculate summary
    const allIssues = [...policyFlags, ...provisionFlags, ...endorsementFlags];

    return {
      policyId,
      policyFlags,
      provisionFlags,
      endorsementFlags,
      summary: {
        totalFlags: allIssues.length,
        criticalCount: allIssues.filter((i) => i.severity === 'critical').length,
        warningCount: allIssues.filter((i) => i.severity === 'warning').length,
        infoCount: allIssues.filter((i) => i.severity === 'info').length,
        byLevel: {
          policy: policyFlags.length,
          provision: provisionFlags.length,
          endorsement: endorsementFlags.length,
        },
      },
    };
  }

  /**
   * Filter compliance issues based on criteria
   *
   * @param report The compliance report to filter
   * @param options Filter options
   * @returns Filtered array of compliance issues
   */
  filterComplianceIssues(
    report: FlagComplianceReport,
    options: FlagFilterOptions
  ): FlagComplianceIssue[] {
    let allIssues: FlagComplianceIssue[] = [];

    // Start with issues from the requested entity type(s)
    if (!options.entityType) {
      // No entity type filter - include all
      allIssues = [
        ...report.policyFlags,
        ...report.provisionFlags,
        ...report.endorsementFlags,
      ];
    } else {
      switch (options.entityType) {
        case 'policy':
          allIssues = [...report.policyFlags];
          break;
        case 'provision':
          allIssues = [...report.provisionFlags];
          break;
        case 'endorsement':
          allIssues = [...report.endorsementFlags];
          break;
      }
    }

    // Apply severity filter if specified
    if (options.severity) {
      allIssues = allIssues.filter((issue) => issue.severity === options.severity);
    }

    return allIssues;
  }

  /**
   * Get all compliance issues from a report as a flat array
   *
   * @param report The compliance report
   * @returns Flat array of all compliance issues
   */
  getAllIssues(report: FlagComplianceReport): FlagComplianceIssue[] {
    return [
      ...report.policyFlags,
      ...report.provisionFlags,
      ...report.endorsementFlags,
    ];
  }
}

/**
 * Create a new flag compliance checker instance
 */
export function createFlagComplianceChecker(): FlagComplianceChecker {
  return new FlagComplianceChecker();
}
