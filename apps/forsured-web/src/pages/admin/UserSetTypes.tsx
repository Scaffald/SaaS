/**
 * Admin User Set Types Management Page
 * REQ-4: Multi-Industry User Set Type System with Configurable Lexicon
 * TASK-9: Build admin user set type management UI
 *
 * Allows administrators to:
 * - View all user set types
 * - Create new user set types
 * - Edit existing user set types
 * - Toggle active/inactive status
 * - Delete user set types
 */
import { useState } from 'react';
import {
  PlusCircle,
  Edit,
  Trash2,
  RefreshCcw,
  Loader2,
  X,
  RotateCcw,
  Building2,
  Users,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { YStack, XStack, Text, Button, Card, H1, H2, H3, Spinner, Input, TextArea } from '@unicornlove/ui';
import { EmptyState } from '@unicornlove/ui';
import { trpc } from '../../lib/trpc';

interface UserSetTypeFormData {
  name: string;
  slug: string;
  managerLabelSingular: string;
  managerLabelPlural: string;
  contractorLabelSingular: string;
  contractorLabelPlural: string;
  description: string;
}

const DEFAULT_FORM_DATA: UserSetTypeFormData = {
  name: '',
  slug: '',
  managerLabelSingular: '',
  managerLabelPlural: '',
  contractorLabelSingular: '',
  contractorLabelPlural: '',
  description: '',
};

function AdminUserSetTypes() {
  // State
  const [showInactive, setShowInactive] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserSetTypeFormData>(DEFAULT_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // tRPC queries and mutations
  const {
    data: userSetTypes,
    isLoading,
    error,
    refetch,
  } = trpc.userSetTypes.list.useQuery();

  const createMutation = trpc.userSetTypes.create.useMutation();
  const updateMutation = trpc.userSetTypes.update.useMutation();
  const toggleActiveMutation = trpc.userSetTypes.toggleActive.useMutation();

  // Filter by active status
  const displayedTypes = userSetTypes?.filter(
    (ust) => showInactive || ust.isActive
  ) ?? [];

  // Count stats
  const activeCount = userSetTypes?.filter((ust) => ust.isActive).length ?? 0;
  const totalCount = userSetTypes?.length ?? 0;

  const handleRefresh = () => {
    refetch();
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setFormData(DEFAULT_FORM_DATA);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (userSetType: typeof displayedTypes[0]) => {
    setModalMode('edit');
    setEditingId(userSetType.id);
    setFormData({
      name: userSetType.name,
      slug: userSetType.slug,
      managerLabelSingular: userSetType.managerLabelSingular,
      managerLabelPlural: userSetType.managerLabelPlural,
      contractorLabelSingular: userSetType.contractorLabelSingular,
      contractorLabelPlural: userSetType.contractorLabelPlural,
      description: userSetType.description ?? '',
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormError(null);
  };

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      // Auto-generate slug when adding new type
      ...(modalMode === 'add' ? { slug: generateSlug(name) } : {}),
    }));
  };

  const handleSubmit = async (e?: React.FormEvent | any) => {
    e?.preventDefault?.();

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (modalMode === 'add') {
        await createMutation.mutateAsync({
          name: formData.name,
          slug: formData.slug,
          managerLabelSingular: formData.managerLabelSingular,
          managerLabelPlural: formData.managerLabelPlural,
          contractorLabelSingular: formData.contractorLabelSingular,
          contractorLabelPlural: formData.contractorLabelPlural,
          description: formData.description || undefined,
        });
      } else if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          name: formData.name,
          managerLabelSingular: formData.managerLabelSingular,
          managerLabelPlural: formData.managerLabelPlural,
          contractorLabelSingular: formData.contractorLabelSingular,
          contractorLabelPlural: formData.contractorLabelPlural,
          description: formData.description || undefined,
        });
      }

      closeModal();
      refetch();
    } catch (err) {
      console.error('Failed to save user set type:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentlyActive: boolean) => {
    const action = currentlyActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this user set type?`)) return;

    setActionInProgress(id);
    try {
      await toggleActiveMutation.mutateAsync({
        id,
        isActive: !currentlyActive,
      });
      refetch();
    } catch (err) {
      console.error('Failed to toggle active status:', err);
      alert(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setActionInProgress(null);
    }
  };

  if (isLoading) {
    return (
      <YStack alignItems="center" justifyContent="center" paddingVertical="$6">
        <Spinner size="large" color="$blue9" />
        <Text marginLeft="$2">Loading user set types...</Text>
      </YStack>
    );
  }

  return (
    <YStack>
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$6">
        <YStack>
          <H1 fontSize="$8" fontWeight="bold">Industry Verticals</H1>
          <Text color="$gray11" fontSize="$3" marginTop="$1">
            Manage user set types for different industry verticals (Construction, Property Management, etc.)
          </Text>
        </YStack>
        <XStack alignItems="center" gap="$3">
          <XStack alignItems="center" gap="$2">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            <Text fontSize="$3" color="$gray11">
              Show inactive ({totalCount - activeCount})
            </Text>
          </XStack>
          <Button
            onPress={handleRefresh}
            disabled={isLoading}
            icon={isLoading ? <Spinner size="small" /> : <RefreshCcw size={16} />}
            variant="outlined"
          >
            Refresh
          </Button>
          <Button
            onPress={openAddModal}
            backgroundColor="$blue9"
            color="white"
            icon={<PlusCircle size={16} />}
          >
            Add Industry
          </Button>
        </XStack>
      </XStack>

      {error && (
        <YStack padding="$4" marginBottom="$4" backgroundColor="$red2" borderWidth={1} borderColor="$red6" borderRadius="$4">
          <Text color="$red10">Error: {error.message}</Text>
        </YStack>
      )}

      {/* Summary Cards */}
      <XStack gap="$4" marginBottom="$6" flexWrap="wrap">
        <Card flex={1} minWidth={200} padding="$4" elevation={1}>
          <XStack alignItems="center" gap="$3">
            <YStack padding="$2" backgroundColor="$blue3" borderRadius="$4">
              <Building2 size={20} color="$blue9" />
            </YStack>
            <YStack>
              <Text fontSize="$3" color="$gray11">Total Industries</Text>
              <Text fontSize="$8" fontWeight="bold">{totalCount}</Text>
            </YStack>
          </XStack>
        </Card>
        <Card flex={1} minWidth={200} padding="$4" elevation={1}>
          <XStack alignItems="center" gap="$3">
            <YStack padding="$2" backgroundColor="$green3" borderRadius="$4">
              <Check size={20} color="$green9" />
            </YStack>
            <YStack>
              <Text fontSize="$3" color="$gray11">Active</Text>
              <Text fontSize="$8" fontWeight="bold">{activeCount}</Text>
            </YStack>
          </XStack>
        </Card>
        <Card flex={1} minWidth={200} padding="$4" elevation={1}>
          <XStack alignItems="center" gap="$3">
            <YStack padding="$2" backgroundColor="$gray3" borderRadius="$4">
              <Users size={20} color="$gray11" />
            </YStack>
            <YStack>
              <Text fontSize="$3" color="$gray11">Users Assigned</Text>
              <Text fontSize="$8" fontWeight="bold">
                {userSetTypes?.reduce((sum, ust) => sum + (ust.userCount ?? 0), 0) ?? 0}
              </Text>
            </YStack>
          </XStack>
        </Card>
      </XStack>

      {/* User Set Types Table */}
      <Card padding="$6" elevation={1}>
        {displayedTypes.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={showInactive ? "No inactive industries found" : "No industry verticals yet"}
            description={showInactive
              ? "All industry verticals are currently active. Deactivate one to see it here."
              : "Create your first industry vertical to customize terminology and user roles for different business types."}
            action={!showInactive ? {
              label: "Create Industry",
              onClick: openAddModal,
            } : undefined}
          />
        ) : (
          <YStack>
            <XStack borderBottomWidth={1} borderColor="$borderColor" paddingVertical="$2" paddingHorizontal="$4">
              <Text flex={2} fontWeight="600">Industry</Text>
              <Text flex={1} fontWeight="600">Slug</Text>
              <Text flex={1} fontWeight="600">Manager Label</Text>
              <Text flex={1} fontWeight="600">Contractor Label</Text>
              <Text flex={0.5} fontWeight="600" textAlign="center">Users</Text>
              <Text flex={0.5} fontWeight="600">Status</Text>
              <Text flex={0.5} fontWeight="600">Actions</Text>
            </XStack>
            {displayedTypes.map((ust) => (
              <XStack
                key={ust.id}
                borderBottomWidth={1}
                borderColor="$borderColor"
                paddingVertical="$3"
                paddingHorizontal="$4"
                opacity={!ust.isActive ? 0.6 : 1}
                backgroundColor={!ust.isActive ? "$gray2" : "transparent"}
              >
                <YStack flex={2}>
                  <Text fontWeight="500">{ust.name}</Text>
                  {ust.description && (
                    <Text fontSize="$1" color="$gray11" marginTop="$1">{ust.description}</Text>
                  )}
                </YStack>
                <Text flex={1} fontFamily="$mono" fontSize="$3" color="$gray11">
                  {ust.slug}
                </Text>
                <YStack flex={1}>
                  <Text fontSize="$3">{ust.managerLabelSingular}</Text>
                  <Text fontSize="$3" color="$gray11">({ust.managerLabelPlural})</Text>
                </YStack>
                <YStack flex={1}>
                  <Text fontSize="$3">{ust.contractorLabelSingular}</Text>
                  <Text fontSize="$3" color="$gray11">({ust.contractorLabelPlural})</Text>
                </YStack>
                <XStack flex={0.5} justifyContent="center">
                  <Text
                    paddingHorizontal="$2"
                    paddingVertical="$1"
                    backgroundColor="$gray3"
                    borderRadius="$2"
                    fontSize="$3"
                  >
                    {ust.userCount ?? 0}
                  </Text>
                </XStack>
                <XStack flex={0.5}>
                  <Text
                    paddingHorizontal="$2"
                    paddingVertical="$1"
                    borderRadius="$2"
                    fontSize="$1"
                    backgroundColor={ust.isActive ? "$green3" : "$gray3"}
                    color={ust.isActive ? "$green10" : "$gray11"}
                  >
                    {ust.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </XStack>
                <XStack flex={0.5} alignItems="center" gap="$1">
                  <Button
                    onPress={() => openEditModal(ust)}
                    disabled={actionInProgress === ust.id}
                    size="$2"
                    variant="outlined"
                    icon={<Edit size={16} />}
                    opacity={actionInProgress === ust.id ? 0.5 : 1}
                  />
                  {ust.isActive ? (
                    <Button
                      onPress={() => handleToggleActive(ust.id, true)}
                      disabled={actionInProgress === ust.id || (ust.userCount ?? 0) > 0}
                      size="$2"
                      variant="outlined"
                      icon={actionInProgress === ust.id ? <Spinner size="small" /> : <Trash2 size={16} />}
                      color="$red9"
                      opacity={actionInProgress === ust.id || (ust.userCount ?? 0) > 0 ? 0.5 : 1}
                    />
                  ) : (
                    <Button
                      onPress={() => handleToggleActive(ust.id, false)}
                      disabled={actionInProgress === ust.id}
                      size="$2"
                      variant="outlined"
                      icon={actionInProgress === ust.id ? <Spinner size="small" /> : <RotateCcw size={16} />}
                      color="$green9"
                      opacity={actionInProgress === ust.id ? 0.5 : 1}
                    />
                  )}
                </XStack>
              </XStack>
            ))}
          </YStack>
        )}
      </Card>

      {/* Add/Edit Modal */}
      {showModal && (
        <YStack
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor="rgba(0,0,0,0.5)"
          alignItems="center"
          justifyContent="center"
          zIndex={50}
        >
          <Card
            backgroundColor="white"
            borderRadius="$4"
            shadowColor="$shadowColor"
            shadowRadius="$4"
            width="100%"
            maxWidth={600}
            marginHorizontal="$4"
            maxHeight="90vh"
          >
            <XStack
              alignItems="center"
              justifyContent="space-between"
              padding="$4"
              borderBottomWidth={1}
              borderColor="$borderColor"
              position="sticky"
              top={0}
              backgroundColor="white"
            >
              <H3 fontSize="$5" fontWeight="600">
                {modalMode === 'add' ? 'Add Industry Vertical' : 'Edit Industry Vertical'}
              </H3>
              <Button
                onPress={closeModal}
                size="$2"
                variant="outlined"
                icon={<X size={20} />}
                color="$gray11"
              />
            </XStack>

            <YStack padding="$4" gap="$4">
              {formError && (
                <XStack
                  padding="$3"
                  backgroundColor="$red2"
                  borderWidth={1}
                  borderColor="$red6"
                  borderRadius="$2"
                  color="$red10"
                  fontSize="$3"
                  alignItems="flex-start"
                  gap="$2"
                >
                  <AlertTriangle size={16} flexShrink={0} marginTop={2} />
                  <Text color="$red10" fontSize="$3">{formError}</Text>
                </XStack>
              )}

              <YStack gap="$4">
                <YStack>
                  <Text fontSize="$3" fontWeight="500" color="$gray12" marginBottom="$1">
                    Industry Name *
                  </Text>
                  <Input
                    value={formData.name}
                    onChangeText={handleNameChange}
                    placeholder="e.g., Construction, Property Management"
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderRadius="$2"
                    padding="$2"
                    width="100%"
                  />
                </YStack>

                <YStack>
                  <Text fontSize="$3" fontWeight="500" color="$gray12" marginBottom="$1">
                    Slug *
                  </Text>
                  <Input
                    value={formData.slug}
                    onChangeText={(value) =>
                      setFormData((prev) => ({ ...prev, slug: value }))
                    }
                    disabled={modalMode === 'edit'}
                    placeholder="e.g., construction"
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderRadius="$2"
                    padding="$2"
                    width="100%"
                    fontFamily="$mono"
                    backgroundColor={modalMode === 'edit' ? "$gray3" : "white"}
                  />
                  {modalMode === 'edit' && (
                    <Text marginTop="$1" fontSize="$1" color="$gray11">
                      Slug cannot be changed after creation
                    </Text>
                  )}
                </YStack>
              </YStack>

              <YStack borderTopWidth={1} borderColor="$borderColor" paddingTop="$4">
                <Text fontSize="$3" fontWeight="500" color="$gray12" marginBottom="$3">
                  Manager Role Labels
                </Text>
                <XStack gap="$4">
                  <YStack flex={1}>
                    <Text fontSize="$3" color="$gray11" marginBottom="$1">
                      Singular *
                    </Text>
                    <Input
                      value={formData.managerLabelSingular}
                      onChangeText={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          managerLabelSingular: value,
                        }))
                      }
                      placeholder="e.g., General Contractor"
                      borderWidth={1}
                      borderColor="$borderColor"
                      borderRadius="$2"
                      padding="$2"
                      width="100%"
                    />
                  </YStack>
                  <YStack flex={1}>
                    <Text fontSize="$3" color="$gray11" marginBottom="$1">
                      Plural *
                    </Text>
                    <Input
                      value={formData.managerLabelPlural}
                      onChangeText={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          managerLabelPlural: value,
                        }))
                      }
                      placeholder="e.g., General Contractors"
                      borderWidth={1}
                      borderColor="$borderColor"
                      borderRadius="$2"
                      padding="$2"
                      width="100%"
                    />
                  </YStack>
                </XStack>
              </YStack>

              <YStack borderTopWidth={1} borderColor="$borderColor" paddingTop="$4">
                <Text fontSize="$3" fontWeight="500" color="$gray12" marginBottom="$3">
                  Contractor Role Labels
                </Text>
                <XStack gap="$4">
                  <YStack flex={1}>
                    <Text fontSize="$3" color="$gray11" marginBottom="$1">
                      Singular *
                    </Text>
                    <Input
                      value={formData.contractorLabelSingular}
                      onChangeText={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          contractorLabelSingular: value,
                        }))
                      }
                      placeholder="e.g., Subcontractor"
                      borderWidth={1}
                      borderColor="$borderColor"
                      borderRadius="$2"
                      padding="$2"
                      width="100%"
                    />
                  </YStack>
                  <YStack flex={1}>
                    <Text fontSize="$3" color="$gray11" marginBottom="$1">
                      Plural *
                    </Text>
                    <Input
                      value={formData.contractorLabelPlural}
                      onChangeText={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          contractorLabelPlural: value,
                        }))
                      }
                      placeholder="e.g., Subcontractors"
                      borderWidth={1}
                      borderColor="$borderColor"
                      borderRadius="$2"
                      padding="$2"
                      width="100%"
                    />
                  </YStack>
                </XStack>
              </YStack>

              <YStack borderTopWidth={1} borderColor="$borderColor" paddingTop="$4">
                <Text fontSize="$3" fontWeight="500" color="$gray12" marginBottom="$1">
                  Description (optional)
                </Text>
                <TextArea
                  value={formData.description}
                  onChangeText={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: value,
                    }))
                  }
                  placeholder="Brief description of this industry vertical"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$2"
                  padding="$2"
                  width="100%"
                  minHeight={60}
                />
              </YStack>

              <XStack justifyContent="flex-end" gap="$3" paddingTop="$4" borderTopWidth={1} borderColor="$borderColor">
                <Button
                  onPress={closeModal}
                  variant="outlined"
                >
                  Cancel
                </Button>
                <Button
                  onPress={(e) => {
                    e?.preventDefault?.();
                    handleSubmit(e as any);
                  }}
                  disabled={isSubmitting}
                  backgroundColor="$blue9"
                  color="white"
                  icon={isSubmitting ? <Spinner size="small" /> : undefined}
                  opacity={isSubmitting ? 0.5 : 1}
                >
                  {modalMode === 'add' ? 'Create Industry' : 'Save Changes'}
                </Button>
              </XStack>
            </YStack>
          </Card>
        </YStack>
      )}
    </YStack>
  );
}

export default AdminUserSetTypes;
