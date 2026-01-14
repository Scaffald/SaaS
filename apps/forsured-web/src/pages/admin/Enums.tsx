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
import { Stack, Row, Text, Button, Heading, Card, Input, Label, Spinner, colors, spacing } from '@unicornlove/beyond-ui';
import { EmptyState } from '../../ui/EmptyState'
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
      <Stack alignItems="center" justifyContent="center" paddingVertical={spacing[48]}>
        <Row alignItems="center" gap={spacing[8]}>
          <Spinner size="lg" color={colors.primary[500]} />
          <Text>Loading enum types...</Text>
        </Row>
      </Stack>
    );
  }

  return (
    <Stack>
      <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: spacing[24] }}>
        <Heading level={1} weight="bold" style={{ fontSize: 32, fontWeight: '700' }}>Enum Management</Heading>
        <Row alignItems="center" gap={spacing[12]}>
          <Row alignItems="center" gap={spacing[8]}>
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            <Label size="sm" color={colors.text.light.secondary}>Show inactive</Label>
          </Row>
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
            iconStart={isLoadingValues ? undefined : RefreshCcw}
            loading={isLoadingValues}
            variant="outline"
            color="gray"
            style={{ opacity: isLoadingValues ? 0.5 : 1 }}
            aria-label="Refresh enum values"
          >
            Refresh
          </Button>
        </Row>
      </Row>

      {valuesError && (
        <Row
          style={{
            padding: spacing[16],
            marginBottom: spacing[16],
            backgroundColor: colors.error[200],
            borderWidth: 1,
            borderColor: colors.error[400],
            borderRadius: spacing[16],
          }}
        >
          <Text color={colors.error[600]}>Error: {valuesError.message}</Text>
        </Row>
      )}

      <Card style={{ padding: spacing[24], marginBottom: spacing[24] }}>
        <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: spacing[16] }}>
          <Heading level={2} weight="semibold" style={{ fontSize: 24 }}>
            {ENUM_TYPE_LABELS[selectedEnumType] || selectedEnumType} Values
          </Heading>
          <Button
            onPress={openAddModal}
            iconStart={PlusCircle}
            color="primary"
            variant="filled"
          >
            Add Value
          </Button>
        </Row>

        {isLoadingValues ? (
          <Stack alignItems="center" justifyContent="center" paddingVertical={spacing[32]}>
            <Row alignItems="center" gap={spacing[8]}>
              <Spinner size="sm" color={colors.primary[500]} />
              <Text>Loading values...</Text>
            </Row>
          </Stack>
        ) : displayedValues.length === 0 ? (
          <Stack alignItems="center" paddingVertical={spacing[32]}>
            <Text color={colors.text.light.secondary}>No enum values found for this type.</Text>
          </Stack>
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
                    <Text style={{ fontFamily: 'monospace' }} size="sm">
                      {enumItem.value}
                    </Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    <Text>{enumItem.display_name}</Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    <Text size="sm" color={colors.text.light.secondary}>
                      {enumItem.description || '—'}
                    </Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    <Text>{enumItem.sort_order}</Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    <Row
                      style={{
                        paddingHorizontal: spacing[8],
                        paddingVertical: spacing[4],
                        borderRadius: 8,
                        backgroundColor: enumItem.is_active ? colors.success[200] : colors.bg.light.subtle,
                      }}
                    >
                      <Text size="xs" color={enumItem.is_active ? colors.success[600] : colors.text.light.secondary}>
                        {enumItem.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </Row>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    <Row alignItems="center" gap={spacing[4]}>
                      {enumItem.is_active ? (
                        <>
                          <Tooltip content="Edit enum value">
                            <Button
                              onPress={() => openEditModal(enumItem)}
                              disabled={actionInProgress === enumItem.id}
                              iconStart={Edit}
                              variant="text"
                              color="gray"
                              iconOnly
                              style={{ opacity: actionInProgress === enumItem.id ? 0.5 : 1 }}
                              aria-label={`Edit ${enumItem.display_name}`}
                            />
                          </Tooltip>
                          <Tooltip content="Delete enum value">
                            <Button
                              onPress={() => handleDelete(enumItem.id)}
                              disabled={actionInProgress === enumItem.id}
                              iconStart={actionInProgress === enumItem.id ? undefined : Trash2}
                              loading={actionInProgress === enumItem.id}
                              variant="text"
                              color="error"
                              iconOnly
                            />
                          </Tooltip>
                          <Tooltip content="Move up">
                            <Button
                              onPress={() => handleReorder(enumItem.id, 'up')}
                              disabled={actionInProgress === enumItem.id}
                              iconStart={ArrowUp}
                              variant="text"
                              color="gray"
                              iconOnly
                              style={{ opacity: actionInProgress === enumItem.id ? 0.5 : 1 }}
                              aria-label={`Move ${enumItem.display_name} up`}
                            />
                          </Tooltip>
                          <Tooltip content="Move down">
                            <Button
                              onPress={() => handleReorder(enumItem.id, 'down')}
                              disabled={actionInProgress === enumItem.id}
                              iconStart={ArrowDown}
                              variant="text"
                              color="gray"
                              iconOnly
                              style={{ opacity: actionInProgress === enumItem.id ? 0.5 : 1 }}
                              aria-label={`Move ${enumItem.display_name} down`}
                            />
                          </Tooltip>
                        </>
                      ) : (
                        <Tooltip content="Restore enum value">
                          <Button
                            onPress={() => handleRestore(enumItem.id)}
                            disabled={actionInProgress === enumItem.id}
                            iconStart={actionInProgress === enumItem.id ? undefined : RotateCcw}
                            loading={actionInProgress === enumItem.id}
                            variant="text"
                            color="gray"
                            iconOnly
                            aria-label={`Restore ${enumItem.display_name}`}
                          />
                        </Tooltip>
                      )}
                    </Row>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Add/Edit Modal */}
      {showModal && (
        <Stack
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <Card
            style={{
              width: '100%',
              maxWidth: 448,
              marginHorizontal: spacing[16],
            }}
          >
            <Row alignItems="center" justifyContent="space-between" style={{ padding: spacing[16], borderBottomWidth: 1, borderBottomColor: colors.border.light.default }}>
              <Heading level={3} weight="semibold" style={{ fontSize: 20 }}>
                {modalMode === 'add' ? 'Add Enum Value' : 'Edit Enum Value'}
              </Heading>
              <Button
                onPress={closeModal}
                iconStart={X}
                variant="text"
                color="gray"
                iconOnly
                aria-label="Close modal"
              />
            </Row>

            <form onSubmit={handleSubmit}>
              <Stack style={{ padding: spacing[16], gap: spacing[16] }}>
                {formError && (
                  <Row
                    style={{
                      padding: spacing[12],
                      backgroundColor: colors.error[200],
                      borderWidth: 1,
                      borderColor: colors.error[400],
                      borderRadius: 8,
                    }}
                  >
                    <Text size="sm" color={colors.error[600]}>{formError}</Text>
                  </Row>
                )}

                <Stack gap={spacing[4]}>
                  <Label size="sm" weight="semibold" color={colors.text.light.primary} style={{ marginBottom: spacing[4] }}>
                    Value (code)
                  </Label>
                  <Input
                    value={formData.value}
                    onChangeText={(value) => setFormData((prev) => ({ ...prev, value }))}
                    disabled={modalMode === 'edit'}
                    containerStyle={{
                      width: '100%',
                      backgroundColor: modalMode === 'edit' ? colors.bg.light.subtle : colors.bg.light.default,
                    }}
                    style={{ fontFamily: 'monospace' }}
                    placeholder="e.g., pending, approved"
                    required
                  />
                  {modalMode === 'edit' && (
                    <Text size="xs" color={colors.text.light.secondary} style={{ marginTop: spacing[4] }}>
                      Value cannot be changed after creation
                    </Text>
                  )}
                </Stack>

                <Stack gap={spacing[4]}>
                  <Label size="sm" weight="semibold" color={colors.text.light.primary} style={{ marginBottom: spacing[4] }}>
                    Display Name
                  </Label>
                  <Input
                    value={formData.display_name}
                    onChangeText={(value) => setFormData((prev) => ({ ...prev, display_name: value }))}
                    containerStyle={{ width: '100%' }}
                    placeholder="e.g., Pending Approval"
                    required
                  />
                </Stack>

                <Stack gap={spacing[4]}>
                  <Label size="sm" weight="semibold" color={colors.text.light.primary} style={{ marginBottom: spacing[4] }}>
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
                      borderColor: colors.border.light.default,
                      borderRadius: spacing[12],
                      fontSize: 14,
                      fontFamily: 'inherit',
                    }}
                    placeholder="Brief description of this value"
                    rows={2}
                  />
                </Stack>

                <Row justifyContent="flex-end" gap={spacing[12]} style={{ paddingTop: spacing[16] }}>
                  <Button
                    onPress={closeModal}
                    variant="outline"
                    color="gray"
                  >
                    Cancel
                  </Button>
                  <Button
                    onPress={() => {
                      const syntheticEvent = new Event('submit') as any;
                      syntheticEvent.preventDefault = () => {};
                      handleSubmit(syntheticEvent);
                    }}
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    color="primary"
                    variant="filled"
                  >
                    {modalMode === 'add' ? 'Add Value' : 'Save Changes'}
                  </Button>
                </Row>
              </Stack>
            </form>
          </Card>
        </Stack>
      )}
    </Stack>
  );
}

export default AdminEnums;
