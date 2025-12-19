// src/pages/admin/Enums.tsx
import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  RefreshCcw,
  X,
  RotateCcw,
} from 'lucide-react';
import { YStack, XStack, Text, Button, H1, H2, H3, Card, Input, Label, Spinner } from 'tamagui';
import { EmptyState } from '@unicornlove/ui';
import Tooltip from '../../ui/Tooltip';
import { useAuth } from '../../contexts/AuthContext';
import { useEnumsAdmin, EnumValue, invalidateAllEnumCaches } from '../../hooks/useEnums';
import {
  createEnumValue,
  updateEnumValue,
  deleteEnumValue,
  reorderEnumValue,
  restoreEnumValue,
  getEnumTypesWithCounts,
} from '../../services/adminEnumService';

interface EnumTypeInfo {
  type: string;
  count: number;
  activeCount: number;
}

// Display labels for enum types
const ENUM_TYPE_LABELS: Record<string, string> = {
  task_status: 'Task Status',
  task_priority: 'Task Priority',
  document_status: 'Document Status',
  policy_type: 'Policy Type',
  compliance_status: 'Compliance Status',
  trade_type: 'Trade Type',
};

function AdminEnums() {
  const { user, profile } = useAuth();
  const [enumTypes, setEnumTypes] = useState<EnumTypeInfo[]>([]);
  const [selectedEnumType, setSelectedEnumType] = useState<string>('');
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingValue, setEditingValue] = useState<EnumValue | null>(null);
  const [formData, setFormData] = useState({
    value: '',
    display_name: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch enum values for selected type
  const {
    data: enumValues,
    isLoading: isLoadingValues,
    error: valuesError,
    refetch: refetchValues,
  } = useEnumsAdmin(selectedEnumType);

  // Fetch enum types on mount
  useEffect(() => {
    async function fetchTypes() {
      setIsLoadingTypes(true);
      try {
        const types = await getEnumTypesWithCounts();
        setEnumTypes(types);
        if (types.length > 0 && !selectedEnumType) {
          setSelectedEnumType(types[0].type);
        }
      } catch (err) {
        console.error('Failed to fetch enum types:', err);
      } finally {
        setIsLoadingTypes(false);
      }
    }
    fetchTypes();
  }, []);

  const adminUserId = user?.id || profile?.id || '';

  // Filter values based on showDeleted toggle
  const displayedValues = enumValues?.filter(
    (v) => showDeleted || v.is_active
  ) || [];

  const handleRefresh = () => {
    invalidateAllEnumCaches();
    refetchValues();
    getEnumTypesWithCounts().then(setEnumTypes);
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingValue(null);
    setFormData({ value: '', display_name: '', description: '' });
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (enumValue: EnumValue) => {
    setModalMode('edit');
    setEditingValue(enumValue);
    setFormData({
      value: enumValue.value,
      display_name: enumValue.display_name,
      description: enumValue.description || '',
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingValue(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUserId) {
      setFormError('User not authenticated');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (modalMode === 'add') {
        await createEnumValue(adminUserId, {
          enum_type: selectedEnumType,
          value: formData.value,
          display_name: formData.display_name,
          description: formData.description || undefined,
        });
      } else if (editingValue) {
        await updateEnumValue(adminUserId, editingValue.id, {
          display_name: formData.display_name,
          description: formData.description || undefined,
        });
      }

      closeModal();
      refetchValues();
      getEnumTypesWithCounts().then(setEnumTypes);
    } catch (err) {
      console.error('Failed to save enum value:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this enum value?')) return;
    if (!adminUserId) return;

    setActionInProgress(id);
    try {
      await deleteEnumValue(adminUserId, id);
      refetchValues();
      getEnumTypesWithCounts().then(setEnumTypes);
    } catch (err) {
      console.error('Failed to delete enum value:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRestore = async (id: string) => {
    if (!adminUserId) return;

    setActionInProgress(id);
    try {
      await restoreEnumValue(adminUserId, id);
      refetchValues();
      getEnumTypesWithCounts().then(setEnumTypes);
    } catch (err) {
      console.error('Failed to restore enum value:', err);
      alert(err instanceof Error ? err.message : 'Failed to restore');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    if (!adminUserId) return;

    setActionInProgress(id);
    try {
      await reorderEnumValue(adminUserId, id, direction);
      refetchValues();
    } catch (err) {
      console.error('Failed to reorder enum value:', err);
      alert(err instanceof Error ? err.message : 'Failed to reorder');
    } finally {
      setActionInProgress(null);
    }
  };

  if (isLoadingTypes) {
    return (
      <YStack alignItems="center" justifyContent="center" paddingVertical="$12">
        <XStack alignItems="center" gap="$2">
          <Spinner size="large" color="$blue10" />
          <Text>Loading enum types...</Text>
        </XStack>
      </YStack>
    );
  }

  return (
    <YStack>
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$6">
        <H1 fontSize="$8" fontWeight="700">Enum Management</H1>
        <XStack alignItems="center" gap="$3">
          <XStack alignItems="center" gap="$2">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            <Label fontSize="$3" color="$color11">Show inactive</Label>
          </XStack>
          <select
            value={selectedEnumType}
            onChange={(e) => setSelectedEnumType(e.target.value)}
            style={{
              padding: '8px',
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: 'var(--borderColor)',
              borderRadius: '12px',
              fontSize: 14,
            }}
          >
            {enumTypes.map((type) => (
              <option key={type.type} value={type.type}>
                {ENUM_TYPE_LABELS[type.type] || type.type} ({type.activeCount}/{type.count})
              </option>
            ))}
          </select>
          <Button
            onPress={handleRefresh}
            disabled={isLoadingValues}
            icon={isLoadingValues ? <Spinner size="small" /> : <RefreshCcw size={16} />}
            paddingHorizontal="$4"
            paddingVertical="$2"
            borderWidth={1}
            borderRadius="$4"
            hoverStyle={{ backgroundColor: "$backgroundHover" }}
            opacity={isLoadingValues ? 0.5 : 1}
            aria-label="Refresh enum values"
          >
            Refresh
          </Button>
        </XStack>
      </XStack>

      {valuesError && (
        <XStack
          padding="$4"
          marginBottom="$4"
          backgroundColor="$red4"
          borderWidth={1}
          borderColor="$red8"
          borderRadius="$4"
        >
          <Text color="$red11">Error: {valuesError.message}</Text>
        </XStack>
      )}

      <Card padding="$6" borderRadius="$4" elevation={1} backgroundColor="$background" marginBottom="$6">
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <H2 fontSize="$7" fontWeight="600">
            {ENUM_TYPE_LABELS[selectedEnumType] || selectedEnumType} Values
          </H2>
          <Button
            onPress={openAddModal}
            icon={<PlusCircle size={16} />}
            paddingHorizontal="$4"
            paddingVertical="$2"
            backgroundColor="$blue10"
            color="white"
            borderRadius="$4"
            hoverStyle={{ backgroundColor: "$blue11" }}
          >
            Add Value
          </Button>
        </XStack>

        {isLoadingValues ? (
          <YStack alignItems="center" justifyContent="center" paddingVertical="$8">
            <XStack alignItems="center" gap="$2">
              <Spinner size="small" color="$blue10" />
              <Text>Loading values...</Text>
            </XStack>
          </YStack>
        ) : displayedValues.length === 0 ? (
          <YStack alignItems="center" paddingVertical="$8">
            <Text color="$color11">No enum values found for this type.</Text>
          </YStack>
        ) : (
          <table style={{ width: '100%', minWidth: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)', textAlign: 'left' }}>Value</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)', textAlign: 'left' }}>Display Name</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)', textAlign: 'left' }}>Description</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)', textAlign: 'left' }}>Order</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedValues.map((enumItem) => (
                <tr
                  key={enumItem.id}
                  style={{
                    backgroundColor: !enumItem.is_active ? 'var(--backgroundHover)' : 'transparent',
                    opacity: !enumItem.is_active ? 0.6 : 1,
                  }}
                >
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    <Text fontFamily="$mono" fontSize="$3">
                      {enumItem.value}
                    </Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    <Text>{enumItem.display_name}</Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    <Text fontSize="$3" color="$color11">
                      {enumItem.description || '—'}
                    </Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    <Text>{enumItem.sort_order}</Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    <XStack
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$2"
                      backgroundColor={enumItem.is_active ? '$green4' : '$backgroundHover'}
                    >
                      <Text fontSize="$1" color={enumItem.is_active ? '$green11' : '$color11'}>
                        {enumItem.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </XStack>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    <XStack alignItems="center" gap="$1">
                      {enumItem.is_active ? (
                        <>
                          <Tooltip content="Edit enum value">
                            <Button
                              onPress={() => openEditModal(enumItem)}
                              disabled={actionInProgress === enumItem.id}
                              padding="$1"
                              backgroundColor="transparent"
                              hoverStyle={{ backgroundColor: "$backgroundHover" }}
                              opacity={actionInProgress === enumItem.id ? 0.5 : 1}
                              aria-label={`Edit ${enumItem.display_name}`}
                            >
                              <Edit size={16} color="$blue10" />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Delete enum value">
                            <Button
                              onPress={() => handleDelete(enumItem.id)}
                              disabled={actionInProgress === enumItem.id}
                              padding="$1"
                              backgroundColor="transparent"
                              hoverStyle={{ backgroundColor: "$backgroundHover" }}
                              opacity={actionInProgress === enumItem.id ? 0.5 : 1}
                              aria-label={`Delete ${enumItem.display_name}`}
                            >
                              {actionInProgress === enumItem.id ? (
                                <Spinner size="small" color="$red10" />
                              ) : (
                                <Trash2 size={16} color="$red10" />
                              )}
                            </Button>
                          </Tooltip>
                          <Tooltip content="Move up">
                            <Button
                              onPress={() => handleReorder(enumItem.id, 'up')}
                              disabled={actionInProgress === enumItem.id}
                              padding="$1"
                              backgroundColor="transparent"
                              hoverStyle={{ backgroundColor: "$backgroundHover" }}
                              opacity={actionInProgress === enumItem.id ? 0.5 : 1}
                              aria-label={`Move ${enumItem.display_name} up`}
                            >
                              <ArrowUp size={16} color="$color11" />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Move down">
                            <Button
                              onPress={() => handleReorder(enumItem.id, 'down')}
                              disabled={actionInProgress === enumItem.id}
                              padding="$1"
                              backgroundColor="transparent"
                              hoverStyle={{ backgroundColor: "$backgroundHover" }}
                              opacity={actionInProgress === enumItem.id ? 0.5 : 1}
                              aria-label={`Move ${enumItem.display_name} down`}
                            >
                              <ArrowDown size={16} color="$color11" />
                            </Button>
                          </Tooltip>
                        </>
                      ) : (
                        <Tooltip content="Restore enum value">
                          <Button
                            onPress={() => handleRestore(enumItem.id)}
                            disabled={actionInProgress === enumItem.id}
                            padding="$1"
                            backgroundColor="transparent"
                            hoverStyle={{ backgroundColor: "$backgroundHover" }}
                            opacity={actionInProgress === enumItem.id ? 0.5 : 1}
                            aria-label={`Restore ${enumItem.display_name}`}
                          >
                            {actionInProgress === enumItem.id ? (
                              <Spinner size="small" color="$green10" />
                            ) : (
                              <RotateCcw size={16} color="$green10" />
                            )}
                          </Button>
                        </Tooltip>
                      )}
                    </XStack>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            backgroundColor="$background"
            borderRadius="$4"
            elevation={4}
            width="100%"
            maxWidth={448}
            marginHorizontal="$4"
          >
            <XStack alignItems="center" justifyContent="space-between" padding="$4" borderBottomWidth={1} borderColor="$borderColor">
              <H3 fontSize="$6" fontWeight="600">
                {modalMode === 'add' ? 'Add Enum Value' : 'Edit Enum Value'}
              </H3>
              <Button
                onPress={closeModal}
                backgroundColor="transparent"
                padding="$1"
                hoverStyle={{ backgroundColor: "$backgroundHover" }}
                aria-label="Close modal"
              >
                <X size={20} color="$color11" />
              </Button>
            </XStack>

            <form onSubmit={handleSubmit}>
              <YStack padding="$4" gap="$4">
                {formError && (
                  <XStack
                    padding="$3"
                    backgroundColor="$red4"
                    borderWidth={1}
                    borderColor="$red8"
                    borderRadius="$2"
                  >
                    <Text fontSize="$3" color="$red11">{formError}</Text>
                  </XStack>
                )}

                <YStack gap="$1">
                  <Label fontSize="$3" fontWeight="600" color="$color12" marginBottom="$1">
                    Value (code)
                  </Label>
                  <Input
                    value={formData.value}
                    onChangeText={(value) => setFormData((prev) => ({ ...prev, value }))}
                    disabled={modalMode === 'edit'}
                    width="100%"
                    padding="$2"
                    borderWidth={1}
                    borderRadius="$4"
                    backgroundColor={modalMode === 'edit' ? '$backgroundHover' : '$background'}
                    placeholder="e.g., pending, approved"
                    required
                  />
                  {modalMode === 'edit' && (
                    <Text fontSize="$1" color="$color11" marginTop="$1">
                      Value cannot be changed after creation
                    </Text>
                  )}
                </YStack>

                <YStack gap="$1">
                  <Label fontSize="$3" fontWeight="600" color="$color12" marginBottom="$1">
                    Display Name
                  </Label>
                  <Input
                    value={formData.display_name}
                    onChangeText={(value) => setFormData((prev) => ({ ...prev, display_name: value }))}
                    width="100%"
                    padding="$2"
                    borderWidth={1}
                    borderRadius="$4"
                    placeholder="e.g., Pending Approval"
                    required
                  />
                </YStack>

                <YStack gap="$1">
                  <Label fontSize="$3" fontWeight="600" color="$color12" marginBottom="$1">
                    Description (optional)
                  </Label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: 'var(--borderColor)',
                      borderRadius: '12px',
                      fontSize: 14,
                      fontFamily: 'inherit',
                    }}
                    placeholder="Brief description of this value"
                    rows={2}
                  />
                </YStack>

                <XStack justifyContent="flex-end" gap="$3" paddingTop="$4">
                  <Button
                    type="button"
                    onPress={closeModal}
                    paddingHorizontal="$4"
                    paddingVertical="$2"
                    borderWidth={1}
                    borderRadius="$4"
                    backgroundColor="transparent"
                    hoverStyle={{ backgroundColor: "$backgroundHover" }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    paddingHorizontal="$4"
                    paddingVertical="$2"
                    backgroundColor="$blue10"
                    color="white"
                    borderRadius="$4"
                    hoverStyle={{ backgroundColor: "$blue11" }}
                    opacity={isSubmitting ? 0.5 : 1}
                    icon={isSubmitting ? <Spinner size="small" /> : undefined}
                  >
                    {modalMode === 'add' ? 'Add Value' : 'Save Changes'}
                  </Button>
                </XStack>
              </YStack>
            </form>
          </Card>
        </YStack>
      )}
    </YStack>
  );
}

export default AdminEnums;
