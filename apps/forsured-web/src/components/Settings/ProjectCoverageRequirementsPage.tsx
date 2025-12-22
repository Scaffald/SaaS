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
import { YStack, XStack, Text, H1, H2, Card, Button } from '@unicornlove/ui';
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
      <YStack alignItems="center" justifyContent="center" padding="$8" style={{ textAlign: 'center' }}>
        <AlertCircle size={48} color="$yellow10" mb="$4" />
        <Text fontSize="$6" fontWeight="600" color="$color12" mb="$2">Access Denied</Text>
        <Text color="$color11">
          You don't have permission to manage coverage requirements for this project.
        </Text>
      </YStack>
    );
  }

  return (
    <YStack gap="$6">
      {/* Toast notifications */}
      <YStack position="fixed" top="$4" right="$4" zIndex={50} gap="$2">
        {toasts.map((toast) => (
          <Card
            key={toast.id}
            padding="$4"
            paddingVertical="$3"
            borderRadius="$4"
            elevation={4}
            fontSize="$3"
            fontWeight="500"
            backgroundColor={toast.type === 'success' ? '$green2' : '$red2'}
            color={toast.type === 'success' ? '$green11' : '$red11'}
            borderColor={toast.type === 'success' ? '$green6' : '$red6'}
            borderWidth={1}
          >
            {toast.message}
          </Card>
        ))}
      </YStack>

      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between">
        <YStack>
          <XStack alignItems="center" gap="$3">
            <H1 fontSize="$9" fontWeight="bold" color="$color12">
              Coverage Requirements
            </H1>
            <XStack
              paddingHorizontal="$3"
              paddingVertical="$1"
              borderRadius={9999}
              fontSize="$3"
              fontWeight="600"
              backgroundColor="$purple2"
              color="$purple11"
              alignItems="center"
              gap="$1"
            >
              <FolderKanban size={14} />
              <Text>PROJECT</Text>
            </XStack>
          </XStack>
          <Text color="$color11" fontSize="$6" mt="$1">
            Set project-specific coverage requirements for <Text fontWeight="600">{projectName}</Text>
          </Text>
        </YStack>
        <ButtonCommon variant="primary" leftIcon={Plus} onClick={() => setShowForm(true)}>
          Add Project Requirement
        </ButtonCommon>
      </XStack>

      {/* Info Banner */}
      <CardCommon padding="$4" backgroundColor="$purple2" borderColor="$purple6">
        <XStack alignItems="flex-start" gap="$3">
          <Shield color="$purple10" mt="$0.5" size={20} />
          <YStack>
            <Text color="$purple11" fontWeight="500">Project-Level Requirements</Text>
            <Text color="$purple10" fontSize="$3" mt="$1">
              These requirements are specific to this project and supplement the organization-wide
              requirements. Subcontractors must meet both org-level and project-level requirements.
            </Text>
          </YStack>
        </XStack>
      </CardCommon>

      {/* Filters */}
      <CardCommon padding="$4">
        <XStack flexDirection="column" gap="$4" $gtSm={{ flexDirection: 'row' }}>
          <XStack flex={1} position="relative">
            <YStack position="absolute" left="$3" top="50%" style={{ transform: 'translateY(-50%)' }} zIndex={1} pointerEvents="none">
              <Search size={20} color="$color10" />
            </YStack>
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
                backgroundColor: 'var(--background)',
                border: '1px solid var(--borderColor)',
                borderRadius: 8,
                color: 'var(--color12)',
                flex: 1,
              }}
            />
          </XStack>
          <XStack alignItems="center" gap="$2">
            <DollarSign size={20} color="$color10" />
            <Select
              options={coverageTypeOptions}
              value={selectedCoverageType}
              onChange={(e) =>
                setSelectedCoverageType(e.target.value as CoverageLimitType | 'all')
              }
              style={{ width: 224 }}
            />
          </XStack>
        </XStack>
      </CardCommon>

      {/* Project Requirements Table */}
      <CardCommon>
        <YStack paddingHorizontal="$4" paddingVertical="$3" borderBottomWidth={1} borderBottomColor="$borderColor" backgroundColor="$purple2" opacity={0.5}>
          <XStack alignItems="center" gap="$2">
            <FolderKanban size={18} color="$purple10" />
            <H2 fontSize="$5" fontWeight="600" color="$color12">Project-Specific Requirements</H2>
            <Text fontSize="$3" color="$color11">
              ({filteredProjectRequirements.length})
            </Text>
          </XStack>
        </YStack>
        <YStack overflowX="auto">
          <YStack>
            <XStack padding="$4" paddingVertical="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
              <Text flex={1} style={{ textAlign: 'left' }} paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Name</Text>
              <Text flex={1} style={{ textAlign: 'left' }} paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Coverage Type</Text>
              <Text flex={1} style={{ textAlign: 'left' }} paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Minimum Limit</Text>
              <Text flex={1} style={{ textAlign: 'left' }} paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Level</Text>
              <Text flex={1} style={{ textAlign: 'left' }} paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Status</Text>
              <Text flex={1} style={{ textAlign: 'right' }} paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Actions</Text>
            </XStack>
            <YStack>
              {isLoading ? (
                <XStack padding="$4" paddingVertical="$8" justifyContent="center" alignItems="center">
                  <Text color="$color10">Loading project requirements...</Text>
                </XStack>
              ) : filteredProjectRequirements.length === 0 ? (
                <XStack padding="$4" paddingVertical="$8" justifyContent="center" alignItems="center">
                  <Text color="$color10">
                    {searchQuery
                      ? 'No project requirements match your search'
                      : 'No project-specific requirements. Add one above!'}
                  </Text>
                </XStack>
              ) : (
                filteredProjectRequirements.map((requirement, idx) => (
                  <XStack
                    key={requirement.id}
                    borderBottomWidth={1}
                    borderBottomColor="$borderColor"
                    hoverStyle={{ backgroundColor: '$backgroundHover' }}
                    padding="$3"
                    alignItems="center"
                  >
                    <Text flex={1} paddingHorizontal="$4" fontWeight="500" color="$color12">{requirement.name}</Text>
                    <XStack flex={1} paddingHorizontal="$4" alignItems="center" gap="$2">
                      <Text
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                        backgroundColor="$gray2"
                        color="$gray11"
                        fontSize="$2"
                        fontWeight="500"
                      >
                          {COVERAGE_TYPE_CONFIG[requirement.coverage_type].shortLabel}
                      </Text>
                      <Text color="$color11">
                          {COVERAGE_TYPE_CONFIG[requirement.coverage_type].label}
                      </Text>
                    </XStack>
                    <Text flex={1} paddingHorizontal="$4" fontFamily="$mono" color="$color12">
                        {formatCurrency(requirement.minimum_limit)}
                    </Text>
                    <XStack flex={1} paddingHorizontal="$4">
                      <Text
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius={9999}
                        fontSize="$2"
                        fontWeight="600"
                        backgroundColor="$purple2"
                        color="$purple11"
                      >
                        PROJECT
                      </Text>
                    </XStack>
                    <XStack flex={1} paddingHorizontal="$4">
                      <Text
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius={9999}
                        fontSize="$2"
                        fontWeight="500"
                        backgroundColor={requirement.required ? '$green2' : '$gray2'}
                        color={requirement.required ? '$green11' : '$gray11'}
                      >
                        {requirement.required ? 'Required' : 'Optional'}
                      </Text>
                    </XStack>
                    <XStack flex={1} paddingHorizontal="$4" alignItems="center" justifyContent="flex-end" gap="$2">
                      <Button
                        variant="ghost"
                        onPress={() => setEditingRequirement(requirement)}
                        padding="$2"
                        color="$color10"
                        hoverStyle={{ color: '$blue10', backgroundColor: '$blue2' }}
                        borderRadius="$4"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        onPress={() => setDeleteConfirm(requirement)}
                        padding="$2"
                        color="$color10"
                        hoverStyle={{ color: '$red10', backgroundColor: '$red2' }}
                        borderRadius="$4"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                      </Button>
                    </XStack>
                  </XStack>
                ))
              )}
            </YStack>
          </YStack>
        </YStack>
      </CardCommon>

      {/* Inherited Org Requirements (Read-only) */}
      <CardCommon>
        <YStack
          paddingHorizontal="$4"
          paddingVertical="$3"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
          backgroundColor="$blue2"
          opacity={0.5}
          cursor="pointer"
          onPress={() => setShowOrgRequirements(!showOrgRequirements)}
        >
          <XStack alignItems="center" justifyContent="space-between">
            <XStack alignItems="center" gap="$2">
              <Building2 size={18} color="$blue10" />
              <H2 fontSize="$5" fontWeight="600" color="$color12">
                Inherited Organization Requirements
              </H2>
              <Text fontSize="$3" color="$color11">
                ({filteredOrgRequirements.length})
              </Text>
            </XStack>
            <Text fontSize="$3" color="$color10">
              {showOrgRequirements ? 'Hide' : 'Show'}
            </Text>
          </XStack>
          <Text fontSize="$3" color="$color10" mt="$1">
            These org-level requirements also apply to this project (read-only)
          </Text>
        </YStack>
        {showOrgRequirements && (
          <YStack overflowX="auto">
            <YStack>
              <XStack padding="$4" paddingVertical="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
                <Text flex={1} style={{ textAlign: 'left' }} paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Name</Text>
                <Text flex={1} style={{ textAlign: 'left' }} paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Coverage Type</Text>
                <Text flex={1} style={{ textAlign: 'left' }} paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Minimum Limit</Text>
                <Text flex={1} style={{ textAlign: 'left' }} paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Level</Text>
                <Text flex={1} style={{ textAlign: 'left' }} paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Status</Text>
              </XStack>
              <YStack>
                {filteredOrgRequirements.length === 0 ? (
                  <XStack padding="$4" paddingVertical="$6" justifyContent="center" alignItems="center">
                    <Text color="$color10">No org-level requirements found</Text>
                  </XStack>
                ) : (
                  filteredOrgRequirements.map((requirement, idx) => (
                    <XStack
                      key={requirement.id}
                      borderBottomWidth={1}
                      borderBottomColor="$borderColor"
                      backgroundColor="$gray2"
                      opacity={0.3}
                      padding="$3"
                      alignItems="center"
                    >
                      <Text flex={1} paddingHorizontal="$4" color="$color11">{requirement.name}</Text>
                      <XStack flex={1} paddingHorizontal="$4" alignItems="center" gap="$2">
                        <Text
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius="$2"
                          backgroundColor="$gray2"
                          color="$gray11"
                          fontSize="$2"
                          fontWeight="500"
                        >
                            {COVERAGE_TYPE_CONFIG[requirement.coverage_type].shortLabel}
                        </Text>
                        <Text color="$color10">
                            {COVERAGE_TYPE_CONFIG[requirement.coverage_type].label}
                        </Text>
                      </XStack>
                      <Text flex={1} paddingHorizontal="$4" fontFamily="$mono" color="$color11">
                          {formatCurrency(requirement.minimum_limit)}
                      </Text>
                      <XStack flex={1} paddingHorizontal="$4">
                        <Text
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius={9999}
                          fontSize="$2"
                          fontWeight="600"
                          backgroundColor="$blue2"
                          color="$blue11"
                        >
                          ORG
                        </Text>
                      </XStack>
                      <XStack flex={1} paddingHorizontal="$4">
                        <Text
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius={9999}
                          fontSize="$2"
                          fontWeight="500"
                          backgroundColor={requirement.required ? '$green2' : '$gray2'}
                          color={requirement.required ? '$green11' : '$gray11'}
                        >
                          {requirement.required ? 'Required' : 'Optional'}
                        </Text>
                      </XStack>
                    </XStack>
                  ))
                )}
              </YStack>
            </YStack>
          </YStack>
        )}
      </CardCommon>

      {/* Summary Card */}
      <CardCommon padding="$4">
        <XStack alignItems="center" justifyContent="space-between" fontSize="$3">
          <Text color="$color11">
            Total requirements for this project:{' '}
            <Text fontWeight="600" color="$color12">
              {filteredProjectRequirements.length + filteredOrgRequirements.length}
            </Text>{' '}
            ({filteredProjectRequirements.length} project + {filteredOrgRequirements.length} org)
          </Text>
          <XStack alignItems="center" gap="$4">
            <Text color="$color11">
              Required:{' '}
              <Text fontWeight="600" color="$color12">
                {
                  [...filteredProjectRequirements, ...filteredOrgRequirements].filter(
                    (r) => r.required
                  ).length
                }
              </Text>
            </Text>
            <Text color="$color11">
              Optional:{' '}
              <Text fontWeight="600" color="$color12">
                {
                  [...filteredProjectRequirements, ...filteredOrgRequirements].filter(
                    (r) => !r.required
                  ).length
                }
              </Text>
            </Text>
          </XStack>
        </XStack>
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
        <YStack gap="$4">
          <Text color="$color11">
            Are you sure you want to delete{' '}
            <Text fontWeight="600" color="$color12">{deleteConfirm?.name}</Text>? This
            action cannot be undone and may affect compliance calculations for this project.
          </Text>
          <XStack justifyContent="flex-end" gap="$3">
            <ButtonCommon
              variant="ghost"
              onClick={() => setDeleteConfirm(null)}
              disabled={isSubmitting}
            >
              Cancel
            </ButtonCommon>
            <ButtonCommon variant="danger" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </ButtonCommon>
          </XStack>
        </YStack>
      </Modal>
    </YStack>
  );
}
