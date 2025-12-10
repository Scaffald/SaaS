/**
 * REQ-165: Compliance Requirements Management System
 * Detail view for a single compliance requirement
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ComplianceRequirement,
  CoverageType,
  RequirementStatus
} from '../../lib/compliance/types';
import { getRequirement, getRequirementVersions } from '../../lib/compliance/requirementService';

interface RequirementDetailProps {
  requirementId: string;
  onEdit?: () => void;
  onClose?: () => void;
  onViewVersion?: (versionId: string) => void;
}

export default function RequirementDetail({
  requirementId,
  onEdit,
  onClose,
  onViewVersion
}: RequirementDetailProps) {
  const [requirement, setRequirement] = useState<ComplianceRequirement | null>(null);
  const [versions, setVersions] = useState<ComplianceRequirement[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequirement = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRequirement(requirementId);
      setRequirement(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requirement');
    } finally {
      setLoading(false);
    }
  }, [requirementId]);

  const loadVersions = useCallback(async () => {
    try {
      const data = await getRequirementVersions(requirementId);
      setVersions(data);
    } catch (err) {
      console.error('Failed to load versions:', err);
    }
  }, [requirementId]);

  useEffect(() => {
    loadRequirement();
    loadVersions();
  }, [loadRequirement, loadVersions]);

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  }

  function getTypeLabel(type: CoverageType): string {
    const labels = {
      [CoverageType.GENERAL_LIABILITY]: 'General Liability',
      [CoverageType.WORKERS_COMP]: 'Workers Compensation',
      [CoverageType.AUTO_LIABILITY]: 'Auto Liability',
      [CoverageType.UMBRELLA]: 'Umbrella/Excess Liability',
      [CoverageType.CUSTOM]: 'Custom'
    };
    return labels[type];
  }

  function getStatusBadge(status: RequirementStatus) {
    const colors = {
      [RequirementStatus.ACTIVE]: 'bg-green-100 text-green-800',
      [RequirementStatus.DRAFT]: 'bg-yellow-100 text-yellow-800',
      [RequirementStatus.ARCHIVED]: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading requirement details...</div>
      </div>
    );
  }

  if (error || !requirement) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error: {error || 'Requirement not found'}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  const { requirement_definition } = requirement;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{requirement.name}</h2>
              {getStatusBadge(requirement.status)}
              {requirement.is_template && (
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800">
                  Template
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 space-y-1">
              <div>Type: {getTypeLabel(requirement.type)}</div>
              <div>Version: {requirement.version}</div>
              <div>
                Effective Date: {new Date(requirement.effective_date).toLocaleDateString()}
              </div>
              {requirement.superseded_date && (
                <div className="text-orange-600">
                  Superseded: {new Date(requirement.superseded_date).toLocaleDateString()}
                </div>
              )}
            </div>
            {requirement.description && (
              <p className="mt-4 text-gray-700">{requirement.description}</p>
            )}
          </div>
          <div className="flex space-x-2">
            {onEdit && requirement.status !== RequirementStatus.ARCHIVED && (
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Edit
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Coverage Limits */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage Limits</h3>
        {Object.keys(requirement_definition.coverage_limits).length === 0 ? (
          <p className="text-gray-500">Statutory or per policy</p>
        ) : (
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(requirement_definition.coverage_limits).map(([key, value]) => {
              if (value === undefined) return null;
              return (
                <div key={key}>
                  <dt className="text-sm font-medium text-gray-500 capitalize">
                    {key.replace(/_/g, ' ')}
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">{formatCurrency(value)}</dd>
                </div>
              );
            })}
          </dl>
        )}
      </div>

      {/* Required Endorsements */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Endorsements</h3>
        {requirement_definition.required_endorsements.length === 0 ? (
          <p className="text-gray-500">No endorsements required</p>
        ) : (
          <div className="space-y-4">
            {requirement_definition.required_endorsements.map((endorsement, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium text-gray-900">{endorsement.endorsement_type}</h4>
                <p className="text-sm text-gray-600 mt-1">{endorsement.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Policy Conditions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Policy Conditions</h3>
        {requirement_definition.policy_conditions.length === 0 ? (
          <p className="text-gray-500">No special conditions</p>
        ) : (
          <div className="space-y-4">
            {requirement_definition.policy_conditions.map((condition, index) => (
              <div key={index} className="border-l-4 border-green-500 pl-4">
                <h4 className="font-medium text-gray-900">{condition.condition_type}</h4>
                <p className="text-sm text-gray-600 mt-1">{condition.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documentation Requirements */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentation Requirements</h3>
        {requirement_definition.documentation_requirements.length === 0 ? (
          <p className="text-gray-500">No documentation specified</p>
        ) : (
          <ul className="space-y-2">
            {requirement_definition.documentation_requirements.map((doc, index) => (
              <li key={index} className="flex items-center space-x-2">
                <span className={doc.is_required ? 'text-red-600 font-bold' : 'text-gray-400'}>
                  {doc.is_required ? '* Required' : 'Optional'}
                </span>
                <span className="text-gray-900">{doc.document_type}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Version History */}
      {versions.length > 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showVersions ? 'Hide' : 'Show'} Versions ({versions.length})
            </button>
          </div>
          {showVersions && (
            <div className="space-y-2">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`p-3 border rounded-md ${
                    version.id === requirement.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Version {version.version}</span>
                      {version.id === requirement.id && (
                        <span className="ml-2 text-sm text-blue-600">(Current)</span>
                      )}
                      {version.superseded_date && (
                        <span className="ml-2 text-sm text-gray-500">
                          (Superseded {new Date(version.superseded_date).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                    {onViewVersion && version.id !== requirement.id && (
                      <button
                        onClick={() => onViewVersion(version.id)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View
                      </button>
                    )}
                  </div>
                  {version.change_summary && (
                    <p className="text-sm text-gray-600 mt-1">{version.change_summary}</p>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    Effective: {new Date(version.effective_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
