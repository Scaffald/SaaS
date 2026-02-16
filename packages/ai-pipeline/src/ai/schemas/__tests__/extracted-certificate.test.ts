import { describe, it, expect } from 'vitest';
import { ExtractedCertificateSchema } from '../extracted-certificate.js';

describe('ExtractedCertificateSchema', () => {
  it('parses a valid complete certificate extraction', () => {
    const valid = {
      document_type: 'acord_25',
      producer: { name: 'ABC Insurance Agency', address: '123 Main St', phone: '555-0100', contact: 'John Smith' },
      insured: { name: 'XYZ Contractors LLC', address: '456 Oak Ave', dba: null },
      certificate_holder: { name: 'Big GC Inc', address: '789 Elm St', is_additional_insured: true },
      coverages: [
        {
          type: 'general_liability',
          carrier: 'Travelers Insurance',
          policy_number: 'GL-12345678',
          effective_date: '2026-01-01',
          expiration_date: '2027-01-01',
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
      coverages: [],
      endorsements: [],
      extraction_confidence: 30,
      extraction_notes: ['Document was mostly unreadable'],
      fields_requiring_review: ['coverages'],
    };
    const result = ExtractedCertificateSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });
});
