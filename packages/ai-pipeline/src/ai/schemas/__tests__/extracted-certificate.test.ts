import { describe, it, expect } from 'vitest';
import { ExtractedCertificateSchema } from '../extracted-certificate.js';

describe('ExtractedCertificateSchema', () => {
  it('parses a valid complete certificate extraction', () => {
    const valid = {
      document_type: 'acord_25',
      certificate_number: 'CERT-2026-001',
      certificate_issue_date: '2026-01-15',
      certificate_revision_number: null,
      producer: {
        name: 'ABC Insurance Agency',
        address: '123 Main St, Suite 100, San Diego, CA 92101',
        phone: '(555) 010-0100',
        fax: '(555) 010-0101',
        email: 'certs@abcinsurance.com',
        contact: 'John Smith',
      },
      insured: { name: 'XYZ Contractors LLC', address: '456 Oak Ave', dba: null },
      certificate_holder: { name: 'Big GC Inc', address: '789 Elm St', is_additional_insured: true },
      insurers: [
        { letter: 'A', name: 'Travelers Insurance', naic: '25658' },
        { letter: 'B', name: 'Hartford Fire Insurance', naic: '19682' },
      ],
      coverages: [
        {
          type: 'general_liability',
          type_other_description: null,
          carrier: 'Travelers Insurance',
          carrier_naic: '25658',
          insurer_letter: 'A',
          policy_number: 'GL-12345678',
          effective_date: '2026-01-01',
          expiration_date: '2027-01-01',
          subrogation_waived: true,
          limits: {
            each_occurrence: 1000000,
            general_aggregate: 2000000,
            products_comp_aggregate: 2000000,
            personal_adv_injury: 1000000,
            damage_to_rented_premises: 100000,
            medical_expense: 5000,
          },
          commercial_general_liability: {
            claims_made: false,
            occurrence: true,
            policy_aggregate_type: 'per_project',
          },
          auto_liability: null,
          umbrella: null,
          workers_comp: null,
        },
        {
          type: 'workers_comp',
          type_other_description: null,
          carrier: 'Hartford Fire Insurance',
          carrier_naic: '19682',
          insurer_letter: 'B',
          policy_number: 'WC-87654321',
          effective_date: '2026-01-01',
          expiration_date: '2027-01-01',
          subrogation_waived: false,
          limits: {
            each_accident: 1000000,
            disease_each_employee: 1000000,
            disease_policy_limit: 1000000,
          },
          commercial_general_liability: null,
          auto_liability: null,
          umbrella: null,
          workers_comp: {
            statutory_limits: true,
            wc_states: ['CA'],
          },
        },
      ],
      endorsements: [
        {
          code: 'CG 20 10 04 13',
          type: 'additional_insured',
          description: 'Additional Insured - Owners, Lessees or Contractors - Scheduled Person or Organization',
          applies_to_coverage: 'general_liability',
          is_blanket: false,
          restricts_coverage: false,
          key_conditions: ['Ongoing operations only', 'Scheduled person or organization'],
        },
      ],
      description_of_operations: 'Project: Downtown Office Renovation. XYZ Contractors is performing general contracting services.',
      cancellation_notice_days: 30,
      authorized_representative: 'Jane Doe',
      extraction_confidence: 92,
      extraction_notes: [],
      fields_requiring_review: [],
    };

    const result = ExtractedCertificateSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const invalid = { document_type: 'acord_25' };
    const result = ExtractedCertificateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid document_type', () => {
    const invalid = {
      document_type: 'not_a_real_type',
      producer: { name: 'Test' },
      insured: { name: 'Test' },
      insurers: [],
      coverages: [],
      endorsements: [],
      extraction_confidence: 50,
      extraction_notes: [],
      fields_requiring_review: [],
    };
    const result = ExtractedCertificateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects extraction_confidence outside 0-100', () => {
    const invalid = {
      document_type: 'acord_25',
      producer: { name: 'Test' },
      insured: { name: 'Test' },
      insurers: [],
      coverages: [],
      endorsements: [],
      extraction_confidence: 150,
      extraction_notes: [],
      fields_requiring_review: [],
    };
    const result = ExtractedCertificateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('accepts minimal valid certificate (no coverages, no endorsements)', () => {
    const minimal = {
      document_type: 'acord_25',
      producer: { name: 'Test Agency' },
      insured: { name: 'Test Corp' },
      insurers: [],
      coverages: [],
      endorsements: [],
      extraction_confidence: 30,
      extraction_notes: ['Document was mostly unreadable'],
      fields_requiring_review: ['coverages'],
    };
    const result = ExtractedCertificateSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it('accepts coverage with "other" type and description', () => {
    const withOther = {
      document_type: 'acord_25',
      producer: { name: 'Test' },
      insured: { name: 'Test' },
      insurers: [{ letter: 'A', name: 'Carrier Co', naic: null }],
      coverages: [
        {
          type: 'other',
          type_other_description: 'Installation Floater',
          carrier: 'Carrier Co',
          carrier_naic: null,
          insurer_letter: 'A',
          policy_number: 'IF-001',
          effective_date: '2026-01-01',
          expiration_date: '2027-01-01',
          subrogation_waived: null,
          limits: { each_occurrence: 500000 },
          commercial_general_liability: null,
          auto_liability: null,
          umbrella: null,
          workers_comp: null,
        },
      ],
      endorsements: [],
      extraction_confidence: 85,
      extraction_notes: [],
      fields_requiring_review: [],
    };
    const result = ExtractedCertificateSchema.safeParse(withOther);
    expect(result.success).toBe(true);
  });
});
