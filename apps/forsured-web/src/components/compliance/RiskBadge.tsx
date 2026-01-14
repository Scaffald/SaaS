/**
 * RiskBadge - Risk level badge component using Beyond UI
 * REQ: Phase 5 - Risk Level Algorithm Implementation
 *
 * Displays risk level with appropriate color coding:
 *   LOW (green): Fully compliant
 *   MEDIUM (yellow): Minor gaps
 *   HIGH (orange): Significant gaps
 *   CRITICAL (red): Major violations
 */
import React from 'react';
import { Row, Text } from '@unicornlove/beyond-ui';
import { Chip as Badge } from '@unicornlove/beyond-ui';
import { CheckCircle, AlertCircle, AlertTriangle, XCircle } from 'lucide-react';
import { RiskLevel, riskCalculationService } from '../../lib/compliance/riskCalculationService';

export interface RiskBadgeProps {
  /** The risk level to display */
  level: RiskLevel;
  /** Optional compliance score to show */
  score?: number;
  /** Whether to show the score alongside the level */
  showScore?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the icon */
  showIcon?: boolean;
  /** Additional aria label */
  'aria-label'?: string;
}

function getRiskIcon(level: RiskLevel, size: number = 14) {
  switch (level) {
    case 'low':
      return <CheckCircle size={size} />;
    case 'medium':
      return <AlertCircle size={size} />;
    case 'high':
      return <AlertTriangle size={size} />;
    case 'critical':
      return <XCircle size={size} />;
    default:
      return <AlertCircle size={size} />;
  }
}

const riskVariantMap: Record<RiskLevel, 'success' | 'warning' | 'error' | 'default'> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

const sizeMap: Record<'sm' | 'md' | 'lg', string> = {
  sm: '$1',
  md: '$2',
  lg: '$3',
};

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  showScore = false,
  size = 'md',
  showIcon = true,
  'aria-label': ariaLabel,
}) => {
  const variant = riskVariantMap[level];
  const description = riskCalculationService.getRiskDescription(level);
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 18 : 14;

  const labelText = level.toUpperCase();
  const scoreText = showScore && score !== undefined ? ` (${score}%)` : '';
  const fullLabel = `${labelText}${scoreText}`;

  return (
    <Badge
      variant={variant}
      size={sizeMap[size]}
      aria-label={ariaLabel || `Risk level: ${level} - ${description}`}
      title={description}
    >
      <Row style={{ alignItems: 'center', gap: 4 }}>
        {showIcon && getRiskIcon(level, iconSize)}
        <Text style={{ fontSize: size === 'sm' ? 'var(--font-size-1)' : size === 'lg' ? 'var(--font-size-3)' : 'var(--font-size-2)' }}>
          {fullLabel}
        </Text>
      </Row>
    </Badge>
  );
};

/**
 * Compact risk indicator for tight spaces
 */
export const RiskIndicator: React.FC<{
  level: RiskLevel;
  size?: number;
}> = ({ level, size = 16 }) => {
  const description = riskCalculationService.getRiskDescription(level);
  const color = riskCalculationService.getRiskColor(level);

  return (
    <Row
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label={`Risk: ${level}`}
      title={description}
    >
      {getRiskIcon(level, size * 0.6)}
    </Row>
  );
};

export default RiskBadge;
