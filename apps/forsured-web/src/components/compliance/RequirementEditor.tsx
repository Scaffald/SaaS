/**
 * Compliance Requirements Management System
 * Form-based editor for creating and updating compliance requirements
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Stack, Row, Text, Button, Card } from '@unicornlove/beyond-ui';
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
    return (
      <Stack style={{ alignItems: 'center', paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
        <Text>Loading...</Text>
      </Stack>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack style={{ gap: 'var(--space-6)' }}>
        {errors.general && (
          <Card style={{ backgroundColor: 'var(--color-red-2)', borderColor: 'var(--color-red-5)', borderRadius: 'var(--radius-2)', padding: 'var(--space-4)' }}>
            <Text style={{ color: 'var(--color-red-11)' }}>{errors.general}</Text>
          </Card>
        )}

        {/* Basic Information */}
        <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', boxShadow: '0 2px 8px var(--color-shadow)', padding: 'var(--space-6)' }}>
          <Stack style={{ gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-gray-12)', margin: 0 }}>Basic Information</h3>

            <Stack>
              <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-gray-11)', marginBottom: 4 }}>
                Name <span style={{ color: 'var(--color-red-9)' }}>*</span>
              </Text>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
              {errors.name && <Text style={{ color: 'var(--color-red-9)', fontSize: 'var(--font-size-3)', marginTop: 4 }}>{errors.name}</Text>}
            </Stack>

            <Stack>
              <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-gray-11)', marginBottom: 4 }}>
                Type <span style={{ color: 'var(--color-red-9)' }}>*</span>
              </Text>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CoverageType)}
                disabled={!!requirementId}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <option value={CoverageType.GENERAL_LIABILITY}>General Liability</option>
                <option value={CoverageType.WORKERS_COMP}>Workers Compensation</option>
                <option value={CoverageType.AUTO_LIABILITY}>Auto Liability</option>
                <option value={CoverageType.UMBRELLA}>Umbrella/Excess Liability</option>
                <option value={CoverageType.CUSTOM}>Custom</option>
              </select>
            </Stack>

            <Stack>
              <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-gray-11)', marginBottom: 4 }}>
                Description
              </Text>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </Stack>

            <Row style={{ gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <Stack style={{ flex: 1, minWidth: 200 }}>
                <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-gray-11)', marginBottom: 4 }}>
                  Status
                </Text>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RequirementStatus)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value={RequirementStatus.DRAFT}>Draft</option>
                  <option value={RequirementStatus.ACTIVE}>Active</option>
                  <option value={RequirementStatus.ARCHIVED}>Archived</option>
                </select>
              </Stack>

              {!requirementId && (
                <Row style={{ alignItems: 'center', flex: 1, minWidth: 200 }}>
                  <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                    <input
                      type="checkbox"
                      checked={isTemplate}
                      onChange={(e) => setIsTemplate(e.target.checked)}
                      style={{
                        borderRadius: '4px',
                        border: '1px solid #D1D5DB',
                        accentColor: '#2563EB',
                      }}
                    />
                    <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-gray-11)' }}>Save as template</Text>
                  </Row>
                </Row>
              )}
            </Row>
          </Stack>
        </Card>

        {/* Coverage Limits */}
        <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', boxShadow: '0 2px 8px var(--color-shadow)', padding: 'var(--space-6)' }}>
          <Stack style={{ gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-gray-12)', margin: 0 }}>Coverage Limits</h3>

            <Row style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
              <Stack style={{ flex: 1, minWidth: 200 }}>
                <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-gray-11)', marginBottom: 4 }}>
                  Per Occurrence
                </Text>
                <input
                  type="number"
                  value={perOccurrence}
                  onChange={(e) => setPerOccurrence(e.target.value)}
                  placeholder="1000000"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
                {errors['coverage_limits.per_occurrence'] && (
                  <Text style={{ color: 'var(--color-red-9)', fontSize: 'var(--font-size-3)', marginTop: 4 }}>{errors['coverage_limits.per_occurrence']}</Text>
                )}
              </Stack>

              <Stack style={{ flex: 1, minWidth: 200 }}>
                <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-gray-11)', marginBottom: 4 }}>
                  Aggregate
                </Text>
                <input
                  type="number"
                  value={aggregate}
                  onChange={(e) => setAggregate(e.target.value)}
                  placeholder="2000000"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
                {errors['coverage_limits.aggregate'] && (
                  <Text style={{ color: 'var(--color-red-9)', fontSize: 'var(--font-size-3)', marginTop: 4 }}>{errors['coverage_limits.aggregate']}</Text>
                )}
              </Stack>

              <Stack style={{ flex: 1, minWidth: 200 }}>
                <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-gray-11)', marginBottom: 4 }}>
                  Maximum Deductible
                </Text>
                <input
                  type="number"
                  value={deductibleMax}
                  onChange={(e) => setDeductibleMax(e.target.value)}
                  placeholder="10000"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </Stack>
            </Row>
          </Stack>
        </Card>

        {/* Required Endorsements */}
        <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', boxShadow: '0 2px 8px var(--color-shadow)', padding: 'var(--space-6)' }}>
          <Stack style={{ gap: 'var(--space-4)' }}>
            <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-gray-12)', margin: 0 }}>Required Endorsements</h3>
              <button
                type="button"
                style={{
                  fontSize: 'var(--font-size-3)',
                  color: 'var(--color-blue-9)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={addEndorsement}
              >
                + Add Endorsement
              </button>
            </Row>

            {endorsements.map((endorsement, index) => (
              <Card key={index} style={{ borderColor: 'var(--color-gray-5)', borderRadius: 'var(--radius-2)', padding: 'var(--space-4)' }}>
                <Stack style={{ gap: 'var(--space-3)' }}>
                  <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Stack style={{ flex: 1, gap: 'var(--space-3)' }}>
                      <input
                        type="text"
                        value={endorsement.endorsement_type}
                        onChange={(e) => updateEndorsement(index, 'endorsement_type', e.target.value)}
                        placeholder="Endorsement Type (e.g., Additional Insured)"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          fontSize: '14px',
                        }}
                      />
                      <textarea
                        value={endorsement.description}
                        onChange={(e) => updateEndorsement(index, 'description', e.target.value)}
                        placeholder="Description of what this endorsement must include"
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          fontSize: '14px',
                        }}
                      />
                    </Stack>
                    <button
                      type="button"
                      style={{
                        marginLeft: 8,
                        color: 'var(--color-red-9)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onClick={() => removeEndorsement(index)}
                    >
                      Remove
                    </button>
                  </Row>
                </Stack>
              </Card>
            ))}
            {errors.required_endorsements && (
              <Text style={{ color: 'var(--color-red-9)', fontSize: 'var(--font-size-3)' }}>{errors.required_endorsements}</Text>
            )}
          </Stack>
        </Card>

        {/* Policy Conditions */}
        <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', boxShadow: '0 2px 8px var(--color-shadow)', padding: 'var(--space-6)' }}>
          <Stack style={{ gap: 'var(--space-4)' }}>
            <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-gray-12)', margin: 0 }}>Policy Conditions</h3>
              <button
                type="button"
                style={{
                  fontSize: 'var(--font-size-3)',
                  color: 'var(--color-blue-9)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={addCondition}
              >
                + Add Condition
              </button>
            </Row>

            {conditions.length === 0 ? (
              <Text style={{ color: 'var(--color-gray-9)', fontSize: 'var(--font-size-3)' }}>No conditions specified</Text>
            ) : (
              conditions.map((condition, index) => (
                <Card key={index} style={{ borderColor: 'var(--color-gray-5)', borderRadius: 'var(--radius-2)', padding: 'var(--space-4)' }}>
                  <Stack style={{ gap: 'var(--space-3)' }}>
                    <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Stack style={{ flex: 1, gap: 'var(--space-3)' }}>
                        <input
                          type="text"
                          value={condition.condition_type}
                          onChange={(e) => updateCondition(index, 'condition_type', e.target.value)}
                          placeholder="Condition Type (e.g., Primary & Non-Contributory)"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #D1D5DB',
                            borderRadius: '6px',
                            fontSize: '14px',
                          }}
                        />
                        <textarea
                          value={condition.description}
                          onChange={(e) => updateCondition(index, 'description', e.target.value)}
                          placeholder="Description of this condition"
                          rows={2}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #D1D5DB',
                            borderRadius: '6px',
                            fontSize: '14px',
                          }}
                        />
                      </Stack>
                      <button
                        type="button"
                        style={{
                          marginLeft: 8,
                          color: 'var(--color-red-9)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        onClick={() => removeCondition(index)}
                      >
                        Remove
                      </button>
                    </Row>
                  </Stack>
                </Card>
              ))
            )}
          </Stack>
        </Card>

        {/* Documentation Requirements */}
        <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', boxShadow: '0 2px 8px var(--color-shadow)', padding: 'var(--space-6)' }}>
          <Stack style={{ gap: 'var(--space-4)' }}>
            <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-gray-12)', margin: 0 }}>Documentation Requirements</h3>
              <button
                type="button"
                style={{
                  fontSize: 'var(--font-size-3)',
                  color: 'var(--color-blue-9)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={addDocumentation}
              >
                + Add Document
              </button>
            </Row>

            {documentation.map((doc, index) => (
              <Card key={index} style={{ borderColor: 'var(--color-gray-5)', borderRadius: 'var(--radius-2)', padding: 'var(--space-4)' }}>
                <Row style={{ alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
                  <input
                    type="text"
                    value={doc.document_type}
                    onChange={(e) => updateDocumentation(index, 'document_type', e.target.value)}
                    placeholder="Document Type (e.g., Certificate of Insurance)"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                  <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                    <input
                      type="checkbox"
                      checked={doc.is_required}
                      onChange={(e) => updateDocumentation(index, 'is_required', e.target.checked)}
                      style={{
                        borderRadius: '4px',
                        border: '1px solid #D1D5DB',
                        accentColor: '#2563EB',
                      }}
                    />
                    <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-gray-11)' }}>Required</Text>
                  </Row>
                  <button
                    type="button"
                    style={{
                      color: 'var(--color-red-9)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onClick={() => removeDocumentation(index)}
                  >
                    Remove
                  </button>
                </Row>
              </Card>
            ))}
            {errors.documentation_requirements && (
              <Text style={{ color: 'var(--color-red-9)', fontSize: 'var(--font-size-3)' }}>{errors.documentation_requirements}</Text>
            )}
          </Stack>
        </Card>

        {/* Change Summary (for updates only) */}
        {requirementId && (
          <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', boxShadow: '0 2px 8px var(--color-shadow)', padding: 'var(--space-6)' }}>
            <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-gray-11)', marginBottom: 4 }}>
              Change Summary <span style={{ color: 'var(--color-red-9)' }}>*</span>
            </Text>
            <textarea
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              required
              placeholder="Describe what changed in this version"
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </Card>
        )}

        {/* Actions */}
        <Row style={{ justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
          {onCancel && (
            <Button variant="outlined" onPress={onCancel}>
              Cancel
            </Button>
          )}
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '8px 24px',
              backgroundColor: '#2563EB',
              color: 'white',
              borderRadius: '6px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? 'Saving...' : requirementId ? 'Update Requirement' : 'Create Requirement'}
          </button>
        </Row>
      </Stack>
    </form>
  );
}
