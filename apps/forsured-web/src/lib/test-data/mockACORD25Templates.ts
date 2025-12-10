/**
 * Mock ACORD 25 Templates for Testing
 * REQ-125: Mock OCR & Document Parsing Engine for ACORD 25 Forms
 *
 * Realistic ACORD 25 certificate text samples for different carriers
 */

import type { MockACORD25Template } from '../types/acord25';

/**
 * Travelers ACORD 25 Template (Variant A)
 */
export const travelersTemplate: MockACORD25Template = {
  carrier: 'Travelers',
  variant: 'A',
  templateText: `
ACORD 25 CERTIFICATE OF LIABILITY INSURANCE
DATE: 10/15/2024

PRODUCER
ABC Insurance Agency
123 Main Street
San Francisco, CA 94102

INSURED
Chen Plumbing Co.
456 Market Street
San Francisco, CA 94103

INSURERS AFFORDING COVERAGE
INSURER A: The Travelers Indemnity Company

COVERAGES

GENERAL LIABILITY
POLICY NUMBER: GL-TRV-20241015
POLICY EFF DATE: 01/01/2024
POLICY EXP DATE: 12/31/2024

COMMERCIAL GENERAL LIABILITY
EACH OCCURRENCE                    $2,000,000
GENERAL AGGREGATE                  $4,000,000
PRODUCTS - COMP/OP AGG             $4,000,000

WORKERS COMPENSATION
POLICY NUMBER: WC-TRV-20241015
POLICY EFF DATE: 01/01/2024
POLICY EXP DATE: 12/31/2024

EACH ACCIDENT                      $1,000,000
DISEASE - EA EMPLOYEE              $1,000,000
DISEASE - POLICY LIMIT             $1,000,000

AUTOMOBILE LIABILITY
POLICY NUMBER: CA-TRV-20241015
POLICY EFF DATE: 01/01/2024
POLICY EXP DATE: 12/31/2024

COMBINED SINGLE LIMIT              $1,000,000

UMBRELLA LIABILITY
POLICY NUMBER: UM-TRV-20241015
POLICY EFF DATE: 01/01/2024
POLICY EXP DATE: 12/31/2024

EACH OCCURRENCE                    $5,000,000
AGGREGATE                          $5,000,000

DESCRIPTION OF OPERATIONS / LOCATIONS / VEHICLES
General plumbing and mechanical services for commercial construction projects.

CERTIFICATE HOLDER:
Downtown High-Rise Development LLC
789 Construction Way
San Francisco, CA 94104

ADDITIONAL INSURED
WAIVER OF SUBROGATION
PRIMARY AND NON-CONTRIBUTORY
  `.trim(),
  expectedExtraction: {
    carrier: 'Travelers',
    carrier_confidence: 95,
    policy_number: 'GL-TRV-20241015',
    effective_date: '2024-01-01',
    expiration_date: '2024-12-31',
    coverage_types: [
      { type: 'general_liability', amount: 2000000, confidence: 85 },
      { type: 'workers_comp', amount: 1000000, confidence: 85 },
      { type: 'commercial_auto', amount: 1000000, confidence: 85 },
      { type: 'umbrella_liability', amount: 5000000, confidence: 85 },
    ],
    endorsements: {
      additional_insured: { value: true, confidence: 80 },
      waiver_of_subrogation: { value: true, confidence: 80 },
      primary_non_contributory: { value: true, confidence: 80 },
    },
    overall_confidence: 85,
    requires_manual_review: false,
  },
};

/**
 * Liberty Mutual ACORD 25 Template (Variant B)
 */
