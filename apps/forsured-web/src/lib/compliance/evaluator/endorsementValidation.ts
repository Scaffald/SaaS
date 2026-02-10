/**
 * Compliance Rule Evaluation Engine
 * Endorsement verification logic
 */

import { v4 as uuidv4 } from 'uuid';
import { RequiredEndorsement } from '../types';
import {
  ComplianceGap,
  GapType,
  GapSeverity,
  DEFAULT_SCORE_DEDUCTIONS
} from './types';

/**
 * Common endorsement abbreviations mapping
 */
const ENDORSEMENT_ABBREVIATIONS: Record<string, string[]> = {
  additional_insured: ['ai', 'add\'l insured', 'addl insured'],
  waiver_of_subrogation: ['wos', 'waiver of sub', 'subrogation waiver'],
  primary_non_contributory: ['p&nc', 'pnc', 'primary & non-contributory'],
  '30_day_notice_cancellation': ['30dnc', '30 day notice']
};

/**
 * Endorsement keyword patterns for fuzzy matching
 */
const ENDORSEMENT_KEYWORDS: Record<string, string[]> = {
  additional_insured: ['additional', 'insured'],
  waiver_of_subrogation: ['waiver', 'subrogation'],
  primary_non_contributory: ['primary', 'contributory'],
  '30_day_notice_cancellation': ['30', 'day', 'notice']
};

/**
 * Normalize endorsement name for comparison
 *
 * @param name Endorsement name
 * @returns Normalized name
 */
export function normalizeEndorsementName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Check if policy endorsement matches required endorsement using fuzzy logic
 * Supports:
 * - Exact matches
 * - Common abbreviations
 * - Keyword matching
 * - Partial text matching
 *
 * @param requiredType Required endorsement type
 * @param policyEndorsements List of endorsements from policy
 * @returns True if match found
 */
export function matchEndorsementFuzzy(
  requiredType: string,
  policyEndorsements: string[]
): boolean {
  const requiredNormalized = normalizeEndorsementName(requiredType);

  for (const policyEndorsement of policyEndorsements) {
    const policyNormalized = normalizeEndorsementName(policyEndorsement);

    // Exact match
    if (policyNormalized === requiredNormalized) {
      return true;
    }

    // Check abbreviations
    const abbreviations = ENDORSEMENT_ABBREVIATIONS[requiredType] || [];
    if (abbreviations.some(abbr =>
      normalizeEndorsementName(abbr) === policyNormalized
    )) {
      return true;
    }

    // Check if policy endorsement is an abbreviation of required
    const requiredAbbrs = ENDORSEMENT_ABBREVIATIONS[requiredType] || [];
    if (requiredAbbrs.some(abbr =>
      policyNormalized === normalizeEndorsementName(abbr)
    )) {
      return true;
    }

    // Keyword matching - all keywords must be present
    const keywords = ENDORSEMENT_KEYWORDS[requiredType] || [];
    if (keywords.length > 0) {
      const allKeywordsPresent = keywords.every(keyword =>
        policyNormalized.includes(normalizeEndorsementName(keyword))
      );
      if (allKeywordsPresent) {
        return true;
      }
    }

    // Check if policy text contains the required type name (with underscores replaced)
    const requiredAsSpaced = requiredType.replace(/_/g, ' ');
    if (policyNormalized.includes(normalizeEndorsementName(requiredAsSpaced))) {
      return true;
    }
  }

  return false;
}

/**
 * Check for missing required endorsements
 *
 * @param policyEndorsements List of endorsements from policy
 * @param requiredEndorsements List of required endorsements
 * @returns Array of gaps for missing endorsements
 */
export function checkMissingEndorsements(
  policyEndorsements: string[],
  requiredEndorsements: RequiredEndorsement[]
): ComplianceGap[] {
  const gaps: ComplianceGap[] = [];

  for (const required of requiredEndorsements) {
    const isPresent = matchEndorsementFuzzy(
      required.endorsement_type,
      policyEndorsements
    );

    if (!isPresent) {
      gaps.push({
        id: uuidv4(),
        type: GapType.MISSING_ENDORSEMENT,
        severity: GapSeverity.WARNING,
        endorsement: required.endorsement_type,
        required_value: required.endorsement_type,
        remediation: `Obtain ${required.description} endorsement from carrier`,
        points_deducted: DEFAULT_SCORE_DEDUCTIONS.MISSING_ENDORSEMENT
      });
    }
  }

  return gaps;
}

/**
 * Validate all endorsements against requirements
 *
 * @param policyEndorsements List of endorsements from policy
 * @param requiredEndorsements List of required endorsements
 * @returns Array of all endorsement-related gaps
 */
export function validateEndorsements(
  policyEndorsements: string[],
  requiredEndorsements: RequiredEndorsement[]
): ComplianceGap[] {
  return checkMissingEndorsements(policyEndorsements, requiredEndorsements);
}

/**
 * Format endorsement type for display
 *
 * @param type Endorsement type
 * @returns Formatted name
 */
export function formatEndorsementType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
