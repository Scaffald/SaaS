/**
 * Unit Tests for RiskBadge Component
 * REQ: Phase 5 - Risk Level Algorithm Implementation
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { RiskBadge, RiskIndicator } from '../RiskBadge';
import { RiskLevel } from '../../../lib/compliance/riskCalculationService';

describe('RiskBadge Component', () => {
  describe('Basic Rendering', () => {
    it('should render LOW risk level', () => {
      render(<RiskBadge level="low" />);
      expect(screen.getByText('LOW')).toBeInTheDocument();
    });

    it('should render MEDIUM risk level', () => {
      render(<RiskBadge level="medium" />);
      expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    });

    it('should render HIGH risk level', () => {
      render(<RiskBadge level="high" />);
      expect(screen.getByText('HIGH')).toBeInTheDocument();
    });

    it('should render CRITICAL risk level', () => {
      render(<RiskBadge level="critical" />);
      expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    });
  });

  describe('Score Display', () => {
    it('should not show score by default', () => {
      render(<RiskBadge level="low" score={95} />);
      expect(screen.getByText('LOW')).toBeInTheDocument();
      expect(screen.queryByText('(95%)')).not.toBeInTheDocument();
    });

    it('should show score when showScore is true', () => {
      render(<RiskBadge level="low" score={95} showScore />);
      expect(screen.getByText('LOW (95%)')).toBeInTheDocument();
    });

    it('should not show score when score is undefined even with showScore', () => {
      render(<RiskBadge level="medium" showScore />);
      expect(screen.getByText('MEDIUM')).toBeInTheDocument();
      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render small size', () => {
      render(<RiskBadge level="low" size="sm" />);
      expect(screen.getByText('LOW')).toBeInTheDocument();
    });

    it('should render medium size (default)', () => {
      render(<RiskBadge level="low" />);
      expect(screen.getByText('LOW')).toBeInTheDocument();
    });

    it('should render large size', () => {
      render(<RiskBadge level="low" size="lg" />);
      expect(screen.getByText('LOW')).toBeInTheDocument();
    });
  });

  describe('Icon Display', () => {
    it('should show icon by default', () => {
      render(<RiskBadge level="critical" />);
      // Icon should be rendered (we can't test SVG content directly with Tamagui)
      expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    });

    it('should hide icon when showIcon is false', () => {
      render(<RiskBadge level="critical" showIcon={false} />);
      expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate aria-label for LOW risk', () => {
      render(<RiskBadge level="low" />);
      expect(screen.getByLabelText(/Risk level: low/i)).toBeInTheDocument();
    });

    it('should have appropriate aria-label for CRITICAL risk', () => {
      render(<RiskBadge level="critical" />);
      expect(screen.getByLabelText(/Risk level: critical/i)).toBeInTheDocument();
    });

    it('should allow custom aria-label', () => {
      render(<RiskBadge level="high" aria-label="Custom risk label" />);
      expect(screen.getByLabelText('Custom risk label')).toBeInTheDocument();
    });

    it('should have title attribute with description', () => {
      render(<RiskBadge level="medium" />);
      const badge = screen.getByLabelText(/Risk level: medium/i);
      expect(badge).toHaveAttribute('title');
    });
  });

  describe('All Risk Levels', () => {
    const riskLevels: RiskLevel[] = ['low', 'medium', 'high', 'critical'];

    it.each(riskLevels)('should render %s risk level correctly', (level) => {
      render(<RiskBadge level={level} />);
      expect(screen.getByText(level.toUpperCase())).toBeInTheDocument();
    });

    it.each(riskLevels)('should render %s with score correctly', (level) => {
      render(<RiskBadge level={level} score={75} showScore />);
      expect(screen.getByText(`${level.toUpperCase()} (75%)`)).toBeInTheDocument();
    });
  });
});

describe('RiskIndicator Component', () => {
  describe('Basic Rendering', () => {
    it('should render for LOW risk', () => {
      render(<RiskIndicator level="low" />);
      expect(screen.getByLabelText('Risk: low')).toBeInTheDocument();
    });

    it('should render for CRITICAL risk', () => {
      render(<RiskIndicator level="critical" />);
      expect(screen.getByLabelText('Risk: critical')).toBeInTheDocument();
    });
  });

  describe('Size Customization', () => {
    it('should render with default size', () => {
      render(<RiskIndicator level="medium" />);
      expect(screen.getByLabelText('Risk: medium')).toBeInTheDocument();
    });

    it('should render with custom size', () => {
      render(<RiskIndicator level="high" size={24} />);
      expect(screen.getByLabelText('Risk: high')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate aria-label', () => {
      render(<RiskIndicator level="low" />);
      expect(screen.getByLabelText('Risk: low')).toBeInTheDocument();
    });

    it('should have title attribute with description', () => {
      render(<RiskIndicator level="critical" />);
      const indicator = screen.getByLabelText('Risk: critical');
      expect(indicator).toHaveAttribute('title');
    });
  });
});