export const libertyMutualTemplate: MockACORD25Template = {
  carrier: 'Liberty Mutual',
  variant: 'B',
  templateText: `
CERTIFICATE OF LIABILITY INSURANCE     DATE (MM/DD/YYYY): 10/20/2024

PRODUCER:
XYZ Insurance Brokers
555 Insurance Blvd
Oakland, CA 94601

THIS CERTIFICATE IS ISSUED AS A MATTER OF INFORMATION ONLY AND CONFERS NO RIGHTS UPON THE CERTIFICATE HOLDER.

INSURED:
Rodriguez Electric Inc.
789 Electric Avenue
Oakland, CA 94602

INSURER A: Liberty Mutual Insurance Company

THE POLICIES OF INSURANCE LISTED BELOW HAVE BEEN ISSUED TO THE INSURED NAMED ABOVE.

COMMERCIAL GENERAL LIABILITY
POLICY NUMBER: LM-GL-5789-20240101
EFFECTIVE DATE: 01/01/2024
EXPIRATION DATE: 12/31/2024

EACH OCCURRENCE                    $2M
GENERAL AGGREGATE                  $4M
PRODUCTS/COMP OPS AGG              $4M

WORKERS COMPENSATION AND EMPLOYERS LIABILITY
POLICY NUMBER: LM-WC-5790-20240101
EFFECTIVE DATE: 01/01/2024
EXPIRATION DATE: 12/31/2024

E.L. EACH ACCIDENT                 $1,000,000
E.L. DISEASE - EA EMPLOYEE         $1,000,000
E.L. DISEASE - POLICY LIMIT        $1,000,000

BUSINESS AUTO
POLICY NUMBER: LM-BA-5791-20240101
FROM: 01/01/2024 TO: 12/31/2024

COMBINED SINGLE LIMIT              $1,000,000

EXCESS LIABILITY
POLICY NUMBER: LM-EX-5792-20240101
FROM: 01/01/2024 TO: 12/31/2024

EACH OCCURRENCE                    $5,000,000
AGGREGATE                          $5,000,000

DESCRIPTION OF OPERATIONS:
Commercial and industrial electrical contracting services.

CERTIFICATE HOLDER:
Bay Bridge Commons Project
General Contractor Services LLC
1000 Bay Street
San Francisco, CA 94133

ENDORSEMENTS:
ADDL INSD
SUBR WVD
PRIM & NC
  `.trim(),
  expectedExtraction: {
    carrier: 'Liberty Mutual',
    carrier_confidence: 95,
    policy_number: 'LM-GL-5789-20240101',
    effective_date: '2024-01-01',
    expiration_date: '2024-12-31',
    coverage_types: [
      { type: 'general_liability', amount: 2000000, confidence: 85 },
      { type: 'workers_comp', amount: 1000000, confidence: 85 },
      { type: 'commercial_auto', amount: 1000000, confidence: 85 },
      { type: 'umbrella_liability', amount: 5000000, confidence: 85 },
    ],
    endorsements: {
      additional_insured: { value: true, confidence: 80 },
      waiver_of_subrogation: { value: true, confidence: 80 },
      primary_non_contributory: { value: true, confidence: 80 },
    },
    overall_confidence: 85,
    requires_manual_review: false,
  },
};

/**
 * Hartford ACORD 25 Template (Variant C)
 */
