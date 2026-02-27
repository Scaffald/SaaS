/**
 * Compliance Rule Evaluation Engine
 * Compliance Score Dashboard Component
 */

import React from 'react';
import { Stack, Row, Text, H2, Card } from '@scaffald/ui';
import type { EvaluationResult } from '../../lib/compliance/evaluator';
import { ComplianceStatus } from '../../lib/compliance/evaluator/types';

interface ComplianceScoreDashboardProps {
  evaluation: EvaluationResult;
}

/**
 * Display compliance score with visual indicators
 */
export const ComplianceScoreDashboard = ({
  evaluation
}: ComplianceScoreDashboardProps) => {
  const getStatusColorProps = (status: ComplianceStatus): React.CSSProperties => {
    switch (status) {
      case ComplianceStatus.COMPLIANT:
        return {
          color: 'var(--color-green10)',
          backgroundColor: 'var(--color-green2)',
          borderColor: 'var(--color-green6)',
        };
      case ComplianceStatus.WARNING:
        return {
          color: 'var(--color-yellow10)',
          backgroundColor: 'var(--color-yellow2)',
          borderColor: 'var(--color-yellow6)',
        };
      case ComplianceStatus.CRITICAL:
        return {
          color: 'var(--color-red10)',
          backgroundColor: 'var(--color-red2)',
          borderColor: 'var(--color-red6)',
        };
      default:
        return {
          color: 'var(--color-gray10)',
          backgroundColor: 'var(--color-gray2)',
          borderColor: 'var(--color-gray6)',
        };
    }
  };

  const getStatusLabel = (status: ComplianceStatus): string => {
    switch (status) {
      case ComplianceStatus.COMPLIANT:
        return 'Compliant';
      case ComplianceStatus.WARNING:
        return 'Needs Attention';
      case ComplianceStatus.CRITICAL:
        return 'Critical Issues';
      default:
        return 'Unknown';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'var(--color-green10)';
    if (score >= 70) return 'var(--color-yellow10)';
    return 'var(--color-red10)';
  };

  const statusColorProps = getStatusColorProps(evaluation.status);

  return (
    <Card style={{ padding: '24px', borderRadius: '8px' }}>
      <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <H2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--color-color12)' }}>
          Compliance Score
        </H2>
        <Row
          style={{
            paddingLeft: '16px',
            paddingRight: '16px',
            paddingTop: '8px',
            paddingBottom: '8px',
            borderRadius: '9999px',
            borderWidth: '2px',
            borderStyle: 'solid',
            fontWeight: 600,
            ...statusColorProps,
          }}
        >
          <Text style={{ ...statusColorProps, fontWeight: 600 }}>
            {getStatusLabel(evaluation.status)}
          </Text>
        </Row>
      </Row>

      {/* Score Display */}
      <Stack style={{ alignItems: 'center', marginBottom: '32px' }}>
        <Text style={{ fontSize: '36px', fontWeight: 'bold', color: getScoreColor(evaluation.score) }}>
          {evaluation.score}
        </Text>
        <Text style={{ color: 'var(--color-color10)', fontSize: '12px', marginTop: '8px' }}>
          out of 100
        </Text>
      </Stack>

      {/* Score Breakdown */}
      <Stack style={{ gap: '16px' }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center', borderTopWidth: '1px', borderTopStyle: 'solid', borderColor: 'var(--color-border)', paddingTop: '16px' }}>
          <Text style={{ color: 'var(--color-color10)' }}>Total Gaps Identified:</Text>
          <Text style={{ fontWeight: 600, color: 'var(--color-color12)' }}>
            {evaluation.gaps.length}
          </Text>
        </Row>

        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: 'var(--color-color10)' }}>Critical Issues:</Text>
          <Text style={{ fontWeight: 600, color: 'var(--color-red10)' }}>
            {evaluation.gaps.filter((g) => g.severity === 'critical').length}
          </Text>
        </Row>

        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: 'var(--color-color10)' }}>Warnings:</Text>
          <Text style={{ fontWeight: 600, color: 'var(--color-yellow10)' }}>
            {evaluation.gaps.filter((g) => g.severity === 'warning').length}
          </Text>
        </Row>

        <Row style={{ justifyContent: 'space-between', alignItems: 'center', borderTopWidth: '1px', borderTopStyle: 'solid', borderColor: 'var(--color-border)', paddingTop: '16px' }}>
          <Text style={{ color: 'var(--color-color10)' }}>Coverage Types Evaluated:</Text>
          <Text style={{ fontWeight: 600, color: 'var(--color-color12)' }}>
            {evaluation.metadata.coverage_types_evaluated.length}
          </Text>
        </Row>

        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: 'var(--color-color10)' }}>Requirements Checked:</Text>
          <Text style={{ fontWeight: 600, color: 'var(--color-color12)' }}>
            {evaluation.metadata.total_requirements_checked}
          </Text>
        </Row>
      </Stack>

      {/* Evaluation Metadata */}
      <Stack style={{ marginTop: '24px', paddingTop: '24px', borderTopWidth: '1px', borderTopStyle: 'solid', borderColor: 'var(--color-border)' }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={{ fontSize: '10px', color: 'var(--color-color10)' }}>
            Evaluated: {new Date(evaluation.evaluated_at).toLocaleString()}
          </Text>
          <Text style={{ fontSize: '10px', color: 'var(--color-color10)' }}>
            Duration: {evaluation.metadata.evaluation_duration_ms}ms
          </Text>
        </Row>
        <Text style={{ fontSize: '10px', color: 'var(--color-color10)', marginTop: '4px' }}>
          Engine Version: {evaluation.metadata.rule_engine_version}
        </Text>
      </Stack>
    </Card>
  );
};
