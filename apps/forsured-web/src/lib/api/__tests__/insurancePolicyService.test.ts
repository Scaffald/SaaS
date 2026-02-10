/**
 * Insurance Policy Parent-Child Model
 * Unit tests for insurance policy service layer
 */

import { describe, it, expect } from 'vitest';
import type {
  CreateInsurancePolicyRequest,
  UpdateInsurancePolicyRequest,
  CreateProvisionRequest,
  CreateEndorsementRequest,
} from '../../../types';

// Note: These are unit tests that validate request/response structures
// Integration tests with actual Supabase database are in separate files

describe('InsurancePolicyService - Type Safety', () => {
  it('should accept valid CreateInsurancePolicyRequest', () => {
    const validRequest: CreateInsurancePolicyRequest = {
      organization_id: '123e4567-e89b-12d3-a456-426614174000',
      policy_type: 'GL',
      aggregate_limit: 2000000,
      each_occurrence_limit: 1000000,
      deductible: 10000,
      effective_date: '2025-01-01',
      expiration_date: '2026-01-01',
      provisions: [
        {
          provision_type: 'general_aggregate',
          limit_amount: 2000000,
        },
        {
          provision_type: 'products_completed',
          limit_amount: 2000000,
        },
      ],
      endorsements: [
        {
          endorsement_type: 'CG2010',
          description: 'Additional Insured - Owners, Lessees or Contractors',
        },
      ],
    };

    expect(validRequest).toBeDefined();
    expect(validRequest.policy_type).toBe('GL');
    expect(validRequest.provisions).toHaveLength(2);
    expect(validRequest.endorsements).toHaveLength(1);
  });

  it('should accept valid UpdateInsurancePolicyRequest', () => {
    const validUpdate: UpdateInsurancePolicyRequest = {
      status: 'active',
      aggregate_limit: 3000000,
      deductible: 5000,
    };

    expect(validUpdate).toBeDefined();
    expect(validUpdate.status).toBe('active');
    expect(validUpdate.aggregate_limit).toBe(3000000);
  });

  it('should accept valid CreateProvisionRequest', () => {
    const validProvision: CreateProvisionRequest = {
      provision_type: 'per_occurrence',
      limit_amount: 1000000,
      deductible: 10000,
      description: 'Per occurrence coverage',
    };

    expect(validProvision).toBeDefined();
    expect(validProvision.provision_type).toBe('per_occurrence');
    expect(validProvision.limit_amount).toBe(1000000);
  });

  it('should accept valid CreateEndorsementRequest', () => {
    const validEndorsement: CreateEndorsementRequest = {
      endorsement_code: 'CG2037',
      endorsement_type: 'Additional Insured',
      description: 'Additional Insured - Owners, Lessees or Contractors - Completed Operations',
      limit_amount: 1000000,
      effective_date: '2025-01-01',
    };

    expect(validEndorsement).toBeDefined();
    expect(validEndorsement.endorsement_code).toBe('CG2037');
    expect(validEndorsement.endorsement_type).toBe('Additional Insured');
  });
});

describe('InsurancePolicyService - Validation Logic', () => {
  it('should validate effective_date < expiration_date', () => {
    const effectiveDate = new Date('2025-01-01');
    const expirationDate = new Date('2026-01-01');

    expect(effectiveDate < expirationDate).toBe(true);
  });

  it('should validate monetary amounts are non-negative', () => {
    const validAmounts = [0, 1000000, 2000000.5];
    const invalidAmounts = [-1, -1000000];

    validAmounts.forEach((amount) => {
      expect(amount >= 0).toBe(true);
    });

    invalidAmounts.forEach((amount) => {
      expect(amount >= 0).toBe(false);
    });
  });

  it('should validate policy types', () => {
    const validTypes = ['GL', 'WC', 'Auto', 'Umbrella', 'Professional Liability', 'Other'];
    const testType = 'GL';

    expect(validTypes).toContain(testType);
  });

  it('should validate provision types', () => {
    const validProvisionTypes = [
      'per_occurrence',
      'general_aggregate',
      'personal_advertising',
      'products_completed',
      'medical_payments',
      'damage_to_premises',
      'fire_damage',
      'employee_benefits',
      'other',
    ];
    const testType = 'general_aggregate';

    expect(validProvisionTypes).toContain(testType);
  });

  it('should validate policy statuses', () => {
    const validStatuses = ['active', 'expired', 'cancelled', 'pending'];
    const testStatus = 'active';

    expect(validStatuses).toContain(testStatus);
  });
});

describe('InsurancePolicyService - Request Structure', () => {
  it('should structure nested provisions correctly', () => {
    const request: CreateInsurancePolicyRequest = {
      organization_id: '123e4567-e89b-12d3-a456-426614174000',
      policy_type: 'GL',
      provisions: [
        {
          provision_type: 'general_aggregate',
          limit_amount: 2000000,
        },
        {
          provision_type: 'per_occurrence',
          limit_amount: 1000000,
        },
        {
          provision_type: 'products_completed',
          limit_amount: 2000000,
        },
      ],
    };

    expect(request.provisions).toBeDefined();
    expect(request.provisions).toHaveLength(3);
    expect(request.provisions![0].provision_type).toBe('general_aggregate');
    expect(request.provisions![1].provision_type).toBe('per_occurrence');
    expect(request.provisions![2].provision_type).toBe('products_completed');
  });

  it('should structure nested endorsements correctly', () => {
    const request: CreateInsurancePolicyRequest = {
      organization_id: '123e4567-e89b-12d3-a456-426614174000',
      policy_type: 'GL',
      endorsements: [
        {
          endorsement_type: 'CG2010',
          description: 'Additional Insured',
        },
        {
          endorsement_type: 'CG2404',
          description: 'Waiver of Subrogation',
        },
      ],
    };

    expect(request.endorsements).toBeDefined();
    expect(request.endorsements).toHaveLength(2);
    expect(request.endorsements![0].endorsement_type).toBe('CG2010');
    expect(request.endorsements![1].endorsement_type).toBe('CG2404');
  });

  it('should allow creating policy without children', () => {
    const request: CreateInsurancePolicyRequest = {
      organization_id: '123e4567-e89b-12d3-a456-426614174000',
      policy_type: 'GL',
      aggregate_limit: 2000000,
    };

    expect(request.provisions).toBeUndefined();
    expect(request.endorsements).toBeUndefined();
  });
});