export const hartfordTemplate: MockACORD25Template = {
  carrier: 'Hartford',
  variant: 'C',
  templateText: `
ACORD 25 (2016/03)    CERTIFICATE OF LIABILITY INSURANCE
ISSUE DATE: 10/25/2024

PRODUCER:
Best Insurance Services
2000 Insurance Plaza
Sacramento, CA 95814

INSURED:
Smith Construction LLC
500 Builder Road
Sacramento, CA 95816

INSURER A: Hartford Fire Insurance Company

THIS IS TO CERTIFY THAT THE POLICIES OF INSURANCE LISTED BELOW HAVE BEEN ISSUED.

GENERAL LIABILITY    POLICY NUMBER: HTF-GL-8845-67891234
POLICY PERIOD: 01/01/2024 TO 12/31/2024

OCCURRENCE LIMIT                   $2,000,000
GENERAL AGGREGATE                  $4,000,000
PROD-COMPLETED OPS AGG             $4,000,000

WORKERS COMPENSATION   POLICY NUMBER: HTF-WC-8846-67891235
EFF DATE: 01/01/2024  EXP DATE: 12/31/2024

E.L. EACH ACCIDENT                 $1,000,000
E.L. DISEASE - EACH EMPLOYEE       $1,000,000
E.L. DISEASE - POLICY LIMIT        $1,000,000

AUTO LIABILITY    POLICY NUMBER: HTF-AL-8847-67891236
POLICY PERIOD: 01/01/2024 TO 12/31/2024

CSL                                $500,000

UMBRELLA    POLICY NUMBER: HTF-UM-8848-67891237
POLICY PERIOD: 01/01/2024 TO 12/31/2024

OCCURRENCE                         $5,000,000
AGGREGATE                          $5,000,000

DESCRIPTION OF OPERATIONS:
General construction and framing services for commercial projects.

CERTIFICATE HOLDER:
Mission District Renovation
Property Owner LLC
1500 Mission Street
San Francisco, CA 94103

INCL AI
INCL WOS
INCL P&NC
  `.trim(),
  expectedExtraction: {
    carrier: 'Hartford',
    carrier_confidence: 95,
    policy_number: 'HTF-GL-8845-67891234',
    effective_date: '2024-01-01',
    expiration_date: '2024-12-31',
    coverage_types: [
      { type: 'general_liability', amount: 2000000, confidence: 85 },
      { type: 'workers_comp', amount: 1000000, confidence: 85 },
      { type: 'commercial_auto', amount: 500000, confidence: 85 },
      { type: 'umbrella_liability', amount: 5000000, confidence: 85 },
    ],
    endorsements: {
      additional_insured: { value: true, confidence: 80 },
      waiver_of_subrogation: { value: true, confidence: 80 },
      primary_non_contributory: { value: true, confidence: 80 },
    },
    overall_confidence: 85,
    requires_manual_review: false,
  },
};

/**
 * Poor quality scan template (low confidence test case)
 */
export const poorQualityScanTemplate: MockACORD25Template = {
  carrier: 'Unknown',
  variant: 'Poor Quality',
  templateText: `
CERTIFICATE

[ILLEGIBLE TEXT]

ABC Company

POLICY NUMBER [PARTIAL]
EFFECTIVE ??
EXPIRATION ??

[UNCLEAR]

[HANDWRITTEN NOTES]
  `.trim(),
  expectedExtraction: {
    carrier: 'Unknown',
    carrier_confidence: 0,
    policy_number: null,
    effective_date: null,
    expiration_date: null,
    coverage_types: [],
    overall_confidence: 20,
    requires_manual_review: true,
  },
};

/**
 * Missing critical fields template
 */
export const missingFieldsTemplate: MockACORD25Template = {
  carrier: 'Travelers',
  variant: 'Missing Fields',
  templateText: `
ACORD 25 CERTIFICATE OF LIABILITY INSURANCE

PRODUCER
Quick Insurance
123 Street
City, State

INSURED
Missing Data Company

INSURER A: The Travelers Companies

GENERAL LIABILITY
[NO POLICY NUMBER]
POLICY EFF DATE: 01/01/2024
[NO EXPIRATION DATE]

EACH OCCURRENCE                    $2,000,000
  `.trim(),
  expectedExtraction: {
    carrier: 'Travelers',
    carrier_confidence: 95,
    policy_number: null,
    effective_date: '2024-01-01',
    expiration_date: null,
    coverage_types: [{ type: 'general_liability', amount: 2000000, confidence: 85 }],
    overall_confidence: 50,
    requires_manual_review: true,
  },
};

/**
 * All mock templates for testing
 */
export const mockACORD25Templates = {
  travelers: travelersTemplate,
  libertyMutual: libertyMutualTemplate,
  hartford: hartfordTemplate,
  poorQuality: poorQualityScanTemplate,
  missingFields: missingFieldsTemplate,
};
