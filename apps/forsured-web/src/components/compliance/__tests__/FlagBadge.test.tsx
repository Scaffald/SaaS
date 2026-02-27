/**
 * Unit Tests for FlagBadge Component
 * Policy and endorsement level flags
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { FlagBadge, getEntityTypeLabel } from '../FlagBadge';
import { FlaggableEntityType, FlagSeverity } from '../../../types';

describe('FlagBadge Component', () => {
  describe('getEntityTypeLabel', () => {
    it('should return "Policy Flag" for policy entity type', () => {
      expect(getEntityTypeLabel('policy')).toBe('Policy Flag');
    });

    it('should return "Provision Flag" for provision entity type', () => {
      expect(getEntityTypeLabel('provision')).toBe('Provision Flag');
    });

    it('should return "Endorsement Flag" for endorsement entity type', () => {
      expect(getEntityTypeLabel('endorsement')).toBe('Endorsement Flag');
    });
  });

  describe('Compact Badge Rendering', () => {
    it('should render compact badge with correct label', () => {
      render(
        <FlagBadge
          entityType="policy"
          severity="warning"
          compact={true}
        />
      );

      expect(screen.getByText('Policy Flag')).toBeInTheDocument();
    });

    it('should render compact badge with appropriate aria-label', () => {
      render(
        <FlagBadge
          entityType="provision"
          severity="critical"
          compact={true}
        />
      );

      const badge = screen.getByLabelText('Provision Flag: Critical severity');
      expect(badge).toBeInTheDocument();
    });

    it.each([
      ['policy', 'warning'],
      ['provision', 'critical'],
      ['endorsement', 'info'],
    ] as [FlaggableEntityType, FlagSeverity][])(
      'should render compact badge for %s entity with %s severity',
      (entityType, severity) => {
        render(
          <FlagBadge
            entityType={entityType}
            severity={severity}
            compact={true}
          />
        );

        const expectedLabel = getEntityTypeLabel(entityType);
        expect(screen.getByText(expectedLabel)).toBeInTheDocument();
      }
    );
  });

  describe('Full Badge Rendering', () => {
    it('should render full badge with title', () => {
      render(
        <FlagBadge
          entityType="policy"
          severity="critical"
          title="Missing GL Coverage"
          compact={false}
        />
      );

      expect(screen.getByText('Missing GL Coverage')).toBeInTheDocument();
      expect(screen.getByText('Policy Flag')).toBeInTheDocument();
    });

    it('should render full badge with flag type', () => {
      render(
        <FlagBadge
          entityType="endorsement"
          severity="warning"
          flagType="missing_endorsement"
          compact={false}
        />
      );

      expect(screen.getByText('missing endorsement')).toBeInTheDocument();
    });

    it('should render description when showDescription is true', () => {
      render(
        <FlagBadge
          entityType="provision"
          severity="info"
          description="This is a detailed description"
          showDescription={true}
          compact={false}
        />
      );

      expect(screen.getByText('This is a detailed description')).toBeInTheDocument();
    });

    it('should not render description when showDescription is false', () => {
      render(
        <FlagBadge
          entityType="provision"
          severity="info"
          description="This should not appear"
          showDescription={false}
          compact={false}
        />
      );

      expect(screen.queryByText('This should not appear')).not.toBeInTheDocument();
    });

    it('should render severity label', () => {
      render(
        <FlagBadge
          entityType="policy"
          severity="critical"
          compact={false}
        />
      );

      expect(screen.getByText('Critical')).toBeInTheDocument();
    });
  });

  describe('Severity Styling', () => {
    it('should render critical severity badge', () => {
      render(
        <FlagBadge
          entityType="policy"
          severity="critical"
          compact={false}
        />
      );

      // Theme uses atomic CSS, check that badge renders with critical severity
      expect(screen.getByLabelText(/Policy Flag: Critical severity/i)).toBeInTheDocument();
    });

    it('should render warning severity badge', () => {
      render(
        <FlagBadge
          entityType="policy"
          severity="warning"
          compact={false}
        />
      );

      // Check badge renders with warning severity
      expect(screen.getByLabelText(/Policy Flag: Warning severity/i)).toBeInTheDocument();
    });

    it('should render info severity badge', () => {
      render(
        <FlagBadge
          entityType="policy"
          severity="info"
          compact={false}
        />
      );

      // Check badge renders with info severity
      expect(screen.getByLabelText(/Policy Flag: Info severity/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate aria-label for all combinations', () => {
      const combinations: [FlaggableEntityType, FlagSeverity][] = [
        ['policy', 'critical'],
        ['policy', 'warning'],
        ['policy', 'info'],
        ['provision', 'critical'],
        ['provision', 'warning'],
        ['provision', 'info'],
        ['endorsement', 'critical'],
        ['endorsement', 'warning'],
        ['endorsement', 'info'],
      ];

      combinations.forEach(([entityType, severity]) => {
        const { unmount } = render(
          <FlagBadge
            entityType={entityType}
            severity={severity}
            compact={false}
          />
        );

        const expectedLabel = `${getEntityTypeLabel(entityType)}: ${
          severity.charAt(0).toUpperCase() + severity.slice(1)
        } severity`;

        expect(screen.getByLabelText(expectedLabel)).toBeInTheDocument();
        unmount();
      });
    });
  });
});
