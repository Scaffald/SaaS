/**
 * REQ-263: Org-Level vs Project-Level Coverage Distinction
 * TASK-4: Build Project-Level Coverage Requirements UI
 *
 * Settings interface for managing project-level coverage limit requirements.
 * Shows requirements with "PROJECT" badge and supports add/edit/delete operations.
 * Accessible to admins and project managers.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Shield,
  FolderKanban,
  DollarSign,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { Stack, Row, Text, H1, H2, Card, Button } from '@unicornlove/beyond-ui';
import ButtonCommon from '../Common/Button';
import CardCommon from '../Common/Card';
import Modal from '../Common/Modal';
import Select from '../Common/Select';
import CoverageRequirementForm, { CoverageRequirementFormData } from './CoverageRequirementForm';
import {
  CoverageLimitRequirement,
  CoverageLimitType,
  CreateCoverageLimitRequirementRequest,
  UpdateCoverageLimitRequirementRequest,
} from '../../types';
import {
  getProjectLevelRequirements,
  getOrgLevelRequirements,
  createCoverageLimitRequirement,
  updateCoverageLimitRequirement,
  deleteCoverageLimitRequirement,
  canManageProjectLevel,
  VALID_COVERAGE_TYPES,
  UserContext,
} from '../../lib/coverageRequirements/coverageLimitRequirementService';

// Coverage type display config
const COVERAGE_TYPE_CONFIG: Record<CoverageLimitType, { label: string; shortLabel: string }> = {
  general_liability: { label: 'General Liability', shortLabel: 'GL' },
  workers_comp: { label: "Workers' Compensation", shortLabel: 'WC' },
  commercial_auto: { label: 'Commercial Auto', shortLabel: 'Auto' },
  umbrella_excess: { label: 'Umbrella/Excess', shortLabel: 'Umbrella' },
  professional_liability: { label: 'Professional Liability', shortLabel: 'Prof' },
  pollution_liability: { label: 'Pollution Liability', shortLabel: 'Pollution' },
  builders_risk: { label: "Builder's Risk", shortLabel: 'BR' },
  equipment_floater: { label: 'Equipment Floater', shortLabel: 'Equip' },
};

// Toast notification type
interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

interface ProjectCoverageRequirementsPageProps {
  projectId: string;
  projectName?: string;
  organizationId?: string;
  currentUser?: UserContext;
}

export default function ProjectCoverageRequirementsPage({
  projectId,
  projectName = 'Project',
  organizationId = 'org-1',
  currentUser = {
    id: 'admin-1',
    role: 'admin',
    organization_id: 'org-1',
    project_ids: [projectId],
  },
}: ProjectCoverageRequirementsPageProps) {
  const [projectRequirements, setProjectRequirements] = useState<CoverageLimitRequirement[]>([]);
  const [orgRequirements, setOrgRequirements] = useState<CoverageLimitRequirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoverageType, setSelectedCoverageType] = useState<CoverageLimitType | 'all'>(
    'all'
  );
  const [showForm, setShowForm] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<CoverageLimitRequirement | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<CoverageLimitRequirement | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showOrgRequirements, setShowOrgRequirements] = useState(true);

  // Check if user can manage this project
  const canManage = canManageProjectLevel(currentUser, projectId);

  // Add toast notification
  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  // Fetch both project and org level requirements
  const fetchRequirements = useCallback(async () => {
    setIsLoading(true);

    // Fetch project-level requirements
    const projectResponse = await getProjectLevelRequirements(projectId);
    if (projectResponse.success && projectResponse.data) {
      let filtered = projectResponse.data;
      if (selectedCoverageType !== 'all') {
        filtered = filtered.filter((r) => r.coverage_type === selectedCoverageType);
      }
      setProjectRequirements(filtered);
    } else {
      addToast('error', projectResponse.error || 'Failed to load project requirements');
    }

    // Fetch org-level requirements for reference
    const orgResponse = await getOrgLevelRequirements(organizationId);
    if (orgResponse.success && orgResponse.data) {
      let filtered = orgResponse.data;
      if (selectedCoverageType !== 'all') {
        filtered = filtered.filter((r) => r.coverage_type === selectedCoverageType);
      }
      setOrgRequirements(filtered);
    }

    setIsLoading(false);
  }, [projectId, organizationId, selectedCoverageType, addToast]);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  // Filter requirements by search
  const filteredProjectRequirements = useMemo(() => {
    if (!searchQuery) return projectRequirements;
    const query = searchQuery.toLowerCase();
    return projectRequirements.filter(
      (req) =>
        req.name.toLowerCase().includes(query) ||
        COVERAGE_TYPE_CONFIG[req.coverage_type].label.toLowerCase().includes(query)
    );
  }, [projectRequirements, searchQuery]);

  const filteredOrgRequirements = useMemo(() => {
    if (!searchQuery) return orgRequirements;
    const query = searchQuery.toLowerCase();
    return orgRequirements.filter(
      (req) =>
        req.name.toLowerCase().includes(query) ||
        COVERAGE_TYPE_CONFIG[req.coverage_type].label.toLowerCase().includes(query)
    );
  }, [orgRequirements, searchQuery]);

  // Handle create requirement
  const handleCreate = useCallback(
    async (data: CoverageRequirementFormData) => {
      setIsSubmitting(true);
      const input: CreateCoverageLimitRequirementRequest = {
        name: data.name,
        level: 'project',
        organization_id: organizationId,
        project_id: projectId,
        coverage_type: data.coverage_type,
        minimum_limit: data.minimum_limit,
        required: data.required,
      };

      const response = await createCoverageLimitRequirement(input, currentUser);
      setIsSubmitting(false);

      if (response.success) {
        addToast('success', 'Project requirement created successfully');
        setShowForm(false);
        fetchRequirements();
      } else {
        addToast('error', response.error || 'Failed to create project requirement');
      }
    },
    [organizationId, projectId, currentUser, addToast, fetchRequirements]
  );

  // Handle update requirement
  const handleUpdate = useCallback(
    async (data: CoverageRequirementFormData) => {
      if (!editingRequirement) return;

      setIsSubmitting(true);
      const input: UpdateCoverageLimitRequirementRequest = {
        name: data.name,
        coverage_type: data.coverage_type,
        minimum_limit: data.minimum_limit,
        required: data.required,
      };

      const response = await updateCoverageLimitRequirement(
        editingRequirement.id,
        input,
        currentUser
      );
      setIsSubmitting(false);

      if (response.success) {
        addToast('success', 'Project requirement updated successfully');
        setEditingRequirement(null);
        fetchRequirements();
      } else {
        addToast('error', response.error || 'Failed to update project requirement');
      }
    },
    [editingRequirement, currentUser, addToast, fetchRequirements]
  );

  // Handle delete requirement
  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return;

    setIsSubmitting(true);
    const response = await deleteCoverageLimitRequirement(deleteConfirm.id, currentUser);
    setIsSubmitting(false);

    if (response.success) {
      addToast('success', 'Project requirement deleted successfully');
      setDeleteConfirm(null);
      fetchRequirements();
    } else {
      addToast('error', response.error || 'Failed to delete project requirement');
    }
  }, [deleteConfirm, currentUser, addToast, fetchRequirements]);

  // Coverage type filter options
  const coverageTypeOptions = [
    { value: 'all', label: 'All Coverage Types' },
    ...VALID_COVERAGE_TYPES.map((type) => ({
      value: type,
      label: COVERAGE_TYPE_CONFIG[type].label,
    })),
  ];

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Access denied view
  if (!canManage) {
    return (
      <Stack style={{ alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
        <AlertCircle size={48} color="var(--color-yellow10)" style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-color12)', marginBottom: 8 }}>Access Denied</Text>
        <Text style={{ color: 'var(--color-color11)' }}>
          You don't have permission to manage coverage requirements for this project.
        </Text>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 24 }}>
      {/* Toast notifications */}
      <Stack style={{ position: 'fixed', top: 16, right: 16, zIndex: 50, gap: 8 }}>
        {toasts.map((toast) => (
          <Card
            key={toast.id}
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              fontSize: 14,
              fontWeight: 500,
              backgroundColor: toast.type === 'success' ? 'var(--color-green2)' : 'var(--color-red2)',
              color: toast.type === 'success' ? 'var(--color-green11)' : 'var(--color-red11)',
              borderColor: toast.type === 'success' ? 'var(--color-green6)' : 'var(--color-red6)',
              borderWidth: 1,
              borderStyle: 'solid',
            }}
          >
            {toast.message}
          </Card>
        ))}
      </Stack>

      {/* Header */}
      <Row style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
        <ButtonCommon variant="primary" leftIcon={Plus} onPress={() => setShowForm(true)}>
          Add Project Requirement
        </ButtonCommon>
      </Row>

      {/* Info Banner */}
      <CardCommon style={{ padding: 16, backgroundColor: 'var(--color-purple2)', borderColor: 'var(--color-purple6)' }}>
        <Row style={{ alignItems: 'flex-start', gap: 12 }}>
          <Shield color="var(--color-purple10)" style={{ marginTop: 2 }} size={20} />
          <Stack>
            <Text style={{ color: 'var(--color-purple11)', fontWeight: 500 }}>Project-Level Requirements</Text>
            <Text style={{ color: 'var(--color-purple10)', fontSize: 14, marginTop: 4 }}>
              These requirements are specific to this project and supplement the organization-wide
              requirements. Subcontractors must meet both org-level and project-level requirements.
            </Text>
          </Stack>
        </Row>
      </CardCommon>

      {/* Filters */}
      <CardCommon style={{ padding: 16 }}>
        <Row style={{ flexDirection: 'column', gap: 16 }}>
          <Row style={{ flex: 1, position: 'relative' }}>
            <Stack style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 1, pointerEvents: 'none' }}>
              <Search size={20} color="var(--color-color10)" />
            </Stack>
            <input
              type="text"
              placeholder="Search requirements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 40,
                paddingRight: 16,
                paddingTop: 8,
                paddingBottom: 8,
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                color: 'var(--color-color12)',
                flex: 1,
              }}
            />
          </Row>
          <Row style={{ alignItems: 'center', gap: 8 }}>
            <DollarSign size={20} color="var(--color-color10)" />
            <Select
              options={coverageTypeOptions}
              value={selectedCoverageType}
              onChange={(e) =>
                setSelectedCoverageType(e.target.value as CoverageLimitType | 'all')
              }
              style={{ width: 224 }}
            />
          </Row>
        </Row>
      </CardCommon>

      {/* Project Requirements Table */}
      <CardCommon>
        <Stack style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-purple2)', opacity: 0.5 }}>
          <Row style={{ alignItems: 'center', gap: 8 }}>
            <FolderKanban size={18} color="var(--color-purple10)" />
            <H2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-color12)' }}>Project-Specific Requirements</H2>
            <Text style={{ fontSize: 14, color: 'var(--color-color11)' }}>
              ({filteredProjectRequirements.length})
            </Text>
          </Row>
        </Stack>
        <Stack style={{ overflowX: 'auto' }}>
          <Stack>
            <Row style={{ padding: 16, paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
              <Text style={{ flex: 1, textAlign: 'left', paddingLeft: 16, paddingRight: 16, fontSize: 14, fontWeight: 600, color: 'var(--color-color11)' }}>Name</Text>
              <Text style={{ flex: 1, textAlign: 'left', paddingLeft: 16, paddingRight: 16, fontSize: 14, fontWeight: 600, color: 'var(--color-color11)' }}>Coverage Type</Text>
              <Text style={{ flex: 1, textAlign: 'left', paddingLeft: 16, paddingRight: 16, fontSize: 14, fontWeight: 600, color: 'var(--color-color11)' }}>Minimum Limit</Text>
              <Text style={{ flex: 1, textAlign: 'left', paddingLeft: 16, paddingRight: 16, fontSize: 14, fontWeight: 600, color: 'var(--color-color11)' }}>Level</Text>
              <Text style={{ flex: 1, textAlign: 'left', paddingLeft: 16, paddingRight: 16, fontSize: 14, fontWeight: 600, color: 'var(--color-color11)' }}>Status</Text>
              <Text style={{ flex: 1, textAlign: 'right', paddingLeft: 16, paddingRight: 16, fontSize: 14, fontWeight: 600, color: 'var(--color-color11)' }}>Actions</Text>
            </Row>
            <Stack>
              {isLoading ? (
                <Row style={{ padding: 16, paddingTop: 32, paddingBottom: 32, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: 'var(--color-color10)' }}>Loading project requirements...</Text>
                </Row>
              ) : filteredProjectRequirements.length === 0 ? (
                <Row style={{ padding: 16, paddingTop: 32, paddingBottom: 32, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: 'var(--color-color10)' }}>
                    {searchQuery
                      ? 'No project requirements match your search'
                      : 'No project-specific requirements. Add one above!'}
                  </Text>
                </Row>
              ) : (
                filteredProjectRequirements.map((requirement) => (
                  <Row
                    key={requirement.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      padding: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ flex: 1, paddingLeft: 16, paddingRight: 16, fontWeight: 500, color: 'var(--color-color12)' }}>{requirement.name}</Text>
                    <Row style={{ flex: 1, paddingLeft: 16, paddingRight: 16, alignItems: 'center', gap: 8 }}>
                      <Text
                        style={{
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 4,
                          paddingBottom: 4,
                          borderRadius: 4,
                          backgroundColor: 'var(--color-gray2)',
                          color: 'var(--color-gray11)',
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                          {COVERAGE_TYPE_CONFIG[requirement.coverage_type].shortLabel}
                      </Text>
                      <Text style={{ color: 'var(--color-color11)' }}>
                          {COVERAGE_TYPE_CONFIG[requirement.coverage_type].label}
                      </Text>
                    </Row>
                    <Text style={{ flex: 1, paddingLeft: 16, paddingRight: 16, fontFamily: 'monospace', color: 'var(--color-color12)' }}>
                        {formatCurrency(requirement.minimum_limit)}
                    </Text>
                    <Row style={{ flex: 1, paddingLeft: 16, paddingRight: 16 }}>
                      <Text
                        style={{
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 4,
                          paddingBottom: 4,
                          borderRadius: 9999,
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor: 'var(--color-purple2)',
                          color: 'var(--color-purple11)',
                        }}
                      >
                        PROJECT
                      </Text>
                    </Row>
                    <Row style={{ flex: 1, paddingLeft: 16, paddingRight: 16 }}>
                      <Text
                        style={{
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 4,
                          paddingBottom: 4,
                          borderRadius: 9999,
                          fontSize: 12,
                          fontWeight: 500,
                          backgroundColor: requirement.required ? 'var(--color-green2)' : 'var(--color-gray2)',
                          color: requirement.required ? 'var(--color-green11)' : 'var(--color-gray11)',
                        }}
                      >
                        {requirement.required ? 'Required' : 'Optional'}
                      </Text>
                    </Row>
                    <Row style={{ flex: 1, paddingLeft: 16, paddingRight: 16, alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <Button
                        variant="ghost"
                        onPress={() => setEditingRequirement(requirement)}
                        style={{
                          padding: 8,
                          color: 'var(--color-color10)',
                          borderRadius: 8,
                        }}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        onPress={() => setDeleteConfirm(requirement)}
                        style={{
                          padding: 8,
                          color: 'var(--color-color10)',
                          borderRadius: 8,
                        }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </Row>
                  </Row>
                ))
              )}
            </Stack>
          </Stack>
        </Stack>
      </CardCommon>

      {/* Inherited Org Requirements (Read-only) */}
      <CardCommon>
        <Stack
          onPress={() => setShowOrgRequirements(!showOrgRequirements)}
          style={{
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 12,
            paddingBottom: 12,
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-blue2)',
            opacity: 0.5,
            cursor: 'pointer',
          }}
        >
          <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Row style={{ alignItems: 'center', gap: 8 }}>
              <Building2 size={18} color="var(--color-blue10)" />
              <H2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-color12)' }}>
                Inherited Organization Requirements
              </H2>
              <Text style={{ fontSize: 14, color: 'var(--color-color11)' }}>
                ({filteredOrgRequirements.length})
              </Text>
            </Row>
            <Text style={{ fontSize: 14, color: 'var(--color-color10)' }}>
              {showOrgRequirements ? 'Hide' : 'Show'}
            </Text>
          </Row>
          <Text style={{ fontSize: 14, color: 'var(--color-color10)', marginTop: 4 }}>
            These org-level requirements also apply to this project (read-only)
          </Text>
        </Stack>
        {showOrgRequirements && (
          <Stack style={{ overflowX: 'auto' }}>
            <Stack>
              <Row style={{ padding: 16, paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
                <Text style={{ flex: 1, textAlign: 'left', paddingLeft: 16, paddingRight: 16, fontSize: 14, fontWeight: 600, color: 'var(--color-color11)' }}>Name</Text>
                <Text style={{ flex: 1, textAlign: 'left', paddingLeft: 16, paddingRight: 16, fontSize: 14, fontWeight: 600, color: 'var(--color-color11)' }}>Coverage Type</Text>
                <Text style={{ flex: 1, textAlign: 'left', paddingLeft: 16, paddingRight: 16, fontSize: 14, fontWeight: 600, color: 'var(--color-color11)' }}>Minimum Limit</Text>
                <Text style={{ flex: 1, textAlign: 'left', paddingLeft: 16, paddingRight: 16, fontSize: 14, fontWeight: 600, color: 'var(--color-color11)' }}>Level</Text>
                <Text style={{ flex: 1, textAlign: 'left', paddingLeft: 16, paddingRight: 16, fontSize: 14, fontWeight: 600, color: 'var(--color-color11)' }}>Status</Text>
              </Row>
              <Stack>
                {filteredOrgRequirements.length === 0 ? (
                  <Row style={{ padding: 16, paddingTop: 24, paddingBottom: 24, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: 'var(--color-color10)' }}>No org-level requirements found</Text>
                  </Row>
                ) : (
                  filteredOrgRequirements.map((requirement) => (
                    <Row
                      key={requirement.id}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-gray2)',
                        opacity: 0.3,
                        padding: 12,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ flex: 1, paddingLeft: 16, paddingRight: 16, color: 'var(--color-color11)' }}>{requirement.name}</Text>
                      <Row style={{ flex: 1, paddingLeft: 16, paddingRight: 16, alignItems: 'center', gap: 8 }}>
                        <Text
                          style={{
                            paddingLeft: 8,
                            paddingRight: 8,
                            paddingTop: 4,
                            paddingBottom: 4,
                            borderRadius: 4,
                            backgroundColor: 'var(--color-gray2)',
                            color: 'var(--color-gray11)',
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                            {COVERAGE_TYPE_CONFIG[requirement.coverage_type].shortLabel}
                        </Text>
                        <Text style={{ color: 'var(--color-color10)' }}>
                            {COVERAGE_TYPE_CONFIG[requirement.coverage_type].label}
                        </Text>
                      </Row>
                      <Text style={{ flex: 1, paddingLeft: 16, paddingRight: 16, fontFamily: 'monospace', color: 'var(--color-color11)' }}>
                          {formatCurrency(requirement.minimum_limit)}
                      </Text>
                      <Row style={{ flex: 1, paddingLeft: 16, paddingRight: 16 }}>
                        <Text
                          style={{
                            paddingLeft: 8,
                            paddingRight: 8,
                            paddingTop: 4,
                            paddingBottom: 4,
                            borderRadius: 9999,
                            fontSize: 12,
                            fontWeight: 600,
                            backgroundColor: 'var(--color-blue2)',
                            color: 'var(--color-blue11)',
                          }}
                        >
                          ORG
                        </Text>
                      </Row>
                      <Row style={{ flex: 1, paddingLeft: 16, paddingRight: 16 }}>
                        <Text
                          style={{
                            paddingLeft: 8,
                            paddingRight: 8,
                            paddingTop: 4,
                            paddingBottom: 4,
                            borderRadius: 9999,
                            fontSize: 12,
                            fontWeight: 500,
                            backgroundColor: requirement.required ? 'var(--color-green2)' : 'var(--color-gray2)',
                            color: requirement.required ? 'var(--color-green11)' : 'var(--color-gray11)',
                          }}
                        >
                          {requirement.required ? 'Required' : 'Optional'}
                        </Text>
                      </Row>
                    </Row>
                  ))
                )}
              </Stack>
            </Stack>
          </Stack>
        )}
      </CardCommon>

      {/* Summary Card */}
      <CardCommon style={{ padding: 16 }}>
        <Row style={{ alignItems: 'center', justifyContent: 'space-between', fontSize: 14 }}>
          <Text style={{ color: 'var(--color-color11)' }}>
            Total requirements for this project:{' '}
            <Text style={{ fontWeight: 600, color: 'var(--color-color12)' }}>
              {filteredProjectRequirements.length + filteredOrgRequirements.length}
            </Text>{' '}
            ({filteredProjectRequirements.length} project + {filteredOrgRequirements.length} org)
          </Text>
          <Row style={{ alignItems: 'center', gap: 16 }}>
            <Text style={{ color: 'var(--color-color11)' }}>
              Required:{' '}
              <Text style={{ fontWeight: 600, color: 'var(--color-color12)' }}>
                {
                  [...filteredProjectRequirements, ...filteredOrgRequirements].filter(
                    (r) => r.required
                  ).length
                }
              </Text>
            </Text>
            <Text style={{ color: 'var(--color-color11)' }}>
              Optional:{' '}
              <Text style={{ fontWeight: 600, color: 'var(--color-color12)' }}>
                {
                  [...filteredProjectRequirements, ...filteredOrgRequirements].filter(
                    (r) => !r.required
                  ).length
                }
              </Text>
            </Text>
          </Row>
        </Row>
      </CardCommon>

      {/* Create Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add Project Requirement"
        size="lg"
      >
        <CoverageRequirementForm
          level="project"
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingRequirement}
        onClose={() => setEditingRequirement(null)}
        title="Edit Project Requirement"
        size="lg"
      >
        {editingRequirement && (
          <CoverageRequirementForm
            initialData={editingRequirement}
            level="project"
            onSubmit={handleUpdate}
            onCancel={() => setEditingRequirement(null)}
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Project Requirement"
        size="sm"
      >
        <Stack style={{ gap: 16 }}>
          <Text style={{ color: 'var(--color-color11)' }}>
            Are you sure you want to delete{' '}
            <Text style={{ fontWeight: 600, color: 'var(--color-color12)' }}>{deleteConfirm?.name}</Text>? This
            action cannot be undone and may affect compliance calculations for this project.
          </Text>
          <Row style={{ justifyContent: 'flex-end', gap: 12 }}>
            <ButtonCommon
              variant="ghost"
              onPress={() => setDeleteConfirm(null)}
              disabled={isSubmitting}
            >
              Cancel
            </ButtonCommon>
            <ButtonCommon variant="danger" onPress={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </ButtonCommon>
          </Row>
        </Stack>
      </Modal>
    </Stack>
  );
}
