/**
 * Unit Tests for FlagFilter Component
 * REQ-269: Policy & Endorsement Level Flags
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import { FlagFilter, FilterableFlagList, FilterOption } from '../FlagFilter';
import { FlagComplianceReport, FlagComplianceIssue } from '../../../lib/compliance/evaluator';

// Helper function to create test flags
function createTestFlag(overrides?: Partial<FlagComplianceIssue>): FlagComplianceIssue {
  return {
    flagId: 'flag-1',
    entityType: 'policy',
    entityId: 'policy-123',
    flagType: 'coverage_gap',
    severity: 'warning',
    title: 'Test Flag',
    location: 'Policy Flag',
    ...overrides,
  };
}

// Helper function to create a test report
function createTestReport(
  policyFlags: FlagComplianceIssue[] = [],
  provisionFlags: FlagComplianceIssue[] = [],
  endorsementFlags: FlagComplianceIssue[] = []
): FlagComplianceReport {
  return {
    policyId: 'policy-123',
    policyFlags,
    provisionFlags,
    endorsementFlags,
    summary: {
      totalFlags: policyFlags.length + provisionFlags.length + endorsementFlags.length,
      byLevel: {
        policy: policyFlags.length,
        provision: provisionFlags.length,
        endorsement: endorsementFlags.length,
      },
      bySeverity: {
        critical: [...policyFlags, ...provisionFlags, ...endorsementFlags].filter(
          (f) => f.severity === 'critical'
        ).length,
        warning: [...policyFlags, ...provisionFlags, ...endorsementFlags].filter(
          (f) => f.severity === 'warning'
        ).length,
        info: [...policyFlags, ...provisionFlags, ...endorsementFlags].filter(
          (f) => f.severity === 'info'
        ).length,
      },
    },
  };
}

describe('FlagFilter Component', () => {
  describe('Rendering', () => {
    it('should render all filter options', () => {
      const report = createTestReport(
        [createTestFlag({ flagId: 'p1', entityType: 'policy' })],
        [createTestFlag({ flagId: 'pr1', entityType: 'provision' })],
        [createTestFlag({ flagId: 'e1', entityType: 'endorsement' })]
      );
      const onFilterChange = vi.fn();

      render(<FlagFilter report={report} onFilterChange={onFilterChange} />);

      expect(screen.getByText('All Flags')).toBeInTheDocument();
      expect(screen.getByText('Policy Flags')).toBeInTheDocument();
      expect(screen.getByText('Provision Flags')).toBeInTheDocument();
      expect(screen.getByText('Endorsement Flags')).toBeInTheDocument();
    });

    it('should display correct counts for each filter', () => {
      const report = createTestReport(
        [
          createTestFlag({ flagId: 'p1', entityType: 'policy' }),
          createTestFlag({ flagId: 'p2', entityType: 'policy' }),
        ],
        [createTestFlag({ flagId: 'pr1', entityType: 'provision' })],
        [
          createTestFlag({ flagId: 'e1', entityType: 'endorsement' }),
          createTestFlag({ flagId: 'e2', entityType: 'endorsement' }),
          createTestFlag({ flagId: 'e3', entityType: 'endorsement' }),
        ]
      );
      const onFilterChange = vi.fn();

      render(<FlagFilter report={report} onFilterChange={onFilterChange} />);

      // Total count is 6
      expect(screen.getByText('6')).toBeInTheDocument();
      // Policy count is 2
      expect(screen.getByText('2')).toBeInTheDocument();
      // Provision count is 1
      expect(screen.getByText('1')).toBeInTheDocument();
      // Endorsement count is 3
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should have accessible radiogroup role', () => {
      const report = createTestReport();
      const onFilterChange = vi.fn();

      render(<FlagFilter report={report} onFilterChange={onFilterChange} />);

      expect(
        screen.getByRole('radiogroup', { name: 'Filter compliance flags by level' })
      ).toBeInTheDocument();
    });

    it('should render filter buttons as radio buttons', () => {
      const report = createTestReport();
      const onFilterChange = vi.fn();

      render(<FlagFilter report={report} onFilterChange={onFilterChange} />);

      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons).toHaveLength(4); // all, policy, provision, endorsement
    });
  });

  describe('Filter Selection', () => {
    it('should select "all" by default', () => {
      const report = createTestReport();
      const onFilterChange = vi.fn();

      render(<FlagFilter report={report} onFilterChange={onFilterChange} />);

      const allButton = screen.getByRole('radio', { name: /all flags/i });
      expect(allButton).toHaveAttribute('aria-checked', 'true');
    });

    it('should use initialFilter when provided', () => {
      const report = createTestReport(
        [createTestFlag({ flagId: 'p1', entityType: 'policy' })]
      );
      const onFilterChange = vi.fn();

      render(
        <FlagFilter
          report={report}
          onFilterChange={onFilterChange}
          initialFilter="policy"
        />
      );

      const policyButton = screen.getByRole('radio', { name: /policy flags/i });
      expect(policyButton).toHaveAttribute('aria-checked', 'true');
    });

    it('should call onFilterChange with policy flags when policy filter is selected', () => {
      const policyFlag = createTestFlag({ flagId: 'p1', entityType: 'policy', title: 'Policy Issue' });
      const provisionFlag = createTestFlag({ flagId: 'pr1', entityType: 'provision', title: 'Provision Issue' });
      const report = createTestReport([policyFlag], [provisionFlag], []);
      const onFilterChange = vi.fn();

      render(<FlagFilter report={report} onFilterChange={onFilterChange} />);

      const policyButton = screen.getByRole('radio', { name: /policy flags/i });
      fireEvent.click(policyButton);

      expect(onFilterChange).toHaveBeenCalledWith([policyFlag]);
    });

    it('should call onFilterChange with all flags when all filter is selected', () => {
      const policyFlag = createTestFlag({ flagId: 'p1', entityType: 'policy' });
      const provisionFlag = createTestFlag({ flagId: 'pr1', entityType: 'provision' });
      const endorsementFlag = createTestFlag({ flagId: 'e1', entityType: 'endorsement' });
      const report = createTestReport([policyFlag], [provisionFlag], [endorsementFlag]);
      const onFilterChange = vi.fn();

      render(
        <FlagFilter
          report={report}
          onFilterChange={onFilterChange}
          initialFilter="policy"
        />
      );

      const allButton = screen.getByRole('radio', { name: /all flags/i });
      fireEvent.click(allButton);

      expect(onFilterChange).toHaveBeenCalledWith([policyFlag, provisionFlag, endorsementFlag]);
    });

    it('should call onFilterChange with provision flags when provision filter is selected', () => {
      const provisionFlag = createTestFlag({ flagId: 'pr1', entityType: 'provision' });
      const report = createTestReport([], [provisionFlag], []);
      const onFilterChange = vi.fn();

      render(<FlagFilter report={report} onFilterChange={onFilterChange} />);

      const provisionButton = screen.getByRole('radio', { name: /provision flags/i });
      fireEvent.click(provisionButton);

      expect(onFilterChange).toHaveBeenCalledWith([provisionFlag]);
    });

    it('should call onFilterChange with endorsement flags when endorsement filter is selected', () => {
      const endorsementFlag = createTestFlag({ flagId: 'e1', entityType: 'endorsement' });
      const report = createTestReport([], [], [endorsementFlag]);
      const onFilterChange = vi.fn();

      render(<FlagFilter report={report} onFilterChange={onFilterChange} />);

      const endorsementButton = screen.getByRole('radio', { name: /endorsement flags/i });
      fireEvent.click(endorsementButton);

      expect(onFilterChange).toHaveBeenCalledWith([endorsementFlag]);
    });
  });

  describe('Empty States', () => {
    it('should show zero counts when no flags exist', () => {
      const report = createTestReport([], [], []);
      const onFilterChange = vi.fn();

      render(<FlagFilter report={report} onFilterChange={onFilterChange} />);

      // All counts should be 0
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBe(4); // all, policy, provision, endorsement
    });
  });
});

describe('FilterableFlagList Component', () => {
  describe('Rendering', () => {
    it('should render filter controls and flag list', () => {
      const policyFlag = createTestFlag({
        flagId: 'p1',
        entityType: 'policy',
        title: 'Policy Issue',
      });
      const report = createTestReport([policyFlag], [], []);

      render(<FilterableFlagList report={report} />);

      expect(screen.getByText('All Flags')).toBeInTheDocument();
      expect(screen.getByText('Policy Issue')).toBeInTheDocument();
    });

    it('should show empty state when no flags match filter', () => {
      const report = createTestReport([], [], []);

      render(<FilterableFlagList report={report} />);

      expect(screen.getByText('No compliance flags')).toBeInTheDocument();
      expect(screen.getByText('All requirements are met for this filter')).toBeInTheDocument();
    });

    it('should use custom empty message when provided', () => {
      const report = createTestReport([], [], []);

      render(
        <FilterableFlagList
          report={report}
          emptyMessage="Custom empty message"
        />
      );

      expect(screen.getByText('Custom empty message')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should filter to show only policy flags when policy filter is selected', () => {
      const policyFlag = createTestFlag({
        flagId: 'p1',
        entityType: 'policy',
        title: 'Policy Issue',
      });
      const provisionFlag = createTestFlag({
        flagId: 'pr1',
        entityType: 'provision',
        title: 'Provision Issue',
      });
      const report = createTestReport([policyFlag], [provisionFlag], []);

      render(<FilterableFlagList report={report} />);

      // Initially shows all flags
      expect(screen.getByText('Policy Issue')).toBeInTheDocument();
      expect(screen.getByText('Provision Issue')).toBeInTheDocument();

      // Click policy filter
      const policyButton = screen.getByRole('radio', { name: /policy flags/i });
      fireEvent.click(policyButton);

      // Should only show policy flag
      expect(screen.getByText('Policy Issue')).toBeInTheDocument();
      expect(screen.queryByText('Provision Issue')).not.toBeInTheDocument();
    });

    it('should show all flags when all filter is selected after filtering', () => {
      const policyFlag = createTestFlag({
        flagId: 'p1',
        entityType: 'policy',
        title: 'Policy Issue',
      });
      const provisionFlag = createTestFlag({
        flagId: 'pr1',
        entityType: 'provision',
        title: 'Provision Issue',
      });
      const report = createTestReport([policyFlag], [provisionFlag], []);

      render(<FilterableFlagList report={report} initialFilter="policy" />);

      // Initially shows only policy flags
      expect(screen.getByText('Policy Issue')).toBeInTheDocument();
      expect(screen.queryByText('Provision Issue')).not.toBeInTheDocument();

      // Click all filter
      const allButton = screen.getByRole('radio', { name: /all flags/i });
      fireEvent.click(allButton);

      // Should show all flags
      expect(screen.getByText('Policy Issue')).toBeInTheDocument();
      expect(screen.getByText('Provision Issue')).toBeInTheDocument();
    });

    it('should show empty state with appropriate message when filter has no flags', () => {
      const policyFlag = createTestFlag({
        flagId: 'p1',
        entityType: 'policy',
        title: 'Policy Issue',
      });
      const report = createTestReport([policyFlag], [], []);

      render(<FilterableFlagList report={report} />);

      // Click provision filter (which has no flags)
      const provisionButton = screen.getByRole('radio', { name: /provision flags/i });
      fireEvent.click(provisionButton);

      // Should show appropriate empty message
      expect(screen.getByText('All requirements are met for this filter')).toBeInTheDocument();
    });
  });

  describe('Flag Display', () => {
    it('should display flag severity', () => {
      const criticalFlag = createTestFlag({
        flagId: 'c1',
        severity: 'critical',
        title: 'Critical Issue',
      });
      const report = createTestReport([criticalFlag], [], []);

      render(<FilterableFlagList report={report} />);

      // Severity label is capitalized
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });

    it('should display flag entity type label', () => {
      const flag = createTestFlag({
        flagId: 'p1',
        entityType: 'policy',
        title: 'Test Issue',
      });
      const report = createTestReport([flag], [], []);

      render(<FilterableFlagList report={report} />);

      // FlagBadge renders the entity type label
      expect(screen.getByText('Policy Flag')).toBeInTheDocument();
    });

    it('should display flag description when showDescription is true', () => {
      const flag = createTestFlag({
        flagId: 'p1',
        title: 'Test Issue',
        description: 'This is a detailed description',
      });
      const report = createTestReport([flag], [], []);

      render(<FilterableFlagList report={report} showDescription={true} />);

      expect(screen.getByText('This is a detailed description')).toBeInTheDocument();
    });

    it('should not display flag description when showDescription is false', () => {
      const flag = createTestFlag({
        flagId: 'p1',
        title: 'Test Issue',
        description: 'This should not appear',
      });
      const report = createTestReport([flag], [], []);

      render(<FilterableFlagList report={report} showDescription={false} />);

      expect(screen.queryByText('This should not appear')).not.toBeInTheDocument();
    });

    it('should display flag type', () => {
      const flag = createTestFlag({
        flagId: 'p1',
        flagType: 'coverage_gap',
        title: 'Coverage Gap Issue',
      });
      const report = createTestReport([flag], [], []);

      render(<FilterableFlagList report={report} />);

      expect(screen.getByText('coverage gap')).toBeInTheDocument();
    });
  });

  describe('Initial Filter', () => {
    it('should respect initialFilter prop', () => {
      const policyFlag = createTestFlag({
        flagId: 'p1',
        entityType: 'policy',
        title: 'Policy Issue',
      });
      const provisionFlag = createTestFlag({
        flagId: 'pr1',
        entityType: 'provision',
        title: 'Provision Issue',
      });
      const report = createTestReport([policyFlag], [provisionFlag], []);

      render(<FilterableFlagList report={report} initialFilter="provision" />);

      // Should only show provision flag initially
      expect(screen.queryByText('Policy Issue')).not.toBeInTheDocument();
      expect(screen.getByText('Provision Issue')).toBeInTheDocument();
    });
  });
});
