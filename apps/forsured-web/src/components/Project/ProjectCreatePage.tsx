/**
 * Project Create Page
 *
 * Form for creating a new project.
 * Navigates to /manager/projects after successful creation.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building, Save } from 'lucide-react'
import { Stack, Row, Text, H1, Card, Grid } from '@unicornlove/beyond-ui'
import Button from '../Common/Button'
import { useProjects } from '../../hooks/useProjects'
import type { Project } from '../../types'

// Fixed test organization ID for GC user
// TODO: Get organization_id from user context/auth when available
const TEST_GC_ORG_ID = '20000000-0000-0000-0000-000000000001'

type ProjectFormData = Omit<Project, 'id' | 'created_at' | 'updated_at'>

export default function ProjectCreatePage() {
  const navigate = useNavigate()
  const { createProject } = useProjects()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
  })

  const handleChange = (field: keyof ProjectFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNumberChange = (field: keyof ProjectFormData, value: string) => {
    const num = value === '' ? undefined : parseFloat(value)
    setFormData((prev) => ({ ...prev, [field]: num }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.start_date || !formData.end_date) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      setError(null)

      await createProject({
        name: formData.name,
        description: formData.description,
        organization_id: TEST_GC_ORG_ID,
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
      })

      navigate('/manager/projects')
    } catch (err) {
      console.error('[ProjectCreatePage] Error creating project:', err)
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    backgroundColor: 'var(--background)',
    color: 'var(--color-12)',
    fontSize: '14px',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--color-11)',
    marginBottom: '6px',
  }

  return (
    <Stack style={{ gap: 24 }}>
      {/* Header */}
      <Row style={{ alignItems: 'center', gap: 16 }}>
        <Button
          variant="ghost"
          onPress={() => navigate('/manager/projects')}
          leftIcon={ArrowLeft}
          size="$2"
        >
          Back
        </Button>
      </Row>

      {error && (
        <Card
          style={{
            padding: 16,
            backgroundColor: 'var(--color-red2)',
            border: '1px solid var(--color-red6)',
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'var(--color-red11)' }}>{error}</Text>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <Stack style={{ gap: 24 }}>
          {/* Basic Info */}
          <Card style={{ padding: 24, border: '1px solid var(--color-border)', borderRadius: 8 }}>
            <Row style={{ alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Building size={20} color="var(--color-11)" />
              <Text style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-12)' }}>
                Project Details
              </Text>
            </Row>

            <Stack style={{ gap: 16 }}>
              <Stack>
                <label style={labelStyle}>
                  Project Name <span style={{ color: 'var(--color-red10)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter project name"
                  style={inputStyle}
                  required
                />
              </Stack>

              <Stack>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Project description"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </Stack>

              <Grid columns={{ base: 1, sm: 2 }} gap={16}>
                <Stack>
                  <label style={labelStyle}>Location</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="Project location"
                    style={inputStyle}
                  />
                </Stack>

                <Stack>
                  <label style={labelStyle}>Project Manager</label>
                  <input
                    type="text"
                    value={formData.project_manager || ''}
                    onChange={(e) => handleChange('project_manager', e.target.value)}
                    placeholder="Project manager name"
                    style={inputStyle}
                  />
                </Stack>
              </Grid>

              <Grid columns={{ base: 1, sm: 2, lg: 3 }} gap={16}>
                <Stack>
                  <label style={labelStyle}>
                    Start Date <span style={{ color: 'var(--color-red10)' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date || ''}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                    style={inputStyle}
                    required
                  />
                </Stack>

                <Stack>
                  <label style={labelStyle}>
                    End Date <span style={{ color: 'var(--color-red10)' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.end_date || ''}
                    onChange={(e) => handleChange('end_date', e.target.value)}
                    style={inputStyle}
                    required
                  />
                </Stack>

                <Stack>
                  <label style={labelStyle}>Contract Value</label>
                  <input
                    type="number"
                    value={formData.contract_value || ''}
                    onChange={(e) => handleNumberChange('contract_value', e.target.value)}
                    placeholder="0"
                    style={inputStyle}
                  />
                </Stack>
              </Grid>
            </Stack>
          </Card>

          {/* Insurance Requirements */}
          <Card style={{ padding: 24, border: '1px solid var(--color-border)', borderRadius: 8 }}>
            <Text
              style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-12)', marginBottom: 16 }}
            >
              Insurance Requirements
            </Text>

            <Grid columns={{ base: 1, sm: 2, lg: 3 }} gap={16}>
              <Stack>
                <label style={labelStyle}>General Liability</label>
                <input
                  type="number"
                  value={formData.general_liability_required || ''}
                  onChange={(e) => handleNumberChange('general_liability_required', e.target.value)}
                  placeholder="Coverage amount"
                  style={inputStyle}
                />
              </Stack>

              <Stack>
                <label style={labelStyle}>Workers Comp</label>
                <input
                  type="number"
                  value={formData.workers_comp_required || ''}
                  onChange={(e) => handleNumberChange('workers_comp_required', e.target.value)}
                  placeholder="Coverage amount"
                  style={inputStyle}
                />
              </Stack>

              <Stack>
                <label style={labelStyle}>Auto Liability</label>
                <input
                  type="number"
                  value={formData.auto_liability_required || ''}
                  onChange={(e) => handleNumberChange('auto_liability_required', e.target.value)}
                  placeholder="Coverage amount"
                  style={inputStyle}
                />
              </Stack>
            </Grid>

            <Grid columns={{ base: 1, sm: 2 }} gap={16} style={{ marginTop: 16 }}>
              <Stack>
                <label style={labelStyle}>Umbrella</label>
                <input
                  type="number"
                  value={formData.umbrella_required || ''}
                  onChange={(e) => handleNumberChange('umbrella_required', e.target.value)}
                  placeholder="Coverage amount"
                  style={inputStyle}
                />
              </Stack>

              <Stack>
                <label style={labelStyle}>Professional Liability</label>
                <input
                  type="number"
                  value={formData.professional_liability_required || ''}
                  onChange={(e) =>
                    handleNumberChange('professional_liability_required', e.target.value)
                  }
                  placeholder="Coverage amount"
                  style={inputStyle}
                />
              </Stack>
            </Grid>

            <Row style={{ gap: 24, marginTop: 16 }}>
              <Row style={{ alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="waiver_of_subrogation"
                  checked={formData.waiver_of_subrogation_required || false}
                  onChange={(e) => handleChange('waiver_of_subrogation_required', e.target.checked)}
                />
                <label
                  htmlFor="waiver_of_subrogation"
                  style={{ fontSize: '14px', color: 'var(--color-12)' }}
                >
                  Waiver of Subrogation Required
                </label>
              </Row>

              <Row style={{ alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="primary_non_contributory"
                  checked={formData.primary_non_contributory_required || false}
                  onChange={(e) =>
                    handleChange('primary_non_contributory_required', e.target.checked)
                  }
                />
                <label
                  htmlFor="primary_non_contributory"
                  style={{ fontSize: '14px', color: 'var(--color-12)' }}
                >
                  Primary & Non-Contributory Required
                </label>
              </Row>
            </Row>
          </Card>

          {/* Actions */}
          <Row style={{ justifyContent: 'flex-end', gap: 12 }}>
            <Button
              variant="outline"
              onPress={() => navigate('/manager/projects')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" leftIcon={Save} disabled={saving}>
              {saving ? 'Creating...' : 'Create Project'}
            </Button>
          </Row>
        </Stack>
      </form>
    </Stack>
  )
}
