/**
 * ACORD 25 Certificate of Insurance Parser
 * Mock OCR & Document Parsing Engine for ACORD 25 Forms
 *
 * Parses extracted OCR text into structured policy data with confidence scoring
 */

import type {
  ACORD25Extraction,
  ParserInput,
  CoverageExtraction,
  EndorsementExtraction,
  InsuranceCarrier,
  CoverageType,
} from '../types/acord25';
import {
  validateAndParseDate,
  validateAndParseCurrency,
  validatePolicyNumber,
  validateCoverageLimit,
  validateDateRange,
  checkMissingFields,
} from '../validation/dataValidation';

/**
 * Pattern extraction rules for different carriers
 */
interface CarrierRules {
  policyNumberPattern: RegExp;
  datePatterns: {
    effective: RegExp[];
    expiration: RegExp[];
  };
  coveragePatterns: Record<string, RegExp[]>;
  endorsementPatterns: {
    additionalInsured: RegExp[];
    waiverOfSubrogation: RegExp[];
    primaryNonContributory: RegExp[];
  };
}

/**
 * Carrier-specific extraction rules
 */
const CARRIER_RULES: Record<InsuranceCarrier, CarrierRules> = {
  'Travelers': {
    policyNumberPattern: /(?:POLICY\s+(?:NO|NUMBER|#)?:?\s*)([A-Z]{2,3}-[A-Z0-9]{2,4}-\d{4,8})/i,
    datePatterns: {
      effective: [
        /(?:POLICY\s+)?(?:EFF(?:ECTIVE)?|START)\s+DATE:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
        /EFFECTIVE\s+(\d{1,2}\/\d{1,2}\/\d{4})/i,
      ],
      expiration: [
        /(?:POLICY\s+)?(?:EXP(?:IRATION)?|END)\s+DATE:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
        /EXPIRATION\s+(\d{1,2}\/\d{1,2}\/\d{4})/i,
      ],
    },
    coveragePatterns: {
      general_liability: [
        /GENERAL\s+LIABILITY.*?EACH\s+OCCURRENCE\s+\$?\s*([\d,]+(?:\.\d{2})?)/is,
        /GENERAL\s+LIABILITY.*?(\$\s*\d+\s*M(?:ILLION)?)/is,
      ],
      workers_comp: [
        /WORKERS\s+COMP(?:ENSATION)?.*?(?:EACH\s+ACCIDENT|E\.L\.\s+EACH\s+ACCIDENT)\s+\$?\s*([\d,]+(?:\.\d{2})?)/is,
        /WORKERS\s+COMP(?:ENSATION)?.*?(\$\s*\d+\s*M(?:ILLION)?)/is,
      ],
      commercial_auto: [
        /(?:COMMERCIAL\s+)?AUTO(?:MOBILE)?.*?COMBINED\s+SINGLE\s+LIMIT\s+\$?\s*([\d,]+(?:\.\d{2})?)/is,
        /(?:COMMERCIAL\s+)?AUTO(?:MOBILE)?.*?(\$\s*\d+\s*M(?:ILLION)?)/is,
      ],
      umbrella_liability: [
        /UMBRELLA\s+LIAB(?:ILITY)?.*?EACH\s+OCCURRENCE\s+\$?\s*([\d,]+(?:\.\d{2})?)/is,
        /UMBRELLA\s+LIAB(?:ILITY)?.*?(\$\s*\d+\s*M(?:ILLION)?)/is,
      ],
    },
    endorsementPatterns: {
      additionalInsured: [
        /ADDITIONAL\s+INSURED/i,
        /ADD'?L\s+INSURED/i,
        /AI\s+ENDORSEMENT/i,
      ],
      waiverOfSubrogation: [
        /WAIVER\s+OF\s+SUBROGATION/i,
        /WOS/i,
        /SUBROGATION\s+WAIVED/i,
      ],
      primaryNonContributory: [
        /PRIMARY\s+(?:AND|&)?\s*NON-?CONTRIBUTORY/i,
        /PRI(?:MARY)?\s*\/?\s*NON-?CONT(?:RIB)?/i,
        /PRIMARY\s+COVERAGE/i,
      ],
    },
  },
  'Liberty Mutual': {
    policyNumberPattern: /(?:POLICY\s+(?:NO|NUMBER|#)?:?\s*)([A-Z]{2,3}-[A-Z0-9]{2,4}-\d{4,8})/i,
    datePatterns: {
      effective: [
        /EFFECTIVE\s+DATE:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
        /FROM:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      ],
      expiration: [
        /EXPIRATION\s+DATE:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
        /TO:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      ],
    },
    coveragePatterns: {
      general_liability: [
        /COMMERCIAL\s+GENERAL\s+LIABILITY.*?EACH\s+OCCURRENCE\s+\$?\s*([\d,]+(?:\.\d{2})?|[\d.]+\s*M)/is,
        /GEN(?:ERAL)?\s*L(?:IAB)?.*?(\$?\s*\d+(?:\.\d+)?\s*M)/is,
      ],
      workers_comp: [
        /WORKERS\s+COMPENSATION.*?EACH\s+ACCIDENT\s+\$?\s*([\d,]+(?:\.\d{2})?)/is,
        /W(?:ORKERS)?\s*C(?:OMP)?.*?(\$\s*\d+\s*M(?:ILLION)?)/is,
      ],
      commercial_auto: [
        /BUSINESS\s+AUTO.*?COMBINED\s+SINGLE\s+LIMIT\s+\$?\s*([\d,]+(?:\.\d{2})?)/is,
        /AUTO.*?(\$\s*\d+\s*M(?:ILLION)?)/is,
      ],
      umbrella_liability: [
        /EXCESS\s+LIABILITY.*?EACH\s+OCCURRENCE\s+\$?\s*([\d,]+(?:\.\d{2})?)/is,
        /UMBRELLA.*?(\$\s*\d+\s*M(?:ILLION)?)/is,
      ],
    },
    endorsementPatterns: {
      additionalInsured: [
        /ADDITIONAL\s+INSURED/i,
        /ADDL\s+INSD/i,
      ],
      waiverOfSubrogation: [
        /WAIVER\s+OF\s+SUBROGATION/i,
        /SUBR\s+WVD/i,
      ],
      primaryNonContributory: [
        /PRIMARY\s+AND\s+NON-?CONTRIBUTORY/i,
        /PRIM\s+&\s+NC/i,
      ],
    },
  },
  'Hartford': {
    policyNumberPattern: /(?:POLICY\s+(?:NO|NUMBER|#)?:?\s*)([A-Z]{2,3}-[A-Z0-9]{2,4}-\d{4,8})/i,
    datePatterns: {
      effective: [
        /EFF(?:ECTIVE)?\s+DATE:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
        /POLICY\s+PERIOD:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      ],
      expiration: [
        /EXP(?:IRATION)?\s+DATE:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
        /TO:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      ],
    },
    coveragePatterns: {
      general_liability: [
        /GENERAL\s+LIABILITY.*?OCCURRENCE\s+LIMIT\s+\$?\s*([\d,]+(?:\.\d{2})?)/is,
        /GL.*?(\$\s*\d+\s*M(?:ILLION)?)/is,
      ],
      workers_comp: [
        /WORKERS\s+COMP.*?E\.L\.\s+EACH\s+ACCIDENT\s+\$?\s*([\d,]+(?:\.\d{2})?)/is,
        /WC.*?(\$\s*\d+\s*M(?:ILLION)?)/is,
      ],
      commercial_auto: [
        /AUTO\s+LIABILITY.*?CSL\s+\$?\s*([\d,]+(?:\.\d{2})?)/is,
        /AUTO.*?(\$\s*\d+\s*M(?:ILLION)?)/is,
      ],
      umbrella_liability: [
        /UMBRELLA.*?OCCURRENCE\s+\$?\s*([\d,]+(?:\.\d{2})?)/is,
        /UMB.*?(\$\s*\d+\s*M(?:ILLION)?)/is,
      ],
    },
    endorsementPatterns: {
      additionalInsured: [
        /ADDITIONAL\s+INSURED/i,
        /INCL\s+AI/i,
      ],
      waiverOfSubrogation: [
        /WAIVER\s+OF\s+SUBROGATION/i,
        /INCL\s+WOS/i,
      ],
      primaryNonContributory: [
        /PRIMARY\s+AND\s+NON-?CONTRIBUTORY/i,
        /INCL\s+P&NC/i,
      ],
    },
  },
  'Unknown': {
    policyNumberPattern: /(?:POLICY\s+(?:NO|NUMBER|#)?:?\s*)([A-Z0-9-]{6,20})/i,
    datePatterns: {
      effective: [
        /(?:EFF(?:ECTIVE)?|START)\s+DATE:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      ],
      expiration: [
        /(?:EXP(?:IRATION)?|END)\s+DATE:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      ],
    },
    coveragePatterns: {
      general_liability: [
        /GENERAL\s+LIABILITY.*?(\$\s*[\d,]+(?:\.\d{2})?)/is,
      ],
      workers_comp: [
        /WORKERS\s+COMP.*?(\$\s*[\d,]+(?:\.\d{2})?)/is,
      ],
      commercial_auto: [
        /AUTO.*?(\$\s*[\d,]+(?:\.\d{2})?)/is,
      ],
      umbrella_liability: [
        /UMBRELLA.*?(\$\s*[\d,]+(?:\.\d{2})?)/is,
      ],
    },
    endorsementPatterns: {
      additionalInsured: [/ADDITIONAL\s+INSURED/i],
      waiverOfSubrogation: [/WAIVER\s+OF\s+SUBROGATION/i],
      primaryNonContributory: [/PRIMARY.*NON-?CONTRIBUTORY/i],
    },
  },
};

/**
 * ACORD 25 Parser
 */
export class ACORD25Parser {
  /**
   * Parse OCR result into structured ACORD 25 extraction
   */
  async parse(input: ParserInput): Promise<ACORD25Extraction> {
    const startTime = Date.now();

    // Get carrier-specific rules
    const rules = CARRIER_RULES[input.carrier] || CARRIER_RULES['Unknown'];

    // Extract policy number
    const policyNumber = this.extractPolicyNumber(input.rawText, rules);

    // Extract dates
    const effectiveDate = this.extractEffectiveDate(input.rawText, rules);
    const expirationDate = this.extractExpirationDate(input.rawText, rules);

    // Validate date range
    if (effectiveDate.value && expirationDate.value) {
      const dateRangeValidation = validateDateRange(effectiveDate.value, expirationDate.value);
      if (!dateRangeValidation.isValid) {
        // Reduce confidence if dates are invalid
        effectiveDate.confidence = Math.min(effectiveDate.confidence, 50);
        expirationDate.confidence = Math.min(expirationDate.confidence, 50);
      }
    }

    // Extract coverage types
    const coverageTypes = this.extractCoverages(input.rawText, rules);

    // Extract endorsements
    const endorsements = this.extractEndorsements(input.rawText, rules);

    // Calculate overall confidence
    const fieldConfidences = [
      policyNumber.confidence,
      effectiveDate.confidence,
      expirationDate.confidence,
      ...coverageTypes.map(c => c.confidence),
      endorsements.additional_insured.confidence,
      endorsements.waiver_of_subrogation.confidence,
      endorsements.primary_non_contributory.confidence,
    ];
    const overall_confidence = Math.round(
      fieldConfidences.reduce((sum, c) => sum + c, 0) / fieldConfidences.length
    );

    // Build extraction result
    const extraction: ACORD25Extraction = {
      document_id: input.documentId,
      carrier: input.carrier,
      carrier_confidence: 95, // From OCR service
      policy_number: policyNumber.value,
      policy_number_confidence: policyNumber.confidence,
      effective_date: effectiveDate.value,
      effective_date_confidence: effectiveDate.confidence,
      expiration_date: expirationDate.value,
      expiration_date_confidence: expirationDate.confidence,
      coverage_types: coverageTypes,
      endorsements,
      overall_confidence,
      requires_manual_review: overall_confidence < 60,
      errors: [],
      extraction_timestamp: new Date().toISOString(),
      raw_text: input.rawText,
    };

    // Check for missing critical fields
    const missingFieldErrors = checkMissingFields({
      policy_number: extraction.policy_number,
      carrier: extraction.carrier,
      effective_date: extraction.effective_date,
      expiration_date: extraction.expiration_date,
      coverage_types: extraction.coverage_types,
    });

    extraction.errors = missingFieldErrors;

    // Flag for manual review if low confidence
    if (overall_confidence < 60) {
      extraction.errors.push({
        code: 'LOW_CONFIDENCE',
        message: `Overall confidence ${overall_confidence}% is below threshold (60%)`,
      });
    }

    const processingTime = Date.now() - startTime;
    console.log(`ACORD 25 parsing completed in ${processingTime}ms with ${overall_confidence}% confidence`);

    return extraction;
  }

  /**
   * Extract policy number from text
   */
  private extractPolicyNumber(
    text: string,
    rules: CarrierRules
  ): { value: string | null; confidence: number } {
    const match = text.match(rules.policyNumberPattern);
    if (!match) {
      return { value: null, confidence: 0 };
    }

    const rawPolicyNumber = match[1];
    const validation = validatePolicyNumber(rawPolicyNumber);

    if (validation.isValid) {
      return { value: validation.normalized, confidence: 90 };
    }

    // Even if validation fails, return what we found with lower confidence
    return { value: rawPolicyNumber, confidence: 50 };
  }

  /**
   * Extract effective date from text
   */
  private extractEffectiveDate(
    text: string,
    rules: CarrierRules
  ): { value: string | null; confidence: number } {
    for (const pattern of rules.datePatterns.effective) {
      const match = text.match(pattern);
      if (match) {
        const validation = validateAndParseDate(match[1]);
        if (validation.isValid) {
          return { value: validation.isoDate, confidence: 85 };
        }
        return { value: match[1], confidence: 40 };
      }
    }
    return { value: null, confidence: 0 };
  }

  /**
   * Extract expiration date from text
   */
  private extractExpirationDate(
    text: string,
    rules: CarrierRules
  ): { value: string | null; confidence: number } {
    for (const pattern of rules.datePatterns.expiration) {
      const match = text.match(pattern);
      if (match) {
        const validation = validateAndParseDate(match[1]);
        if (validation.isValid) {
          return { value: validation.isoDate, confidence: 85 };
        }
        return { value: match[1], confidence: 40 };
      }
    }
    return { value: null, confidence: 0 };
  }

  /**
   * Extract all coverage types from text
   */
  private extractCoverages(text: string, rules: CarrierRules): CoverageExtraction[] {
    const coverages: CoverageExtraction[] = [];

    for (const [coverageType, patterns] of Object.entries(rules.coveragePatterns)) {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          const validation = validateAndParseCurrency(match[1]);
          if (validation.isValid && validation.amount) {
            const limitCheck = validateCoverageLimit(validation.amount, coverageType);
            coverages.push({
              type: coverageType as CoverageType,
              amount: validation.amount,
              confidence: limitCheck.warning ? 70 : 85,
            });
            break; // Found coverage, move to next type
          }
        }
      }
    }

    return coverages;
  }

  /**
   * Extract endorsement flags from text
   */
  private extractEndorsements(text: string, rules: CarrierRules): EndorsementExtraction {
    const additionalInsured = this.extractEndorsementFlag(
      text,
      rules.endorsementPatterns.additionalInsured
    );
    const waiverOfSubrogation = this.extractEndorsementFlag(
      text,
      rules.endorsementPatterns.waiverOfSubrogation
    );
    const primaryNonContributory = this.extractEndorsementFlag(
      text,
      rules.endorsementPatterns.primaryNonContributory
    );

    return {
      additional_insured: additionalInsured,
      waiver_of_subrogation: waiverOfSubrogation,
      primary_non_contributory: primaryNonContributory,
    };
  }

  /**
   * Extract boolean endorsement flag
   */
  private extractEndorsementFlag(
    text: string,
    patterns: RegExp[]
  ): { value: boolean; confidence: number } {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return { value: true, confidence: 80 };
      }
    }
    return { value: false, confidence: 60 }; // Lower confidence for negative
  }
}

/**
 * Singleton instance
 */
export const acord25Parser = new ACORD25Parser();
