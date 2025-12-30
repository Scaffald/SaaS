/**
 * Requirement Editor Form
 * REQ-2, TASK-14: Form for creating and editing compliance requirements
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
import { YStack, XStack, Text, Button, Card, H3, H4 } from '@unicornlove/ui';
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
    <Button
      type="button"
      onPress={() => toggleSection(section)}
      width="100%"
      padding="$4"
      backgroundColor="$backgroundHover"
      borderRadius="$4"
      hoverStyle={{ backgroundColor: '$background' }}
      borderWidth={0}
      justifyContent="space-between"
    >
      <XStack alignItems="center" gap="$2">
        <Text fontWeight="500" color="$color12">
          {title}
        </Text>
        {count !== undefined && (
          <Text fontSize="$3" color="$color10">
            ({count})
          </Text>
        )}
      </XStack>
      {expandedSections[section] ? (
        <ChevronUp size={20} color="var(--color10)" />
      ) : (
        <ChevronDown size={20} color="var(--color10)" />
      )}
    </Button>
  );

  return (
    <form onSubmit={handleSubmit}>
      <YStack gap="$6">
        {/* Error Alert */}
        {errors.general && (
          <Card padding="$4" backgroundColor="$red2" borderColor="$red5" borderRadius="$4">
            <XStack alignItems="flex-start" gap="$3">
              <AlertCircle color="var(--red9)" size={20} style={{ marginTop: '2px', flexShrink: 0 }} />
              <YStack>
                <Text fontWeight="500" color="$red11">Error saving requirement</Text>
                <Text fontSize="$3" color="$red9" mt="$1">{errors.general}</Text>
              </YStack>
            </XStack>
          </Card>
        )}

        {/* Basic Information */}
        <Card backgroundColor="$background" borderRadius="$4" borderColor="$borderColor" borderWidth={1} overflow="hidden">
          <SectionHeader title="Basic Information" section="basicInfo" />
          {expandedSections.basicInfo && (
            <YStack padding="$4" gap="$4" borderTopWidth={1} borderColor="$borderColor">
              <XStack flexWrap="wrap" gap="$4">
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
              </XStack>

                <XStack flexWrap="wrap" gap="$4">
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
                  <XStack alignItems="center" paddingTop="$6" flex={1} minWidth="200px">
                    <XStack alignItems="center" gap="$2" cursor="pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_template}
                        onChange={(e) => updateField('is_template', e.target.checked)}
                        style={{
                          borderRadius: '4px',
                          border: '1px solid var(--borderColor)',
                          accentColor: 'var(--blue9)',
                        }}
                      />
                      <Text fontSize="$3" color="$color12">Template</Text>
                    </XStack>
                  </XStack>
                </XStack>

              <Textarea
                label="Description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Brief description of this requirement..."
                rows={3}
              />

                <XStack flexWrap="wrap" gap="$4">
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
                </XStack>

                {isEditing && (
                  <Textarea
                    label="Change Summary"
                    value={formData.change_summary}
                    onChange={(e) => updateField('change_summary', e.target.value)}
                    placeholder="Describe the changes being made..."
                    rows={2}
                  />
                )}
              </YStack>
            )}
          </Card>

          {/* Coverage Limits */}
          <Card backgroundColor="$background" borderRadius="$4" borderColor="$borderColor" borderWidth={1} overflow="hidden">
            <SectionHeader title="Coverage Limits" section="coverageLimits" />
            {expandedSections.coverageLimits && (
              <YStack padding="$4" gap="$4" borderTopWidth={1} borderColor="$borderColor">
                <Text fontSize="$3" color="$color10">
                  Specify minimum coverage limits required. Leave blank if not applicable.
                </Text>
                <XStack flexWrap="wrap" gap="$4">
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
                </XStack>
              </YStack>
            )}
          </Card>

          {/* Required Endorsements */}
          <Card backgroundColor="$background" borderRadius="$4" borderColor="$borderColor" borderWidth={1} overflow="hidden">
            <SectionHeader
              title="Required Endorsements"
              section="endorsements"
              count={formData.requirement_definition.required_endorsements.length}
            />
            {expandedSections.endorsements && (
              <YStack padding="$4" gap="$4" borderTopWidth={1} borderColor="$borderColor">
                {formData.requirement_definition.required_endorsements.map((endorsement, index) => (
                  <XStack key={index} alignItems="flex-start" gap="$4" padding="$4" backgroundColor="$backgroundHover" borderRadius="$4">
                    <XStack flex={1} flexWrap="wrap" gap="$4">
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
                      <XStack alignItems="center" paddingTop="$6" flex={1} minWidth="200px">
                        <XStack alignItems="center" gap="$2" cursor="pointer">
                          <input
                            type="checkbox"
                            checked={endorsement.is_mandatory}
                            onChange={(e) => updateEndorsement(index, 'is_mandatory', e.target.checked)}
                            style={{
                              borderRadius: '4px',
                              border: '1px solid var(--borderColor)',
                              accentColor: 'var(--blue9)',
                            }}
                          />
                          <Text fontSize="$3" color="$color12">Mandatory</Text>
                        </XStack>
                      </XStack>
                    </XStack>
                    <Button
                      type="button"
                      onPress={() => removeEndorsement(index)}
                      padding="$2"
                      color="$color10"
                      hoverStyle={{ color: '$red10' }}
                      backgroundColor="transparent"
                      borderWidth={0}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </XStack>
                ))}
                <Button type="button" variant="secondary" size="$2" onPress={addEndorsement}>
                  <XStack alignItems="center" gap="$1">
                    <Plus size={16} />
                    <Text>Add Endorsement</Text>
                  </XStack>
                </Button>
              </YStack>
            )}
          </Card>

          {/* Policy Conditions */}
          <Card backgroundColor="$background" borderRadius="$4" borderColor="$borderColor" borderWidth={1} overflow="hidden">
            <SectionHeader
              title="Policy Conditions"
              section="conditions"
              count={formData.requirement_definition.policy_conditions.length}
            />
            {expandedSections.conditions && (
              <YStack padding="$4" gap="$4" borderTopWidth={1} borderColor="$borderColor">
                {formData.requirement_definition.policy_conditions.map((condition, index) => (
                  <XStack key={index} alignItems="flex-start" gap="$4" padding="$4" backgroundColor="$backgroundHover" borderRadius="$4">
                    <YStack flex={1} gap="$4">
                      <XStack flexWrap="wrap" gap="$4">
                        <Input
                          label="Condition Type"
                          value={condition.type}
                          onChange={(e) => updateCondition(index, 'type', e.target.value)}
                          placeholder="e.g., Deductible, Exclusion"
                        />
                        <XStack alignItems="center" paddingTop="$6" flex={1} minWidth="200px">
                          <XStack alignItems="center" gap="$2" cursor="pointer">
                            <input
                              type="checkbox"
                              checked={condition.is_waivable}
                              onChange={(e) => updateCondition(index, 'is_waivable', e.target.checked)}
                              style={{
                                borderRadius: '4px',
                                border: '1px solid var(--borderColor)',
                                accentColor: 'var(--blue9)',
                              }}
                            />
                            <Text fontSize="$3" color="$color12">Waivable</Text>
                          </XStack>
                        </XStack>
                      </XStack>
                      <Textarea
                        label="Description"
                        value={condition.description}
                        onChange={(e) => updateCondition(index, 'description', e.target.value)}
                        placeholder="Describe the condition..."
                        rows={2}
                      />
                    </YStack>
                    <Button
                      type="button"
                      onPress={() => removeCondition(index)}
                      padding="$2"
                      color="$color10"
                      hoverStyle={{ color: '$red10' }}
                      backgroundColor="transparent"
                      borderWidth={0}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </XStack>
                ))}
                <Button type="button" variant="secondary" size="$2" onPress={addCondition}>
                  <XStack alignItems="center" gap="$1">
                    <Plus size={16} />
                    <Text>Add Condition</Text>
                  </XStack>
                </Button>
              </YStack>
            )}
          </Card>

          {/* Documentation Requirements */}
          <Card backgroundColor="$background" borderRadius="$4" borderColor="$borderColor" borderWidth={1} overflow="hidden">
            <SectionHeader
              title="Documentation Requirements"
              section="documentation"
              count={formData.requirement_definition.documentation_requirements.length}
            />
            {expandedSections.documentation && (
              <YStack padding="$4" gap="$4" borderTopWidth={1} borderColor="$borderColor">
                {formData.requirement_definition.documentation_requirements.map((doc, index) => (
                  <XStack key={index} alignItems="flex-start" gap="$4" padding="$4" backgroundColor="$backgroundHover" borderRadius="$4">
                    <YStack flex={1} gap="$4">
                      <XStack flexWrap="wrap" gap="$4">
                        <Input
                          label="Document Type"
                          value={doc.type}
                          onChange={(e) => updateDocumentationRequirement(index, 'type', e.target.value)}
                          placeholder="e.g., COI, Endorsement Copy"
                        />
                        <XStack alignItems="center" paddingTop="$6" flex={1} minWidth="200px">
                          <XStack alignItems="center" gap="$2" cursor="pointer">
                            <input
                              type="checkbox"
                              checked={doc.is_mandatory}
                              onChange={(e) =>
                                updateDocumentationRequirement(index, 'is_mandatory', e.target.checked)
                              }
                              style={{
                                borderRadius: '4px',
                                border: '1px solid var(--borderColor)',
                                accentColor: 'var(--blue9)',
                              }}
                            />
                            <Text fontSize="$3" color="$color12">Mandatory</Text>
                          </XStack>
                        </XStack>
                      </XStack>
                      <Textarea
                        label="Description"
                        value={doc.description}
                        onChange={(e) => updateDocumentationRequirement(index, 'description', e.target.value)}
                        placeholder="Describe the documentation requirement..."
                        rows={2}
                      />
                    </YStack>
                    <Button
                      type="button"
                      onPress={() => removeDocumentationRequirement(index)}
                      padding="$2"
                      color="$color10"
                      hoverStyle={{ color: '$red10' }}
                      backgroundColor="transparent"
                      borderWidth={0}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </XStack>
                ))}
                <Button type="button" variant="secondary" size="$2" onPress={addDocumentationRequirement}>
                  <XStack alignItems="center" gap="$1">
                    <Plus size={16} />
                    <Text>Add Documentation Requirement</Text>
                  </XStack>
                </Button>
              </YStack>
            )}
          </Card>

          {/* Form Actions */}
          <XStack alignItems="center" justifyContent="flex-end" gap="$3" paddingTop="$4" borderTopWidth={1} borderColor="$borderColor">
            <Button type="button" variant="secondary" onPress={handleCancel} disabled={isSubmitting}>
              <XStack alignItems="center" gap="$2">
                <X size={18} />
                <Text>Cancel</Text>
              </XStack>
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              <XStack alignItems="center" gap="$2">
                <Save size={18} />
                <Text>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Requirement'}</Text>
              </XStack>
            </Button>
          </XStack>
        </YStack>
      </form>
    );
  }

export default RequirementEditorForm;
