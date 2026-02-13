/**
 * Requirement Editor Form
 * Form for creating and editing compliance requirements
 *
 * Features:
 * - Basic requirement information (code, name, type, status)
 * - Coverage limits configuration
 * - Required endorsements management
 * - Policy conditions
 * - Documentation requirements
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Stack, Row, Text, Button, Card } from '@scaffald/ui';
import {
  useCreateComplianceRequirement,
  useUpdateComplianceRequirement,
  type CoverageType,
  type RequirementStatus,
  type RequirementDefinition,
  type ComplianceRequirement,
} from '../../hooks/useComplianceRequirements';
import Input from '../Common/Input';
import Textarea from '../Common/Textarea';
import Select from '../Common/Select';

// Coverage type options
const coverageTypeOptions: { value: CoverageType; label: string }[] = [
  { value: 'general_liability', label: 'General Liability' },
  { value: 'umbrella_liability', label: 'Umbrella Liability' },
  { value: 'auto_liability', label: 'Auto Liability' },
  { value: 'workers_comp', label: 'Workers Compensation' },
  { value: 'professional_liability', label: 'Professional Liability' },
  { value: 'excess_liability', label: 'Excess Liability' },
];

// Status options
const statusOptions: { value: RequirementStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'active', label: 'Active' },
  { value: 'deprecated', label: 'Deprecated' },
];

// Default empty requirement definition
const emptyRequirementDefinition: RequirementDefinition = {
  coverage_limits: {},
  required_endorsements: [],
  policy_conditions: [],
  documentation_requirements: [],
};

interface RequirementEditorFormProps {
  organizationId: string;
  requirement?: ComplianceRequirement;
  isTemplate?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormData {
  code: string;
  name: string;
  type: CoverageType;
  description: string;
  status: RequirementStatus;
  is_template: boolean;
  effective_date: string;
  expiration_date: string;
  requirement_definition: RequirementDefinition;
  change_summary: string;
}

interface FormErrors {
  code?: string;
  name?: string;
  type?: string;
  effective_date?: string;
  general?: string;
}

export function RequirementEditorForm({
  organizationId,
  requirement,
  isTemplate = false,
  onSuccess,
  onCancel,
}: RequirementEditorFormProps) {
  const navigate = useNavigate();
  const isEditing = !!requirement;

  const createMutation = useCreateComplianceRequirement();
  const updateMutation = useUpdateComplianceRequirement();

  // Initialize form data
  const [formData, setFormData] = useState<FormData>(() => {
    if (requirement) {
      return {
        code: requirement.code,
        name: requirement.name,
        type: requirement.type,
        description: requirement.description || '',
        status: requirement.status,
        is_template: requirement.is_template,
        effective_date: requirement.effective_date,
        expiration_date: requirement.expiration_date || '',
        requirement_definition: requirement.requirement_definition || emptyRequirementDefinition,
        change_summary: '',
      };
    }

    return {
      code: '',
      name: '',
      type: 'general_liability',
      description: '',
      status: 'draft',
      is_template: isTemplate,
      effective_date: new Date().toISOString().split('T')[0],
      expiration_date: '',
      requirement_definition: emptyRequirementDefinition,
      change_summary: '',
    };
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    coverageLimits: true,
    endorsements: false,
    conditions: false,
    documentation: false,
  });

  // Section toggle
  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  // Form field updates
  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
  }, []);

  // Coverage limits updates
  const updateCoverageLimit = useCallback((key: string, value: number | undefined) => {
    setFormData((prev) => ({
      ...prev,
      requirement_definition: {
        ...prev.requirement_definition,
        coverage_limits: {
          ...prev.requirement_definition.coverage_limits,
          [key]: value,
        },
      },
    }));
  }, []);

  // Endorsements management
  const addEndorsement = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      requirement_definition: {
        ...prev.requirement_definition,
        required_endorsements: [
          ...prev.requirement_definition.required_endorsements,
          { code: '', name: '', is_mandatory: true },
        ],
      },
    }));
  }, []);

  const updateEndorsement = useCallback((index: number, field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      requirement_definition: {
        ...prev.requirement_definition,
        required_endorsements: prev.requirement_definition.required_endorsements.map(
          (e, i) => (i === index ? { ...e, [field]: value } : e)
        ),
      },
    }));
  }, []);

  const removeEndorsement = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      requirement_definition: {
        ...prev.requirement_definition,
        required_endorsements: prev.requirement_definition.required_endorsements.filter(
          (_, i) => i !== index
        ),
      },
    }));
  }, []);

  // Policy conditions management
  const addCondition = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      requirement_definition: {
        ...prev.requirement_definition,
        policy_conditions: [
          ...prev.requirement_definition.policy_conditions,
          { type: '', description: '', is_waivable: false },
        ],
      },
    }));
  }, []);

  const updateCondition = useCallback((index: number, field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      requirement_definition: {
        ...prev.requirement_definition,
        policy_conditions: prev.requirement_definition.policy_conditions.map(
          (c, i) => (i === index ? { ...c, [field]: value } : c)
        ),
      },
    }));
  }, []);

  const removeCondition = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      requirement_definition: {
        ...prev.requirement_definition,
        policy_conditions: prev.requirement_definition.policy_conditions.filter(
          (_, i) => i !== index
        ),
      },
    }));
  }, []);

  // Documentation requirements management
  const addDocumentationRequirement = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      requirement_definition: {
        ...prev.requirement_definition,
        documentation_requirements: [
          ...prev.requirement_definition.documentation_requirements,
          { type: '', description: '', is_mandatory: true },
        ],
      },
    }));
  }, []);

  const updateDocumentationRequirement = useCallback((index: number, field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      requirement_definition: {
        ...prev.requirement_definition,
        documentation_requirements: prev.requirement_definition.documentation_requirements.map(
          (d, i) => (i === index ? { ...d, [field]: value } : d)
        ),
      },
    }));
  }, []);

  const removeDocumentationRequirement = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      requirement_definition: {
        ...prev.requirement_definition,
        documentation_requirements: prev.requirement_definition.documentation_requirements.filter(
          (_, i) => i !== index
        ),
      },
    }));
  }, []);

  // Validation
  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Code is required';
    } else if (!/^[A-Z0-9-]+$/i.test(formData.code)) {
      newErrors.code = 'Code must be alphanumeric with dashes only';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.effective_date) {
      newErrors.effective_date = 'Effective date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      if (isEditing && requirement) {
        await updateMutation.mutateAsync({
          organizationId,
          requirementId: requirement.id,
          name: formData.name,
          type: formData.type,
          description: formData.description || undefined,
          status: formData.status,
          is_template: formData.is_template,
          effective_date: formData.effective_date,
          expiration_date: formData.expiration_date || undefined,
          requirement_definition: formData.requirement_definition,
          change_summary: formData.change_summary || 'Updated requirement',
        });
      } else {
        await createMutation.mutateAsync({
          organizationId,
          code: formData.code,
          name: formData.name,
          type: formData.type,
          description: formData.description || undefined,
          status: formData.status,
          is_template: formData.is_template,
          effective_date: formData.effective_date,
          expiration_date: formData.expiration_date || undefined,
          requirement_definition: formData.requirement_definition,
          change_summary: formData.change_summary || 'Initial version',
        });
      }

      onSuccess?.();
      navigate('/admin/compliance/requirements');
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : 'An error occurred while saving',
      });
    }
  }, [
    formData,
    validate,
    isEditing,
    requirement,
    organizationId,
    createMutation,
    updateMutation,
    onSuccess,
    navigate,
  ]);

  const handleCancel = useCallback(() => {
    onCancel?.();
    navigate('/admin/compliance/requirements');
  }, [onCancel, navigate]);

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading;

  // Section header component
  const SectionHeader = ({
    title,
    section,
    count,
  }: {
    title: string;
    section: keyof typeof expandedSections;
    count?: number;
  }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      style={{
        width: '100%',
        padding: 'var(--space-4)',
        backgroundColor: 'var(--color-background-hover)',
        borderRadius: 'var(--radius-4)',
        border: 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
      }}
    >
      <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
        <Text style={{ fontWeight: 500, color: 'var(--color-12)' }}>
          {title}
        </Text>
        {count !== undefined && (
          <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>
            ({count})
          </Text>
        )}
      </Row>
      {expandedSections[section] ? (
        <ChevronUp size={20} color="var(--color-10)" />
      ) : (
        <ChevronDown size={20} color="var(--color-10)" />
      )}
    </button>
  );

  return (
    <form onSubmit={handleSubmit}>
      <Stack style={{ gap: 'var(--space-6)' }}>
        {/* Error Alert */}
        {errors.general && (
          <Card style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-red-2)', borderColor: 'var(--color-red-5)', borderRadius: 'var(--radius-4)' }}>
            <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              <AlertCircle color="var(--color-red-9)" size={20} style={{ marginTop: '2px', flexShrink: 0 }} />
              <Stack>
                <Text style={{ fontWeight: 500, color: 'var(--color-red-11)' }}>Error saving requirement</Text>
                <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-red-9)', marginTop: 4 }}>{errors.general}</Text>
              </Stack>
            </Row>
          </Card>
        )}

        {/* Basic Information */}
        <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', borderColor: 'var(--color-border)', borderWidth: 1, borderStyle: 'solid', overflow: 'hidden' }}>
          <SectionHeader title="Basic Information" section="basicInfo" />
          {expandedSections.basicInfo && (
            <Stack style={{ padding: 'var(--space-4)', gap: 'var(--space-4)', borderTopWidth: 1, borderTopStyle: 'solid', borderColor: 'var(--color-border)' }}>
              <Row style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <Input
                  label="Code"
                  value={formData.code}
                  onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                  placeholder="e.g., GL-001"
                  error={errors.code}
                  disabled={isEditing}
                  required
                />
                <Input
                  label="Name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g., General Liability $1M/$2M"
                  error={errors.name}
                  required
                />
              </Row>

              <Row style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <Select
                  label="Coverage Type"
                  value={formData.type}
                  onChange={(e) => updateField('type', e.target.value as CoverageType)}
                  options={coverageTypeOptions}
                />
                <Select
                  label="Status"
                  value={formData.status}
                  onChange={(e) => updateField('status', e.target.value as RequirementStatus)}
                  options={statusOptions}
                />
                <Row style={{ alignItems: 'center', paddingTop: 'var(--space-6)', flex: 1, minWidth: 200 }}>
                  <Row style={{ alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_template}
                      onChange={(e) => updateField('is_template', e.target.checked)}
                      style={{
                        borderRadius: '4px',
                        border: '1px solid var(--color-border)',
                        accentColor: 'var(--color-blue-9)',
                      }}
                    />
                    <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-12)' }}>Template</Text>
                  </Row>
                </Row>
              </Row>

              <Textarea
                label="Description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Brief description of this requirement..."
                rows={3}
              />

              <Row style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <Input
                  label="Effective Date"
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) => updateField('effective_date', e.target.value)}
                  error={errors.effective_date}
                  required
                />
                <Input
                  label="Expiration Date"
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) => updateField('expiration_date', e.target.value)}
                />
              </Row>

              {isEditing && (
                <Textarea
                  label="Change Summary"
                  value={formData.change_summary}
                  onChange={(e) => updateField('change_summary', e.target.value)}
                  placeholder="Describe the changes being made..."
                  rows={2}
                />
              )}
            </Stack>
          )}
        </Card>

        {/* Coverage Limits */}
        <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', borderColor: 'var(--color-border)', borderWidth: 1, borderStyle: 'solid', overflow: 'hidden' }}>
          <SectionHeader title="Coverage Limits" section="coverageLimits" />
          {expandedSections.coverageLimits && (
            <Stack style={{ padding: 'var(--space-4)', gap: 'var(--space-4)', borderTopWidth: 1, borderTopStyle: 'solid', borderColor: 'var(--color-border)' }}>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>
                Specify minimum coverage limits required. Leave blank if not applicable.
              </Text>
              <Row style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <Input
                  label="Per Occurrence"
                  type="number"
                  value={formData.requirement_definition.coverage_limits.per_occurrence || ''}
                  onChange={(e) =>
                    updateCoverageLimit(
                      'per_occurrence',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  placeholder="e.g., 1000000"
                />
                <Input
                  label="Aggregate"
                  type="number"
                  value={formData.requirement_definition.coverage_limits.aggregate || ''}
                  onChange={(e) =>
                    updateCoverageLimit(
                      'aggregate',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  placeholder="e.g., 2000000"
                />
                <Input
                  label="Products/Completed Ops"
                  type="number"
                  value={formData.requirement_definition.coverage_limits.products_completed_ops || ''}
                  onChange={(e) =>
                    updateCoverageLimit(
                      'products_completed_ops',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  placeholder="e.g., 2000000"
                />
                <Input
                  label="Personal/Advertising Injury"
                  type="number"
                  value={formData.requirement_definition.coverage_limits.personal_advertising_injury || ''}
                  onChange={(e) =>
                    updateCoverageLimit(
                      'personal_advertising_injury',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  placeholder="e.g., 1000000"
                />
                <Input
                  label="Each Employee (WC)"
                  type="number"
                  value={formData.requirement_definition.coverage_limits.each_employee || ''}
                  onChange={(e) =>
                    updateCoverageLimit(
                      'each_employee',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  placeholder="e.g., 1000000"
                />
                <Input
                  label="Policy Limit (WC)"
                  type="number"
                  value={formData.requirement_definition.coverage_limits.policy_limit || ''}
                  onChange={(e) =>
                    updateCoverageLimit(
                      'policy_limit',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  placeholder="e.g., 1000000"
                />
              </Row>
            </Stack>
          )}
        </Card>

        {/* Required Endorsements */}
        <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', borderColor: 'var(--color-border)', borderWidth: 1, borderStyle: 'solid', overflow: 'hidden' }}>
          <SectionHeader
            title="Required Endorsements"
            section="endorsements"
            count={formData.requirement_definition.required_endorsements.length}
          />
          {expandedSections.endorsements && (
            <Stack style={{ padding: 'var(--space-4)', gap: 'var(--space-4)', borderTopWidth: 1, borderTopStyle: 'solid', borderColor: 'var(--color-border)' }}>
              {formData.requirement_definition.required_endorsements.map((endorsement, index) => (
                <Row key={index} style={{ alignItems: 'flex-start', gap: 'var(--space-4)', padding: 'var(--space-4)', backgroundColor: 'var(--color-background-hover)', borderRadius: 'var(--radius-4)' }}>
                  <Row style={{ flex: 1, flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                    <Input
                      label="Endorsement Code"
                      value={endorsement.code}
                      onChange={(e) => updateEndorsement(index, 'code', e.target.value)}
                      placeholder="e.g., CG 20 10"
                    />
                    <Input
                      label="Name"
                      value={endorsement.name}
                      onChange={(e) => updateEndorsement(index, 'name', e.target.value)}
                      placeholder="e.g., Additional Insured"
                    />
                    <Row style={{ alignItems: 'center', paddingTop: 'var(--space-6)', flex: 1, minWidth: 200 }}>
                      <Row style={{ alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={endorsement.is_mandatory}
                          onChange={(e) => updateEndorsement(index, 'is_mandatory', e.target.checked)}
                          style={{
                            borderRadius: '4px',
                            border: '1px solid var(--color-border)',
                            accentColor: 'var(--color-blue-9)',
                          }}
                        />
                        <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-12)' }}>Mandatory</Text>
                      </Row>
                    </Row>
                  </Row>
                  <button
                    type="button"
                    onClick={() => removeEndorsement(index)}
                    style={{
                      padding: 'var(--space-2)',
                      color: 'var(--color-10)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </Row>
              ))}
              <Button type="button" variant="secondary" size="$2" onPress={addEndorsement}>
                <Row style={{ alignItems: 'center', gap: 4 }}>
                  <Plus size={16} />
                  <Text>Add Endorsement</Text>
                </Row>
              </Button>
            </Stack>
          )}
        </Card>

        {/* Policy Conditions */}
        <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', borderColor: 'var(--color-border)', borderWidth: 1, borderStyle: 'solid', overflow: 'hidden' }}>
          <SectionHeader
            title="Policy Conditions"
            section="conditions"
            count={formData.requirement_definition.policy_conditions.length}
          />
          {expandedSections.conditions && (
            <Stack style={{ padding: 'var(--space-4)', gap: 'var(--space-4)', borderTopWidth: 1, borderTopStyle: 'solid', borderColor: 'var(--color-border)' }}>
              {formData.requirement_definition.policy_conditions.map((condition, index) => (
                <Row key={index} style={{ alignItems: 'flex-start', gap: 'var(--space-4)', padding: 'var(--space-4)', backgroundColor: 'var(--color-background-hover)', borderRadius: 'var(--radius-4)' }}>
                  <Stack style={{ flex: 1, gap: 'var(--space-4)' }}>
                    <Row style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                      <Input
                        label="Condition Type"
                        value={condition.type}
                        onChange={(e) => updateCondition(index, 'type', e.target.value)}
                        placeholder="e.g., Deductible, Exclusion"
                      />
                      <Row style={{ alignItems: 'center', paddingTop: 'var(--space-6)', flex: 1, minWidth: 200 }}>
                        <Row style={{ alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={condition.is_waivable}
                            onChange={(e) => updateCondition(index, 'is_waivable', e.target.checked)}
                            style={{
                              borderRadius: '4px',
                              border: '1px solid var(--color-border)',
                              accentColor: 'var(--color-blue-9)',
                            }}
                          />
                          <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-12)' }}>Waivable</Text>
                        </Row>
                      </Row>
                    </Row>
                    <Textarea
                      label="Description"
                      value={condition.description}
                      onChange={(e) => updateCondition(index, 'description', e.target.value)}
                      placeholder="Describe the condition..."
                      rows={2}
                    />
                  </Stack>
                  <button
                    type="button"
                    onClick={() => removeCondition(index)}
                    style={{
                      padding: 'var(--space-2)',
                      color: 'var(--color-10)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </Row>
              ))}
              <Button type="button" variant="secondary" size="$2" onPress={addCondition}>
                <Row style={{ alignItems: 'center', gap: 4 }}>
                  <Plus size={16} />
                  <Text>Add Condition</Text>
                </Row>
              </Button>
            </Stack>
          )}
        </Card>

        {/* Documentation Requirements */}
        <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', borderColor: 'var(--color-border)', borderWidth: 1, borderStyle: 'solid', overflow: 'hidden' }}>
          <SectionHeader
            title="Documentation Requirements"
            section="documentation"
            count={formData.requirement_definition.documentation_requirements.length}
          />
          {expandedSections.documentation && (
            <Stack style={{ padding: 'var(--space-4)', gap: 'var(--space-4)', borderTopWidth: 1, borderTopStyle: 'solid', borderColor: 'var(--color-border)' }}>
              {formData.requirement_definition.documentation_requirements.map((doc, index) => (
                <Row key={index} style={{ alignItems: 'flex-start', gap: 'var(--space-4)', padding: 'var(--space-4)', backgroundColor: 'var(--color-background-hover)', borderRadius: 'var(--radius-4)' }}>
                  <Stack style={{ flex: 1, gap: 'var(--space-4)' }}>
                    <Row style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                      <Input
                        label="Document Type"
                        value={doc.type}
                        onChange={(e) => updateDocumentationRequirement(index, 'type', e.target.value)}
                        placeholder="e.g., COI, Endorsement Copy"
                      />
                      <Row style={{ alignItems: 'center', paddingTop: 'var(--space-6)', flex: 1, minWidth: 200 }}>
                        <Row style={{ alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={doc.is_mandatory}
                            onChange={(e) =>
                              updateDocumentationRequirement(index, 'is_mandatory', e.target.checked)
                            }
                            style={{
                              borderRadius: '4px',
                              border: '1px solid var(--color-border)',
                              accentColor: 'var(--color-blue-9)',
                            }}
                          />
                          <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-12)' }}>Mandatory</Text>
                        </Row>
                      </Row>
                    </Row>
                    <Textarea
                      label="Description"
                      value={doc.description}
                      onChange={(e) => updateDocumentationRequirement(index, 'description', e.target.value)}
                      placeholder="Describe the documentation requirement..."
                      rows={2}
                    />
                  </Stack>
                  <button
                    type="button"
                    onClick={() => removeDocumentationRequirement(index)}
                    style={{
                      padding: 'var(--space-2)',
                      color: 'var(--color-10)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </Row>
              ))}
              <Button type="button" variant="secondary" size="$2" onPress={addDocumentationRequirement}>
                <Row style={{ alignItems: 'center', gap: 4 }}>
                  <Plus size={16} />
                  <Text>Add Documentation Requirement</Text>
                </Row>
              </Button>
            </Stack>
          )}
        </Card>

        {/* Form Actions */}
        <Row style={{ alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingTop: 'var(--space-4)', borderTopWidth: 1, borderTopStyle: 'solid', borderColor: 'var(--color-border)' }}>
          <Button type="button" variant="secondary" onPress={handleCancel} disabled={isSubmitting}>
            <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
              <X size={18} />
              <Text>Cancel</Text>
            </Row>
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
              <Save size={18} />
              <Text>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Requirement'}</Text>
            </Row>
          </Button>
        </Row>
      </Stack>
    </form>
  );
}

export default RequirementEditorForm;
