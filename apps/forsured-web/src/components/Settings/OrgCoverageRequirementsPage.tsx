/**
 * REQ-263: Org-Level vs Project-Level Coverage Distinction
 * TASK-3: Build Org Coverage Requirements Settings UI
 *
 * Admin interface for managing organization-level coverage limit requirements.
 * Displays requirements with "ORG" badge and provides CRUD operations.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Shield,
  Building2,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { YStack, XStack, Text, H1, Card, Button } from '@unicornlove/ui';
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
  getOrgLevelRequirements,
  createCoverageLimitRequirement,
  updateCoverageLimitRequirement,
  deleteCoverageLimitRequirement,
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

interface OrgCoverageRequirementsPageProps {
  organizationId?: string;
  currentUser?: UserContext;
}

export default function OrgCoverageRequirementsPage({
  organizationId = 'org-1',
  currentUser = { id: 'admin-1', role: 'admin', organization_id: 'org-1' },
}: OrgCoverageRequirementsPageProps) {
  const [requirements, setRequirements] = useState<CoverageLimitRequirement[]>([]);
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

  // Check if user is admin
  const isAdmin = currentUser.role === 'admin';

  // Add toast notification
  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  // Fetch org-level requirements
  const fetchRequirements = useCallback(async () => {
    setIsLoading(true);
    const response = await getOrgLevelRequirements(organizationId);
    if (response.success && response.data) {
      let filtered = response.data;
      if (selectedCoverageType !== 'all') {
        filtered = filtered.filter((r) => r.coverage_type === selectedCoverageType);
      }
      setRequirements(filtered);
    } else {
      addToast('error', response.error || 'Failed to load coverage requirements');
    }
    setIsLoading(false);
  }, [organizationId, selectedCoverageType, addToast]);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  // Filter requirements by search
  const filteredRequirements = useMemo(() => {
    if (!searchQuery) return requirements;
    const query = searchQuery.toLowerCase();
    return requirements.filter(
      (req) =>
        req.name.toLowerCase().includes(query) ||
        COVERAGE_TYPE_CONFIG[req.coverage_type].label.toLowerCase().includes(query)
    );
  }, [requirements, searchQuery]);

  // Handle create requirement
  const handleCreate = useCallback(
    async (data: CoverageRequirementFormData) => {
      setIsSubmitting(true);
      const input: CreateCoverageLimitRequirementRequest = {
        name: data.name,
        level: 'org',
        organization_id: organizationId,
        coverage_type: data.coverage_type,
        minimum_limit: data.minimum_limit,
        required: data.required,
      };

      const response = await createCoverageLimitRequirement(input, currentUser);
      setIsSubmitting(false);

      if (response.success) {
        addToast('success', 'Coverage requirement created successfully');
        setShowForm(false);
        fetchRequirements();
      } else {
        addToast('error', response.error || 'Failed to create coverage requirement');
      }
    },
    [organizationId, currentUser, addToast, fetchRequirements]
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
        addToast('success', 'Coverage requirement updated successfully');
        setEditingRequirement(null);
        fetchRequirements();
      } else {
        addToast('error', response.error || 'Failed to update coverage requirement');
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
      addToast('success', 'Coverage requirement deleted successfully');
      setDeleteConfirm(null);
      fetchRequirements();
    } else {
      addToast('error', response.error || 'Failed to delete coverage requirement');
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

  // Non-admin warning
  if (!isAdmin) {
    return (
      <YStack alignItems="center" justifyContent="center" padding="$8" textAlign="center">
        <AlertCircle size={48} color="$yellow10" marginBottom="$4" />
        <Text fontSize="$6" fontWeight="600" color="$color12" marginBottom="$2">Admin Access Required</Text>
        <Text color="$color11">
          Only administrators can manage organization-level coverage requirements.
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
              backgroundColor="$blue2"
              color="$blue11"
              alignItems="center"
              gap="$1"
            >
              <Building2 size={14} />
              <Text>ORG LEVEL</Text>
            </XStack>
          </XStack>
          <Text color="$color11" fontSize="$6" marginTop="$1">
            Set organization-wide minimum coverage requirements for all subcontractors
          </Text>
        </YStack>
        <ButtonCommon variant="primary" leftIcon={Plus} onClick={() => setShowForm(true)}>
          Add Requirement
        </ButtonCommon>
      </XStack>

      {/* Info Banner */}
      <CardCommon padding="$4" backgroundColor="$blue2" borderColor="$blue6">
        <XStack alignItems="flex-start" gap="$3">
          <Shield color="$blue10" marginTop="$0.5" size={20} />
          <YStack>
            <Text color="$blue11" fontWeight="500">Organization-Level Requirements</Text>
            <Text color="$blue10" fontSize="$3" marginTop="$1">
              These requirements apply to all projects in your organization. Subcontractors must
              meet both org-level and any project-specific requirements for full compliance.
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

      {/* Requirements Table */}
      <CardCommon>
        <YStack overflowX="auto">
          <YStack>
            <XStack padding="$4" paddingVertical="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
              <Text flex={1} textAlign="left" paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Name</Text>
              <Text flex={1} textAlign="left" paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Coverage Type</Text>
              <Text flex={1} textAlign="left" paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Minimum Limit</Text>
              <Text flex={1} textAlign="left" paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Level</Text>
              <Text flex={1} textAlign="left" paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Status</Text>
              <Text flex={1} textAlign="right" paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Actions</Text>
            </XStack>
            <YStack>
              {isLoading ? (
                <XStack padding="$4" paddingVertical="$8" justifyContent="center" alignItems="center">
                  <Text color="$color10">Loading coverage requirements...</Text>
                </XStack>
              ) : filteredRequirements.length === 0 ? (
                <XStack padding="$4" paddingVertical="$8" justifyContent="center" alignItems="center">
                  <Text color="$color10">
                    {searchQuery
                      ? 'No requirements match your search'
                      : 'No coverage requirements found. Create your first one!'}
                  </Text>
                </XStack>
              ) : (
                filteredRequirements.map((requirement, idx) => (
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

      {/* Summary Card */}
      {filteredRequirements.length > 0 && (
        <CardCommon padding="$4">
          <XStack alignItems="center" justifyContent="space-between" fontSize="$3">
            <Text color="$color11">
              Showing {filteredRequirements.length} org-level requirement
              {filteredRequirements.length !== 1 ? 's' : ''}
            </Text>
            <XStack alignItems="center" gap="$4">
              <Text color="$color11">
                Required:{' '}
                <Text fontWeight="600" color="$color12">
                  {filteredRequirements.filter((r) => r.required).length}
                </Text>
              </Text>
              <Text color="$color11">
                Optional:{' '}
                <Text fontWeight="600" color="$color12">
                  {filteredRequirements.filter((r) => !r.required).length}
                </Text>
              </Text>
            </XStack>
          </XStack>
        </CardCommon>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add Coverage Requirement"
        size="lg"
      >
        <CoverageRequirementForm
          level="org"
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingRequirement}
        onClose={() => setEditingRequirement(null)}
        title="Edit Coverage Requirement"
        size="lg"
      >
        {editingRequirement && (
          <CoverageRequirementForm
            initialData={editingRequirement}
            level="org"
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
        title="Delete Coverage Requirement"
        size="sm"
      >
        <YStack gap="$4">
          <Text color="$color11">
            Are you sure you want to delete{' '}
            <Text fontWeight="600" color="$color12">{deleteConfirm?.name}</Text>? This
            action cannot be undone and may affect compliance calculations for all projects.
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
