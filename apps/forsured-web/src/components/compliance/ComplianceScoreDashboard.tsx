/**
 * REQ-128: Compliance Rule Evaluation Engine
 * Compliance Score Dashboard Component
 */

import React from 'react';
import { EvaluationResult, ComplianceStatus } from '../../lib/compliance/evaluator';

interface ComplianceScoreDashboardProps {
  evaluation: EvaluationResult;
}

/**
 * Display compliance score with visual indicators
 */
export const ComplianceScoreDashboard: React.FC<ComplianceScoreDashboardProps> = ({
  evaluation
}) => {
  const getStatusColor = (status: ComplianceStatus): string => {
    switch (status) {
      case ComplianceStatus.COMPLIANT:
        return 'text-green-600 bg-green-50 border-green-200';
      case ComplianceStatus.WARNING:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case ComplianceStatus.CRITICAL:
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
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
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Compliance Score</h2>
        <div
          className={`px-4 py-2 rounded-full border-2 font-semibold ${getStatusColor(
            evaluation.status
          )}`}
        >
          {getStatusLabel(evaluation.status)}
        </div>
      </div>

      {/* Score Display */}
      <div className="text-center mb-8">
        <div className={`text-6xl font-bold ${getScoreColor(evaluation.score)}`}>
          {evaluation.score}
        </div>
        <div className="text-gray-500 text-sm mt-2">out of 100</div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-t pt-4">
          <span className="text-gray-600">Total Gaps Identified:</span>
          <span className="font-semibold text-gray-900">{evaluation.gaps.length}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Critical Issues:</span>
          <span className="font-semibold text-red-600">
            {evaluation.gaps.filter((g) => g.severity === 'critical').length}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Warnings:</span>
          <span className="font-semibold text-yellow-600">
            {evaluation.gaps.filter((g) => g.severity === 'warning').length}
          </span>
        </div>

        <div className="flex justify-between items-center border-t pt-4">
          <span className="text-gray-600">Coverage Types Evaluated:</span>
          <span className="font-semibold text-gray-900">
            {evaluation.metadata.coverage_types_evaluated.length}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Requirements Checked:</span>
          <span className="font-semibold text-gray-900">
            {evaluation.metadata.total_requirements_checked}
          </span>
        </div>
      </div>

      {/* Evaluation Metadata */}
      <div className="mt-6 pt-6 border-t text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Evaluated: {new Date(evaluation.evaluated_at).toLocaleString()}</span>
          <span>Duration: {evaluation.metadata.evaluation_duration_ms}ms</span>
        </div>
        <div className="mt-1">
          Engine Version: {evaluation.metadata.rule_engine_version}
        </div>
      </div>
    </div>
  );
};
