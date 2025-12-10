/**
 * REQ-165: Compliance Requirements Management System
 * Template selector for quick requirement creation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ComplianceRequirement, CoverageType } from '../../lib/compliance/types';
import { listRequirements } from '../../lib/compliance/requirementService';

interface TemplateSelectorProps {
  organizationId: string;
  userId: string;
  onSelectTemplate: (template: ComplianceRequirement) => void;
  onCancel?: () => void;
}

export default function TemplateSelector({
  organizationId,
  userId,
  onSelectTemplate,
  onCancel
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<ComplianceRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<CoverageType | 'all'>('all');

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await listRequirements({
        filters: {
          is_template: true,
          organization_id: organizationId
        }
      });

      setTemplates(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  function getTypeIcon(type: CoverageType): string {
    const icons = {
      [CoverageType.GENERAL_LIABILITY]: '🏢',
      [CoverageType.WORKERS_COMP]: '👷',
      [CoverageType.AUTO_LIABILITY]: '🚗',
      [CoverageType.UMBRELLA]: '☂️',
      [CoverageType.CUSTOM]: '✏️'
    };
    return icons[type];
  }

  function getTypeLabel(type: CoverageType): string {
    const labels = {
      [CoverageType.GENERAL_LIABILITY]: 'General Liability',
      [CoverageType.WORKERS_COMP]: 'Workers Comp',
      [CoverageType.AUTO_LIABILITY]: 'Auto Liability',
      [CoverageType.UMBRELLA]: 'Umbrella',
      [CoverageType.CUSTOM]: 'Custom'
    };
    return labels[type];
  }

  function formatCoverage(template: ComplianceRequirement): string {
    const { coverage_limits } = template.requirement_definition;
    if (!coverage_limits.per_occurrence && !coverage_limits.aggregate) {
      return 'Statutory Limits';
    }

    const parts = [];
    if (coverage_limits.per_occurrence) {
      parts.push(`$${(coverage_limits.per_occurrence / 1000000).toFixed(1)}M per occurrence`);
    }
    if (coverage_limits.aggregate) {
      parts.push(`$${(coverage_limits.aggregate / 1000000).toFixed(1)}M aggregate`);
    }
    return parts.join(' / ');
  }

  const filteredTemplates = selectedType === 'all'
    ? templates
    : templates.filter(t => t.type === selectedType);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading templates...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={() => loadTemplates()}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Select a Template</h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Type Filter */}
      <div className="flex space-x-2">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            selectedType === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Types
        </button>
        {Object.values(CoverageType).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedType === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {getTypeIcon(type)} {getTypeLabel(type)}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No templates found for this type.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{getTypeIcon(template.type)}</span>
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  v{template.version}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>

              <p className="text-sm text-gray-600 mb-3">{formatCoverage(template)}</p>

              {template.description && (
                <p className="text-xs text-gray-500 line-clamp-2">{template.description}</p>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 space-y-1">
                  <div>
                    {template.requirement_definition.required_endorsements.length} endorsements
                  </div>
                  <div>
                    {template.requirement_definition.documentation_requirements.filter(d => d.is_required).length} required documents
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <span className="text-sm font-medium text-blue-600">Use Template →</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Custom Option */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow p-6 border-2 border-dashed border-purple-300">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Create Custom Requirement
            </h3>
            <p className="text-sm text-gray-600">
              Build a requirement from scratch with your own specifications
            </p>
          </div>
          <button
            onClick={() => onSelectTemplate({
              id: '',
              name: '',
              type: CoverageType.CUSTOM,
              status: 'draft' as const,
              is_template: false,
              created_by: userId,
              organization_id: organizationId,
              requirement_definition: {
                coverage_limits: {},
                required_endorsements: [],
                policy_conditions: [],
                documentation_requirements: []
              },
              version: 1,
              parent_requirement_id: null,
              effective_date: new Date().toISOString(),
              superseded_date: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              archived_at: null
            })}
            className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            Create Custom
          </button>
        </div>
      </div>
    </div>
  );
}
