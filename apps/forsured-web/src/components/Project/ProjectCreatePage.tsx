/**
 * Project Create Page
 *
 * Form for creating a new project.
 * Navigates to /manager/projects after successful creation.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, Save } from 'lucide-react';
import { YStack, XStack, Text, H1, Card } from '@unicornlove/ui';
import Button from '../Common/Button';
import { useProjects } from '../../hooks/useProjects';
import type { Project } from '../../types';

type ProjectFormData = Omit<Project, 'id' | 'created_at' | 'updated_at'>;

export default function ProjectCreatePage() {
  const navigate = useNavigate();
  const { createProject } = useProjects();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<ProjectFormData>>({
    name: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    contract_value: undefined,
    project_manager: '',
    compliance_status: 'pending',
    general_liability_required: undefined,
    workers_comp_required: undefined,
    auto_liability_required: undefined,
    umbrella_required: undefined,
    professional_liability_required: undefined,
    waiver_of_subrogation_required: false,
    primary_non_contributory_required: false,
  });

  const handleChange = (field: keyof ProjectFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: keyof ProjectFormData, value: string) => {
    const num = value === '' ? undefined : parseFloat(value);
    setFormData(prev => ({ ...prev, [field]: num }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.start_date || !formData.end_date) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await createProject({
        name: formData.name,
        description: formData.description,
        client_id: '', // TODO: Get from current user's organization
        location: formData.location,
        start_date: formData.start_date,
        end_date: formData.end_date,
        contract_value: formData.contract_value,
        project_manager: formData.project_manager,
        compliance_status: formData.compliance_status || 'pending',
        general_liability_required: formData.general_liability_required,
        workers_comp_required: formData.workers_comp_required,
        auto_liability_required: formData.auto_liability_required,
        umbrella_required: formData.umbrella_required,
        professional_liability_required: formData.professional_liability_required,
        waiver_of_subrogation_required: formData.waiver_of_subrogation_required,
        primary_non_contributory_required: formData.primary_non_contributory_required,
      });

      navigate('/manager/projects');
    } catch (err) {
      console.error('[ProjectCreatePage] Error creating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    backgroundColor: 'var(--background)',
    color: 'var(--color-12)',
    fontSize: '14px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--color-11)',
    marginBottom: '6px',
  };

  return (
    <YStack gap="$6">
      {/* Header */}
      <XStack alignItems="center" gap="$4">
        <Button
          variant="ghost"
          onClick={() => navigate('/manager/projects')}
          leftIcon={ArrowLeft}
          size="sm"
        >
          Back
        </Button>
        <YStack>
          <H1 fontSize="$8" fontWeight="700" color="$color12">
            Create New Project
          </H1>
          <Text color="$color11" fontSize="$3">
            Set up a new project with insurance requirements
          </Text>
        </YStack>
      </XStack>

      {error && (
        <Card padding="$4" backgroundColor="$red2" borderColor="$red6" borderWidth={1} borderRadius="$4">
          <Text color="$red11">{error}</Text>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <YStack gap="$6">
          {/* Basic Info */}
          <Card padding="$6" borderWidth={1} borderColor="$borderColor" borderRadius="$4">
            <XStack alignItems="center" gap="$2" mb="$4">
              <Building size={20} color="var(--color-11)" />
              <Text fontSize="$5" fontWeight="600" color="$color12">
                Project Details
              </Text>
            </XStack>

            <YStack gap="$4">
              <YStack>
                <label style={labelStyle}>
                  Project Name <span style={{ color: 'var(--red-10)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter project name"
                  style={inputStyle}
                  required
                />
              </YStack>

              <YStack>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Project description"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </YStack>

              <XStack gap="$4" flexWrap="wrap">
                <YStack flex={1} minWidth={200}>
                  <label style={labelStyle}>Location</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="Project location"
                    style={inputStyle}
                  />
                </YStack>

                <YStack flex={1} minWidth={200}>
                  <label style={labelStyle}>Project Manager</label>
                  <input
                    type="text"
                    value={formData.project_manager || ''}
                    onChange={(e) => handleChange('project_manager', e.target.value)}
                    placeholder="Project manager name"
                    style={inputStyle}
                  />
                </YStack>
              </XStack>

              <XStack gap="$4" flexWrap="wrap">
                <YStack flex={1} minWidth={200}>
                  <label style={labelStyle}>
                    Start Date <span style={{ color: 'var(--red-10)' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date || ''}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                    style={inputStyle}
                    required
                  />
                </YStack>

                <YStack flex={1} minWidth={200}>
                  <label style={labelStyle}>
                    End Date <span style={{ color: 'var(--red-10)' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.end_date || ''}
                    onChange={(e) => handleChange('end_date', e.target.value)}
                    style={inputStyle}
                    required
                  />
                </YStack>

                <YStack flex={1} minWidth={200}>
                  <label style={labelStyle}>Contract Value</label>
                  <input
                    type="number"
                    value={formData.contract_value || ''}
                    onChange={(e) => handleNumberChange('contract_value', e.target.value)}
                    placeholder="0"
                    style={inputStyle}
                  />
                </YStack>
              </XStack>
            </YStack>
          </Card>

          {/* Insurance Requirements */}
          <Card padding="$6" borderWidth={1} borderColor="$borderColor" borderRadius="$4">
            <Text fontSize="$5" fontWeight="600" color="$color12" mb="$4">
              Insurance Requirements
            </Text>

            <XStack gap="$4" flexWrap="wrap">
              <YStack flex={1} minWidth={200}>
                <label style={labelStyle}>General Liability</label>
                <input
                  type="number"
                  value={formData.general_liability_required || ''}
                  onChange={(e) => handleNumberChange('general_liability_required', e.target.value)}
                  placeholder="Coverage amount"
                  style={inputStyle}
                />
              </YStack>

              <YStack flex={1} minWidth={200}>
                <label style={labelStyle}>Workers Comp</label>
                <input
                  type="number"
                  value={formData.workers_comp_required || ''}
                  onChange={(e) => handleNumberChange('workers_comp_required', e.target.value)}
                  placeholder="Coverage amount"
                  style={inputStyle}
                />
              </YStack>

              <YStack flex={1} minWidth={200}>
                <label style={labelStyle}>Auto Liability</label>
                <input
                  type="number"
                  value={formData.auto_liability_required || ''}
                  onChange={(e) => handleNumberChange('auto_liability_required', e.target.value)}
                  placeholder="Coverage amount"
                  style={inputStyle}
                />
              </YStack>
            </XStack>

            <XStack gap="$4" flexWrap="wrap" mt="$4">
              <YStack flex={1} minWidth={200}>
                <label style={labelStyle}>Umbrella</label>
                <input
                  type="number"
                  value={formData.umbrella_required || ''}
                  onChange={(e) => handleNumberChange('umbrella_required', e.target.value)}
                  placeholder="Coverage amount"
                  style={inputStyle}
                />
              </YStack>

              <YStack flex={1} minWidth={200}>
                <label style={labelStyle}>Professional Liability</label>
                <input
                  type="number"
                  value={formData.professional_liability_required || ''}
                  onChange={(e) => handleNumberChange('professional_liability_required', e.target.value)}
                  placeholder="Coverage amount"
                  style={inputStyle}
                />
              </YStack>
            </XStack>

            <XStack gap="$6" mt="$4">
              <XStack alignItems="center" gap="$2">
                <input
                  type="checkbox"
                  id="waiver_of_subrogation"
                  checked={formData.waiver_of_subrogation_required || false}
                  onChange={(e) => handleChange('waiver_of_subrogation_required', e.target.checked)}
                />
                <label htmlFor="waiver_of_subrogation" style={{ fontSize: '14px', color: 'var(--color-12)' }}>
                  Waiver of Subrogation Required
                </label>
              </XStack>

              <XStack alignItems="center" gap="$2">
                <input
                  type="checkbox"
                  id="primary_non_contributory"
                  checked={formData.primary_non_contributory_required || false}
                  onChange={(e) => handleChange('primary_non_contributory_required', e.target.checked)}
                />
                <label htmlFor="primary_non_contributory" style={{ fontSize: '14px', color: 'var(--color-12)' }}>
                  Primary & Non-Contributory Required
                </label>
              </XStack>
            </XStack>
          </Card>

          {/* Actions */}
          <XStack justifyContent="flex-end" gap="$3">
            <Button
              variant="outline"
              onClick={() => navigate('/manager/projects')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              leftIcon={Save}
              disabled={saving}
            >
              {saving ? 'Creating...' : 'Create Project'}
            </Button>
          </XStack>
        </YStack>
      </form>
    </YStack>
  );
}
