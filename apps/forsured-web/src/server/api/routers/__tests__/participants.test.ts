/**
 * Participants Router Tests
 * REQ-281: Participants Tab Compliance View
 * TASK-1, TASK-2: Test compliance data endpoints and calculation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import { participantsRouter } from '../participants';

// Mock Supabase clients
vi.mock('../../../../lib/supabase', () => {
  const createMockQueryBuilder = () => {
    let mockData: unknown = null;
    let mockError: unknown = null;
    let mockCount: number | null = null;

    const builder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(() => Promise.resolve({ data: mockData, error: mockError })),
      then: vi.fn((resolve) =>
        resolve({ data: mockData, error: mockError, count: mockCount })
      ),
      _setMockData: (data: unknown) => {
        mockData = data;
      },
      _setMockError: (error: unknown) => {
        mockError = error;
      },
      _setMockCount: (count: number | null) => {
        mockCount = count;
      },
    };

    return builder;
  };

  return {
    forsured: vi.fn(() => createMockQueryBuilder()),
  };
});

// Import after mocking
import { forsured } from '../../../../lib/supabase';

// Test UUIDs (must be valid UUID v4 format)
const TEST_ORG_ID = '11111111-1111-4111-a111-111111111111';
const TEST_ORG_ID_2 = '22222222-2222-4222-a222-222222222222';
const TEST_PROJECT_ID = '33333333-3333-4333-a333-333333333333';
const TEST_USER_ID = '44444444-4444-4444-a444-444444444444';
const TEST_SUB_ID_1 = '55555555-5555-4555-a555-555555555551';
const TEST_SUB_ID_2 = '55555555-5555-4555-a555-555555555552';
const TEST_SUB_ID_3 = '55555555-5555-4555-a555-555555555553';
const TEST_SUB_ID_4 = '55555555-5555-4555-a555-555555555554';

// Mock context factory
function createMockContext(organizationId: string | null = TEST_ORG_ID) {
  return {
    organizationId,
    userId: TEST_USER_ID,
    session: {
      user: { id: TEST_USER_ID },
    },
  };
}

// Helper to create caller
function createCaller(ctx: ReturnType<typeof createMockContext>) {
  return participantsRouter.createCaller(ctx as never);
}

describe('Participants Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listByProject', () => {
    it('should return participants with compliance data', async () => {
      const mockProject = { id: TEST_PROJECT_ID };
      const mockSubcontractors = [
        {
          id: TEST_SUB_ID_1,
          name: 'John Doe',
          company: 'Acme Construction',
          contact_info: { email: 'john@acme.com', role: 'Electrician' },
          created_at: '2024-01-01',
        },
        {
          id: TEST_SUB_ID_2,
          name: 'Jane Smith',
          company: 'Smith Plumbing',
          contact_info: { email: 'jane@smith.com', role: 'Plumber' },
          created_at: '2024-01-02',
        },
      ];
      const mockComplianceScores = [
        {
          subcontractor_id: TEST_SUB_ID_1,
          score: 95,
          status: 'compliant',
          last_evaluated: '2024-12-01',
        },
        {
          subcontractor_id: TEST_SUB_ID_2,
          score: 60,
          status: 'warning',
          last_evaluated: '2024-12-01',
        },
      ];

      let callCount = 0;
      vi.mocked(forsured).mockImplementation(() => {
        callCount++;
        const builder = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          single: vi.fn(() => {
            if (callCount === 1) {
              // Project query
              return Promise.resolve({ data: mockProject, error: null });
            }
            return Promise.resolve({ data: null, error: null });
          }),
          then: vi.fn((resolve) => {
            if (callCount === 2) {
              // Subcontractors query
              return resolve({ data: mockSubcontractors, error: null });
            }
            if (callCount === 3) {
              // Compliance scores query
              return resolve({ data: mockComplianceScores, error: null });
            }
            if (callCount === 4) {
              // Issues count query
              return resolve({ data: [], error: null });
            }
            if (callCount === 5) {
              // Total count query
              return resolve({ data: null, error: null, count: 2 });
            }
            return resolve({ data: null, error: null });
          }),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      const result = await caller.listByProject({
        organizationId: TEST_ORG_ID,
        projectId: TEST_PROJECT_ID,
      });

      expect(result.participants).toHaveLength(2);
      expect(result.participants[0].name).toBe('John Doe');
      expect(result.participants[0].status).toBe('compliant');
      expect(result.participants[0].score).toBe(95);
      expect(result.participants[1].name).toBe('Jane Smith');
      expect(result.participants[1].status).toBe('at-risk');
      expect(result.participants[1].score).toBe(60);
    });

    it('should throw FORBIDDEN for unauthorized organization', async () => {
      const ctx = createMockContext(TEST_ORG_ID_2);
      const caller = createCaller(ctx);

      await expect(
        caller.listByProject({
          organizationId: TEST_ORG_ID,
          projectId: TEST_PROJECT_ID,
        })
      ).rejects.toThrow(TRPCError);
    });

    it('should throw FORBIDDEN when user has no organization', async () => {
      const ctx = createMockContext(null);
      const caller = createCaller(ctx);

      await expect(
        caller.listByProject({
          organizationId: TEST_ORG_ID,
          projectId: TEST_PROJECT_ID,
        })
      ).rejects.toThrow('You must belong to an organization');
    });

    it('should filter by compliance status when provided', async () => {
      const mockProject = { id: TEST_PROJECT_ID };
      const mockSubcontractors = [
        {
          id: TEST_SUB_ID_1,
          name: 'John Doe',
          company: 'Acme Construction',
          contact_info: {},
          created_at: '2024-01-01',
        },
        {
          id: TEST_SUB_ID_2,
          name: 'Jane Smith',
          company: 'Smith Plumbing',
          contact_info: {},
          created_at: '2024-01-02',
        },
      ];
      const mockComplianceScores = [
        { subcontractor_id: TEST_SUB_ID_1, score: 100, status: 'compliant' },
        { subcontractor_id: TEST_SUB_ID_2, score: 50, status: 'critical' },
      ];

      let callCount = 0;
      vi.mocked(forsured).mockImplementation(() => {
        callCount++;
        const builder = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          single: vi.fn(() => {
            if (callCount === 1) return Promise.resolve({ data: mockProject, error: null });
            return Promise.resolve({ data: null, error: null });
          }),
          then: vi.fn((resolve) => {
            if (callCount === 2) return resolve({ data: mockSubcontractors, error: null });
            if (callCount === 3) return resolve({ data: mockComplianceScores, error: null });
            if (callCount === 4) return resolve({ data: [], error: null });
            if (callCount === 5) return resolve({ data: null, error: null, count: 2 });
            return resolve({ data: null, error: null });
          }),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      const result = await caller.listByProject({
        organizationId: TEST_ORG_ID,
        projectId: TEST_PROJECT_ID,
        status: 'compliant',
      });

      // Only the compliant participant should be returned
      expect(result.participants).toHaveLength(1);
      expect(result.participants[0].name).toBe('John Doe');
      expect(result.participants[0].status).toBe('compliant');
    });

    it('should return empty array when no participants exist', async () => {
      const mockProject = { id: TEST_PROJECT_ID };

      let callCount = 0;
      vi.mocked(forsured).mockImplementation(() => {
        callCount++;
        const builder = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          single: vi.fn(() => {
            if (callCount === 1) return Promise.resolve({ data: mockProject, error: null });
            return Promise.resolve({ data: null, error: null });
          }),
          then: vi.fn((resolve) => {
            if (callCount === 2) return resolve({ data: [], error: null });
            return resolve({ data: null, error: null });
          }),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      const result = await caller.listByProject({
        organizationId: TEST_ORG_ID,
        projectId: TEST_PROJECT_ID,
      });

      expect(result.participants).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('get', () => {
    it('should return participant with compliance details', async () => {
      const mockSubcontractor = {
        id: TEST_SUB_ID_1,
        name: 'John Doe',
        company: 'Acme Construction',
        contact_info: { email: 'john@acme.com', role: 'Electrician', phone: '555-1234' },
        created_at: '2024-01-01',
      };
      const mockComplianceScore = {
        score: 85,
        status: 'warning',
        gaps: [{ type: 'coverage_gap', title: 'Missing umbrella coverage' }],
        last_evaluated: '2024-12-01',
      };
      const mockIssues = [
        {
          id: 'issue-1',
          type: 'coverage_gap',
          title: 'Missing umbrella coverage',
          status: 'open',
        },
      ];

      let callCount = 0;
      vi.mocked(forsured).mockImplementation(() => {
        callCount++;
        const builder = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          single: vi.fn(() => {
            if (callCount === 1) return Promise.resolve({ data: mockSubcontractor, error: null });
            if (callCount === 2)
              return Promise.resolve({ data: mockComplianceScore, error: null });
            return Promise.resolve({ data: null, error: null });
          }),
          then: vi.fn((resolve) => {
            if (callCount === 3) return resolve({ data: mockIssues, error: null });
            return resolve({ data: null, error: null });
          }),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      const result = await caller.get({
        organizationId: TEST_ORG_ID,
        projectId: TEST_PROJECT_ID,
        participantId: TEST_SUB_ID_1,
      });

      expect(result.participant.name).toBe('John Doe');
      expect(result.participant.status).toBe('at-risk');
      expect(result.participant.score).toBe(85);
      expect(result.complianceDetails).not.toBeNull();
      expect(result.complianceDetails?.score).toBe(85);
      expect(result.issues).toHaveLength(1);
    });

    it('should throw NOT_FOUND for non-existent participant', async () => {
      vi.mocked(forsured).mockImplementation(() => {
        const builder = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn(() =>
            Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'Not found' } })
          ),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      await expect(
        caller.get({
          organizationId: TEST_ORG_ID,
          projectId: TEST_PROJECT_ID,
          participantId: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('getComplianceSummary', () => {
    it('should return compliance summary statistics', async () => {
      const mockProject = { id: TEST_PROJECT_ID };
      const mockSubcontractors = [
        { id: TEST_SUB_ID_1 },
        { id: TEST_SUB_ID_2 },
        { id: TEST_SUB_ID_3 },
        { id: TEST_SUB_ID_4 },
      ];
      const mockScores = [
        { score: 100, status: 'compliant' },
        { score: 80, status: 'warning' },
        { score: 40, status: 'critical' },
        // sub-4 has no score, should be counted as pending
      ];

      let callCount = 0;
      vi.mocked(forsured).mockImplementation(() => {
        callCount++;
        const builder = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          single: vi.fn(() => {
            if (callCount === 1) return Promise.resolve({ data: mockProject, error: null });
            return Promise.resolve({ data: null, error: null });
          }),
          then: vi.fn((resolve) => {
            if (callCount === 2)
              return resolve({ data: mockSubcontractors, error: null, count: 4 });
            if (callCount === 3) return resolve({ data: mockScores, error: null });
            return resolve({ data: null, error: null });
          }),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      const result = await caller.getComplianceSummary({
        organizationId: TEST_ORG_ID,
        projectId: TEST_PROJECT_ID,
      });

      expect(result.total).toBe(4);
      expect(result.compliant).toBe(1);
      expect(result.atRisk).toBe(1);
      expect(result.nonCompliant).toBe(1);
      expect(result.pending).toBe(1); // One without score
      expect(result.averageScore).toBe(73); // (100 + 80 + 40) / 3
    });

    it('should return zeros when no participants exist', async () => {
      const mockProject = { id: TEST_PROJECT_ID };

      let callCount = 0;
      vi.mocked(forsured).mockImplementation(() => {
        callCount++;
        const builder = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn(() => {
            if (callCount === 1) return Promise.resolve({ data: mockProject, error: null });
            return Promise.resolve({ data: null, error: null });
          }),
          then: vi.fn((resolve) => {
            if (callCount === 2) return resolve({ data: [], error: null, count: 0 });
            return resolve({ data: null, error: null });
          }),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      const result = await caller.getComplianceSummary({
        organizationId: TEST_ORG_ID,
        projectId: TEST_PROJECT_ID,
      });

      expect(result.total).toBe(0);
      expect(result.compliant).toBe(0);
      expect(result.pending).toBe(0);
      expect(result.atRisk).toBe(0);
      expect(result.nonCompliant).toBe(0);
      expect(result.averageScore).toBe(0);
    });
  });

  describe('recalculateCompliance', () => {
    it('should calculate compliance score based on requirements and issues', async () => {
      const mockRequirements = [
        { id: 'req-1', coverage_type: 'general_liability' },
        { id: 'req-2', coverage_type: 'workers_comp' },
        { id: 'req-3', coverage_type: 'auto' },
      ];
      const mockOpenIssues = [{ id: 'issue-1', type: 'coverage_gap', title: 'Missing GL' }];

      let callCount = 0;
      vi.mocked(forsured).mockImplementation(() => {
        callCount++;
        const builder = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          upsert: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => {
            if (callCount === 1) return resolve({ data: mockRequirements, error: null });
            if (callCount === 2) return resolve({ data: mockOpenIssues, error: null });
            if (callCount === 3) return resolve({ data: null, error: null }); // upsert
            return resolve({ data: null, error: null });
          }),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      const result = await caller.recalculateCompliance({
        organizationId: TEST_ORG_ID,
        projectId: TEST_PROJECT_ID,
        participantId: TEST_SUB_ID_1,
      });

      // 2 out of 3 requirements met (1 issue)
      expect(result.score).toBe(67); // Math.round((2/3) * 100)
      // Score 67 < 70 means database status 'critical' which maps to UI 'non-compliant'
      expect(result.status).toBe('non-compliant');
      expect(result.gaps).toHaveLength(1);
    });

    it('should return 100% compliant when no requirements exist', async () => {
      let callCount = 0;
      vi.mocked(forsured).mockImplementation(() => {
        callCount++;
        const builder = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          upsert: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => {
            if (callCount === 1) return resolve({ data: [], error: null }); // No requirements
            if (callCount === 2) return resolve({ data: null, error: null }); // upsert
            return resolve({ data: null, error: null });
          }),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      const result = await caller.recalculateCompliance({
        organizationId: TEST_ORG_ID,
        projectId: TEST_PROJECT_ID,
        participantId: TEST_SUB_ID_1,
      });

      expect(result.score).toBe(100);
      expect(result.status).toBe('compliant');
      expect(result.gaps).toHaveLength(0);
    });

    it('should return non-compliant status when all requirements have issues', async () => {
      const mockRequirements = [{ id: 'req-1' }, { id: 'req-2' }];
      const mockOpenIssues = [
        { id: 'issue-1', type: 'coverage_gap', title: 'Missing GL' },
        { id: 'issue-2', type: 'missing_document', title: 'Missing COI' },
      ];

      let callCount = 0;
      vi.mocked(forsured).mockImplementation(() => {
        callCount++;
        const builder = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          upsert: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => {
            if (callCount === 1) return resolve({ data: mockRequirements, error: null });
            if (callCount === 2) return resolve({ data: mockOpenIssues, error: null });
            if (callCount === 3) return resolve({ data: null, error: null }); // upsert
            return resolve({ data: null, error: null });
          }),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      const result = await caller.recalculateCompliance({
        organizationId: TEST_ORG_ID,
        projectId: TEST_PROJECT_ID,
        participantId: TEST_SUB_ID_1,
      });

      expect(result.score).toBe(0);
      expect(result.status).toBe('non-compliant');
      expect(result.gaps).toHaveLength(2);
    });
  });

  describe('Compliance Status Mapping', () => {
    it('should map database status "compliant" to UI "compliant"', async () => {
      const mockSubcontractor = {
        id: TEST_SUB_ID_1,
        name: 'Test',
        company: 'Test Co',
        contact_info: {},
      };
      const mockComplianceScore = { score: 100, status: 'compliant' };

      let callCount = 0;
      vi.mocked(forsured).mockImplementation(() => {
        callCount++;
        const builder = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          single: vi.fn(() => {
            if (callCount === 1) return Promise.resolve({ data: mockSubcontractor, error: null });
            if (callCount === 2)
              return Promise.resolve({ data: mockComplianceScore, error: null });
            return Promise.resolve({ data: null, error: null });
          }),
          then: vi.fn((resolve) => {
            if (callCount === 3) return resolve({ data: [], error: null });
            return resolve({ data: null, error: null });
          }),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      const result = await caller.get({
        organizationId: TEST_ORG_ID,
        projectId: TEST_PROJECT_ID,
        participantId: TEST_SUB_ID_1,
      });

      expect(result.participant.status).toBe('compliant');
    });

    it('should map database status "warning" to UI "at-risk"', async () => {
      const mockSubcontractor = {
        id: TEST_SUB_ID_1,
        name: 'Test',
        company: 'Test Co',
        contact_info: {},
      };
      const mockComplianceScore = { score: 75, status: 'warning' };

      let callCount = 0;
      vi.mocked(forsured).mockImplementation(() => {
        callCount++;
        const builder = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          single: vi.fn(() => {
            if (callCount === 1) return Promise.resolve({ data: mockSubcontractor, error: null });
            if (callCount === 2)
              return Promise.resolve({ data: mockComplianceScore, error: null });
            return Promise.resolve({ data: null, error: null });
          }),
          then: vi.fn((resolve) => {
            if (callCount === 3) return resolve({ data: [], error: null });
            return resolve({ data: null, error: null });
          }),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      const result = await caller.get({
        organizationId: TEST_ORG_ID,
        projectId: TEST_PROJECT_ID,
        participantId: TEST_SUB_ID_1,
      });

      expect(result.participant.status).toBe('at-risk');
    });

    it('should map database status "critical" to UI "non-compliant"', async () => {
      const mockSubcontractor = {
        id: TEST_SUB_ID_1,
        name: 'Test',
        company: 'Test Co',
        contact_info: {},
      };
      const mockComplianceScore = { score: 20, status: 'critical' };

      let callCount = 0;
      vi.mocked(forsured).mockImplementation(() => {
        callCount++;
        const builder = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          single: vi.fn(() => {
            if (callCount === 1) return Promise.resolve({ data: mockSubcontractor, error: null });
            if (callCount === 2)
              return Promise.resolve({ data: mockComplianceScore, error: null });
            return Promise.resolve({ data: null, error: null });
          }),
          then: vi.fn((resolve) => {
            if (callCount === 3) return resolve({ data: [], error: null });
            return resolve({ data: null, error: null });
          }),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      const result = await caller.get({
        organizationId: TEST_ORG_ID,
        projectId: TEST_PROJECT_ID,
        participantId: TEST_SUB_ID_1,
      });

      expect(result.participant.status).toBe('non-compliant');
    });
  });
});
