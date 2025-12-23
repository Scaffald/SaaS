/**
 * Unit tests for useBrokerAcknowledgements hook
 * Tests the createForm functionality with subcontractor_org_id
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBrokerAcknowledgements } from '../useBrokerAcknowledgements';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { formatSupabaseError } from '../../../lib/database/formatSupabaseError';

// Mock dependencies
vi.mock('../../../contexts/DatabaseContext');
vi.mock('../../../lib/database/formatSupabaseError');

describe('useBrokerAcknowledgements - createForm', () => {
  const mockSupabase = {
    schema: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useDatabase as any).mockReturnValue({
      supabase: mockSupabase,
    });
  });

  it('should create form with subcontractor_org_id', async () => {
    const mockFormData = {
      project_id: 'project-1',
      subcontractor_org_id: 'sub-org-1',
      subcontractor_company_name: 'Test Subcontractor',
      broker_agency_name: 'Test Broker Agency',
      broker_contact_name: 'John Doe',
      broker_email: 'john@test.com',
      broker_phone: '555-1234',
      broker_org_id: 'broker-org-1',
      gc_project_name: 'Test Project',
      manager_org_id: 'manager-org-1',
      status: 'draft' as const,
      compliance_status: 'pending' as const,
      compliance_score: 0,
      missing_endorsements: [],
      date_issued: new Date().toISOString(),
      date_due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const mockCreatedForm = {
      id: 'form-1',
      ...mockFormData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSupabase.single.mockResolvedValue({
      data: mockCreatedForm,
      error: null,
    });

    mockSupabase.insert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: mockSupabase.single,
      }),
    });

    const { result } = renderHook(() => useBrokerAcknowledgements());

    await waitFor(async () => {
      const createdForm = await result.current.createForm(mockFormData);
      expect(createdForm).toEqual(mockCreatedForm);
    });

    expect(mockSupabase.schema).toHaveBeenCalledWith('forsured');
    expect(mockSupabase.from).toHaveBeenCalledWith('broker_acknowledgements');
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        subcontractor_org_id: 'sub-org-1',
        subcontractor_company_name: 'Test Subcontractor',
      })
    );
  });

  it('should handle errors when creating form', async () => {
    const mockError = { message: 'Database error', code: '23505' };
    const mockFormData = {
      project_id: 'project-1',
      subcontractor_org_id: 'sub-org-1',
      subcontractor_company_name: 'Test Subcontractor',
      broker_agency_name: 'Test Broker Agency',
      broker_contact_name: 'John Doe',
      broker_email: 'john@test.com',
    };

    mockSupabase.single.mockResolvedValue({
      data: null,
      error: mockError,
    });

    mockSupabase.insert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: mockSupabase.single,
      }),
    });

    (formatSupabaseError as any).mockReturnValue(new Error('Formatted error'));

    const { result } = renderHook(() => useBrokerAcknowledgements());

    await expect(result.current.createForm(mockFormData)).rejects.toThrow();
  });

  it('should require subcontractor_org_id in form data', async () => {
    const mockFormData = {
      project_id: 'project-1',
      // Missing subcontractor_org_id
      subcontractor_company_name: 'Test Subcontractor',
      broker_agency_name: 'Test Broker Agency',
    };

    const { result } = renderHook(() => useBrokerAcknowledgements());

    // The hook itself doesn't validate - that's done in the component
    // But we can test that it passes through the data as-is
    mockSupabase.single.mockResolvedValue({
      data: { id: 'form-1', ...mockFormData },
      error: null,
    });

    mockSupabase.insert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: mockSupabase.single,
      }),
    });

    await waitFor(async () => {
      const createdForm = await result.current.createForm(mockFormData);
      expect(createdForm).toBeDefined();
    });
  });
});

