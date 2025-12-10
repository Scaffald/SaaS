/**
 * REQ-165: Compliance Requirements Management System
 * Form-based editor for creating and updating compliance requirements
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  CoverageType,
  RequirementStatus,
  CreateComplianceRequirementInput,
  UpdateComplianceRequirementInput,
  RequirementDefinition,
  RequiredEndorsement,
  PolicyCondition,
  DocumentationRequirement,
  ComplianceRequirement
} from '../../lib/compliance/types';
import { validateRequirementDefinition } from '../../lib/compliance/schema';
import { createRequirement, updateRequirement, getRequirement } from '../../lib/compliance/requirementService';

interface RequirementEditorProps {
  organizationId: string;
  userId: string;
  requirementId?: string;
  initialData?: Partial<CreateComplianceRequirementInput>;
  onSave?: (requirement: ComplianceRequirement) => void;
  onCancel?: () => void;
}

export default function RequirementEditor({
  organizationId,
  userId,
  requirementId,
  initialData,
  onSave,
  onCancel
}: RequirementEditorProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<CoverageType>(initialData?.type || CoverageType.GENERAL_LIABILITY);
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState<RequirementStatus>(initialData?.status || RequirementStatus.DRAFT);
  const [isTemplate, setIsTemplate] = useState(initialData?.is_template || false);

  // Coverage limits
  const [perOccurrence, setPerOccurrence] = useState<string>(
    initialData?.requirement_definition?.coverage_limits.per_occurrence?.toString() || ''
  );
  const [aggregate, setAggregate] = useState<string>(
    initialData?.requirement_definition?.coverage_limits.aggregate?.toString() || ''
  );
  const [deductibleMax, setDeductibleMax] = useState<string>(
    initialData?.requirement_definition?.coverage_limits.deductible_max?.toString() || ''
  );

  // Endorsements, conditions, documentation
  const [endorsements, setEndorsements] = useState<RequiredEndorsement[]>(
    initialData?.requirement_definition?.required_endorsements || [{ endorsement_type: '', description: '' }]
  );
  const [conditions, setConditions] = useState<PolicyCondition[]>(
    initialData?.requirement_definition?.policy_conditions || []
  );
  const [documentation, setDocumentation] = useState<DocumentationRequirement[]>(
    initialData?.requirement_definition?.documentation_requirements || [{ document_type: '', is_required: true }]
  );

  const [changeSummary, setChangeSummary] = useState('');

  const loadRequirement = useCallback(async () => {
    if (!requirementId) return;

    try {
      setLoading(true);
      const req = await getRequirement(requirementId);
      if (!req) throw new Error('Requirement not found');

      setName(req.name);
      setType(req.type);
      setDescription(req.description || '');
      setStatus(req.status);
      setIsTemplate(req.is_template);

      setPerOccurrence(req.requirement_definition.coverage_limits.per_occurrence?.toString() || '');
      setAggregate(req.requirement_definition.coverage_limits.aggregate?.toString() || '');
      setDeductibleMax(req.requirement_definition.coverage_limits.deductible_max?.toString() || '');

      setEndorsements(req.requirement_definition.required_endorsements.length > 0
        ? req.requirement_definition.required_endorsements
        : [{ endorsement_type: '', description: '' }]
      );
      setConditions(req.requirement_definition.policy_conditions);
      setDocumentation(req.requirement_definition.documentation_requirements.length > 0
        ? req.requirement_definition.documentation_requirements
        : [{ document_type: '', is_required: true }]
      );
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Failed to load requirement' });
    } finally {
      setLoading(false);
    }
  }, [requirementId]);

  useEffect(() => {
    if (requirementId) {
      loadRequirement();
    }
  }, [requirementId, loadRequirement]);

  function buildRequirementDefinition(): RequirementDefinition {
    const coverage_limits: Record<string, number> = {};
    if (perOccurrence) coverage_limits.per_occurrence = parseFloat(perOccurrence);
    if (aggregate) coverage_limits.aggregate = parseFloat(aggregate);
    if (deductibleMax) coverage_limits.deductible_max = parseFloat(deductibleMax);

    return {
      coverage_limits,
      required_endorsements: endorsements.filter(e => e.endorsement_type && e.description),
      policy_conditions: conditions.filter(c => c.condition_type && c.description),
      documentation_requirements: documentation.filter(d => d.document_type)
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const definition = buildRequirementDefinition();

    // Validate
    const validation = validateRequirementDefinition(definition, type);
    if (!validation.valid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(err => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      return;
    }

    try {
      setSaving(true);

      let result: ComplianceRequirement;

      if (requirementId) {
        // Update existing
        const updates: UpdateComplianceRequirementInput = {
          name,
          description,
          status,
          requirement_definition: definition,
          change_summary: changeSummary || 'Updated requirement',
          effective_date: new Date().toISOString()
        };
        result = await updateRequirement(requirementId, updates);
      } else {
        // Create new
        const input: CreateComplianceRequirementInput = {
          name,
          type,
          description,
          status,
          is_template: isTemplate,
          created_by: userId,
          organization_id: organizationId,
          requirement_definition: definition,
          effective_date: new Date().toISOString()
        };
        result = await createRequirement(input);
      }

      onSave?.(result);
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Failed to save requirement' });
    } finally {
      setSaving(false);
    }
  }

  function addEndorsement() {
    setEndorsements([...endorsements, { endorsement_type: '', description: '' }]);
  }

  function removeEndorsement(index: number) {
    setEndorsements(endorsements.filter((_, i) => i !== index));
  }

  function updateEndorsement(index: number, field: keyof RequiredEndorsement, value: string) {
    const updated = [...endorsements];
    updated[index] = { ...updated[index], [field]: value };
    setEndorsements(updated);
  }

  function addCondition() {
    setConditions([...conditions, { condition_type: '', description: '' }]);
  }

  function removeCondition(index: number) {
    setConditions(conditions.filter((_, i) => i !== index));
  }

  function updateCondition(index: number, field: keyof PolicyCondition, value: string) {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    setConditions(updated);
  }

  function addDocumentation() {
    setDocumentation([...documentation, { document_type: '', is_required: true }]);
  }

  function removeDocumentation(index: number) {
    setDocumentation(documentation.filter((_, i) => i !== index));
  }

  function updateDocumentation(index: number, field: keyof DocumentationRequirement, value: string | boolean) {
    const updated = [...documentation];
    updated[index] = { ...updated[index], [field]: value };
    setDocumentation(updated);
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{errors.general}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type <span className="text-red-600">*</span>
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as CoverageType)}
            disabled={!!requirementId}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={CoverageType.GENERAL_LIABILITY}>General Liability</option>
            <option value={CoverageType.WORKERS_COMP}>Workers Compensation</option>
            <option value={CoverageType.AUTO_LIABILITY}>Auto Liability</option>
            <option value={CoverageType.UMBRELLA}>Umbrella/Excess Liability</option>
            <option value={CoverageType.CUSTOM}>Custom</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RequirementStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={RequirementStatus.DRAFT}>Draft</option>
              <option value={RequirementStatus.ACTIVE}>Active</option>
              <option value={RequirementStatus.ARCHIVED}>Archived</option>
            </select>
          </div>

          {!requirementId && (
            <div className="flex items-center">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isTemplate}
                  onChange={(e) => setIsTemplate(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Save as template</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Coverage Limits */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Coverage Limits</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Per Occurrence
            </label>
            <input
              type="number"
              value={perOccurrence}
              onChange={(e) => setPerOccurrence(e.target.value)}
              placeholder="1000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors['coverage_limits.per_occurrence'] && (
              <p className="text-red-600 text-sm mt-1">{errors['coverage_limits.per_occurrence']}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aggregate
            </label>
            <input
              type="number"
              value={aggregate}
              onChange={(e) => setAggregate(e.target.value)}
              placeholder="2000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors['coverage_limits.aggregate'] && (
              <p className="text-red-600 text-sm mt-1">{errors['coverage_limits.aggregate']}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Deductible
            </label>
            <input
              type="number"
              value={deductibleMax}
              onChange={(e) => setDeductibleMax(e.target.value)}
              placeholder="10000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Required Endorsements */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Required Endorsements</h3>
          <button
            type="button"
            onClick={addEndorsement}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Endorsement
          </button>
        </div>

        {endorsements.map((endorsement, index) => (
          <div key={index} className="border border-gray-200 rounded-md p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  value={endorsement.endorsement_type}
                  onChange={(e) => updateEndorsement(index, 'endorsement_type', e.target.value)}
                  placeholder="Endorsement Type (e.g., Additional Insured)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  value={endorsement.description}
                  onChange={(e) => updateEndorsement(index, 'description', e.target.value)}
                  placeholder="Description of what this endorsement must include"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => removeEndorsement(index)}
                className="ml-2 text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {errors.required_endorsements && (
          <p className="text-red-600 text-sm">{errors.required_endorsements}</p>
        )}
      </div>

      {/* Policy Conditions */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Policy Conditions</h3>
          <button
            type="button"
            onClick={addCondition}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Condition
          </button>
        </div>

        {conditions.length === 0 ? (
          <p className="text-gray-500 text-sm">No conditions specified</p>
        ) : (
          conditions.map((condition, index) => (
            <div key={index} className="border border-gray-200 rounded-md p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    value={condition.condition_type}
                    onChange={(e) => updateCondition(index, 'condition_type', e.target.value)}
                    placeholder="Condition Type (e.g., Primary & Non-Contributory)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    value={condition.description}
                    onChange={(e) => updateCondition(index, 'description', e.target.value)}
                    placeholder="Description of this condition"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeCondition(index)}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Documentation Requirements */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Documentation Requirements</h3>
          <button
            type="button"
            onClick={addDocumentation}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Document
          </button>
        </div>

        {documentation.map((doc, index) => (
          <div key={index} className="border border-gray-200 rounded-md p-4">
            <div className="flex items-center justify-between space-x-3">
              <input
                type="text"
                value={doc.document_type}
                onChange={(e) => updateDocumentation(index, 'document_type', e.target.value)}
                placeholder="Document Type (e.g., Certificate of Insurance)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={doc.is_required}
                  onChange={(e) => updateDocumentation(index, 'is_required', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Required</span>
              </label>
              <button
                type="button"
                onClick={() => removeDocumentation(index)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {errors.documentation_requirements && (
          <p className="text-red-600 text-sm">{errors.documentation_requirements}</p>
        )}
      </div>

      {/* Change Summary (for updates only) */}
      {requirementId && (
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Change Summary <span className="text-red-600">*</span>
          </label>
          <textarea
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
            required
            placeholder="Describe what changed in this version"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {saving ? 'Saving...' : requirementId ? 'Update Requirement' : 'Create Requirement'}
        </button>
      </div>
    </form>
  );
}
