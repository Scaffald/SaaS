/**
 * Unit Tests for FlagList Component
 * Policy & Endorsement Level Flags
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { FlagList } from '../FlagList';
import { FlagComplianceIssue } from '../../../lib/compliance/evaluator';

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

describe('FlagList Component', () => {
  describe('Empty State', () => {
    it('should show empty state when no flags', () => {
      render(<FlagList flags={[]} />);

      expect(screen.getByText('No compliance flags')).toBeInTheDocument();
      expect(screen.getByText('All compliance requirements are met')).toBeInTheDocument();
    });

    it('should show custom empty message', () => {
      render(<FlagList flags={[]} emptyMessage="No issues found" />);

      expect(screen.getByText('No issues found')).toBeInTheDocument();
    });
  });

  describe('Flat List Rendering', () => {
    it('should render all flags in flat list', () => {
      const flags = [
        createTestFlag({ flagId: 'flag-1', title: 'Flag One' }),
        createTestFlag({ flagId: 'flag-2', title: 'Flag Two' }),
        createTestFlag({ flagId: 'flag-3', title: 'Flag Three' }),
      ];

      render(<FlagList flags={flags} />);

      expect(screen.getByText('Flag One')).toBeInTheDocument();
      expect(screen.getByText('Flag Two')).toBeInTheDocument();
      expect(screen.getByText('Flag Three')).toBeInTheDocument();
    });

    it('should render descriptions when showDescription is true', () => {
      const flags = [
        createTestFlag({
          flagId: 'flag-1',
          title: 'Test Flag',
          description: 'This is a description',
        }),
      ];

      render(<FlagList flags={flags} showDescription={true} />);

      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('should not render descriptions when showDescription is false', () => {
      const flags = [
        createTestFlag({
          flagId: 'flag-1',
          title: 'Test Flag',
          description: 'This should not appear',
        }),
      ];

      render(<FlagList flags={flags} showDescription={false} />);

      expect(screen.queryByText('This should not appear')).not.toBeInTheDocument();
    });
  });

  describe('Group by Level', () => {
    it('should group flags by entity type', () => {
      const flags = [
        createTestFlag({
          flagId: 'flag-policy',
          entityType: 'policy',
          title: 'Policy Issue',
        }),
        createTestFlag({
          flagId: 'flag-provision',
          entityType: 'provision',
          title: 'Provision Issue',
        }),
        createTestFlag({
          flagId: 'flag-endorsement',
          entityType: 'endorsement',
          title: 'Endorsement Issue',
        }),
      ];

      render(<FlagList flags={flags} groupByLevel={true} />);

      expect(screen.getByText('Policy-Level Flags (1)')).toBeInTheDocument();
      expect(screen.getByText('Provision-Level Flags (1)')).toBeInTheDocument();
      expect(screen.getByText('Endorsement-Level Flags (1)')).toBeInTheDocument();
    });

    it('should not show sections with zero flags', () => {
      const flags = [
        createTestFlag({
          flagId: 'flag-policy',
          entityType: 'policy',
          title: 'Policy Issue',
        }),
      ];

      render(<FlagList flags={flags} groupByLevel={true} />);

      expect(screen.getByText('Policy-Level Flags (1)')).toBeInTheDocument();
      expect(screen.queryByText(/Provision-Level Flags/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Endorsement-Level Flags/)).not.toBeInTheDocument();
    });

    it('should show correct counts per level', () => {
      const flags = [
        createTestFlag({ flagId: 'flag-1', entityType: 'policy' }),
        createTestFlag({ flagId: 'flag-2', entityType: 'policy' }),
        createTestFlag({ flagId: 'flag-3', entityType: 'provision' }),
      ];

      render(<FlagList flags={flags} groupByLevel={true} />);

      expect(screen.getByText('Policy-Level Flags (2)')).toBeInTheDocument();
      expect(screen.getByText('Provision-Level Flags (1)')).toBeInTheDocument();
    });
  });

  describe('Group by Severity', () => {
    it('should group flags by severity', () => {
      const flags = [
        createTestFlag({
          flagId: 'flag-critical',
          severity: 'critical',
          title: 'Critical Issue',
        }),
        createTestFlag({
          flagId: 'flag-warning',
          severity: 'warning',
          title: 'Warning Issue',
        }),
        createTestFlag({
          flagId: 'flag-info',
          severity: 'info',
          title: 'Info Issue',
        }),
      ];

      render(<FlagList flags={flags} groupBySeverity={true} />);

      expect(screen.getByText('Critical Issues (1)')).toBeInTheDocument();
      expect(screen.getByText('Warnings (1)')).toBeInTheDocument();
      expect(screen.getByText('Information (1)')).toBeInTheDocument();
    });

    it('should not show severity sections with zero flags', () => {
      const flags = [
        createTestFlag({
          flagId: 'flag-critical',
          severity: 'critical',
          title: 'Critical Issue',
        }),
      ];

      render(<FlagList flags={flags} groupBySeverity={true} />);

      expect(screen.getByText('Critical Issues (1)')).toBeInTheDocument();
      expect(screen.queryByText(/Warnings/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Information/)).not.toBeInTheDocument();
    });

    it('should show correct counts per severity', () => {
      const flags = [
        createTestFlag({ flagId: 'flag-1', severity: 'critical' }),
        createTestFlag({ flagId: 'flag-2', severity: 'critical' }),
        createTestFlag({ flagId: 'flag-3', severity: 'critical' }),
        createTestFlag({ flagId: 'flag-4', severity: 'warning' }),
        createTestFlag({ flagId: 'flag-5', severity: 'warning' }),
      ];

      render(<FlagList flags={flags} groupBySeverity={true} />);

      expect(screen.getByText('Critical Issues (3)')).toBeInTheDocument();
      expect(screen.getByText('Warnings (2)')).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should render compact badges when compact is true', () => {
      const flags = [
        createTestFlag({ flagId: 'flag-1', title: 'Test Flag', entityType: 'policy' }),
      ];

      render(<FlagList flags={flags} compact={true} />);

      // Compact mode renders the entity type label (e.g., 'Policy Flag')
      expect(screen.getByText('Policy Flag')).toBeInTheDocument();
    });
  });

  describe('Mixed Entity Types and Severities', () => {
    it('should handle mixed flags correctly', () => {
      const flags = [
        createTestFlag({
          flagId: 'flag-1',
          entityType: 'policy',
          severity: 'critical',
          title: 'Critical Policy',
        }),
        createTestFlag({
          flagId: 'flag-2',
          entityType: 'provision',
          severity: 'warning',
          title: 'Warning Provision',
        }),
        createTestFlag({
          flagId: 'flag-3',
          entityType: 'endorsement',
          severity: 'info',
          title: 'Info Endorsement',
        }),
      ];

      render(<FlagList flags={flags} />);

      expect(screen.getByText('Critical Policy')).toBeInTheDocument();
      expect(screen.getByText('Warning Provision')).toBeInTheDocument();
      expect(screen.getByText('Info Endorsement')).toBeInTheDocument();
    });
  });
});
