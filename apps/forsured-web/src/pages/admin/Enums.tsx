// src/pages/admin/Enums.tsx
import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  RefreshCcw,
  Loader2,
  X,
  RotateCcw,
} from 'lucide-react';
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2">Loading enum types...</span>
      </div>
    );
  }

  return (
    <div className="admin-enums-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Enum Management</h1>
        <div className="flex items-center space-x-3">
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="mr-2"
            />
            Show inactive
          </label>
          <select
            value={selectedEnumType}
            onChange={(e) => setSelectedEnumType(e.target.value)}
            className="p-2 border rounded-md"
          >
            {enumTypes.map((type) => (
              <option key={type.type} value={type.type}>
                {ENUM_TYPE_LABELS[type.type] || type.type} ({type.activeCount}/{type.count})
              </option>
            ))}
          </select>
          <button
            onClick={handleRefresh}
            disabled={isLoadingValues}
            className="flex items-center px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCcw size={16} className={`mr-2 ${isLoadingValues ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {valuesError && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Error: {valuesError.message}</p>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {ENUM_TYPE_LABELS[selectedEnumType] || selectedEnumType} Values
          </h2>
          <button
            onClick={openAddModal}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusCircle size={16} className="mr-2" />
            Add Value
          </button>
        </div>

        {isLoadingValues ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin h-6 w-6 text-blue-500" />
            <span className="ml-2">Loading values...</span>
          </div>
        ) : displayedValues.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No enum values found for this type.
          </div>
        ) : (
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">Value</th>
                <th className="py-2 px-4 border-b text-left">Display Name</th>
                <th className="py-2 px-4 border-b text-left">Description</th>
                <th className="py-2 px-4 border-b text-left">Order</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedValues.map((enumItem) => (
                <tr
                  key={enumItem.id}
                  className={!enumItem.is_active ? 'bg-gray-50 opacity-60' : ''}
                >
                  <td className="py-2 px-4 border-b font-mono text-sm">
                    {enumItem.value}
                  </td>
                  <td className="py-2 px-4 border-b">{enumItem.display_name}</td>
                  <td className="py-2 px-4 border-b text-sm text-gray-600">
                    {enumItem.description || '—'}
                  </td>
                  <td className="py-2 px-4 border-b">{enumItem.sort_order}</td>
                  <td className="py-2 px-4 border-b">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        enumItem.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {enumItem.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <div className="flex items-center space-x-1">
                      {enumItem.is_active ? (
                        <>
                          <button
                            onClick={() => openEditModal(enumItem)}
                            disabled={actionInProgress === enumItem.id}
                            className="p-1 text-blue-500 hover:text-blue-700 disabled:opacity-50"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(enumItem.id)}
                            disabled={actionInProgress === enumItem.id}
                            className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50"
                            title="Deactivate"
                          >
                            {actionInProgress === enumItem.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                          <button
                            onClick={() => handleReorder(enumItem.id, 'up')}
                            disabled={actionInProgress === enumItem.id}
                            className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                            title="Move up"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            onClick={() => handleReorder(enumItem.id, 'down')}
                            disabled={actionInProgress === enumItem.id}
                            className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                            title="Move down"
                          >
                            <ArrowDown size={16} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleRestore(enumItem.id)}
                          disabled={actionInProgress === enumItem.id}
                          className="p-1 text-green-500 hover:text-green-700 disabled:opacity-50"
                          title="Restore"
                        >
                          {actionInProgress === enumItem.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <RotateCcw size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {modalMode === 'add' ? 'Add Enum Value' : 'Edit Enum Value'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value (code)
                </label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, value: e.target.value }))
                  }
                  disabled={modalMode === 'edit'}
                  className="w-full p-2 border rounded-md disabled:bg-gray-100"
                  placeholder="e.g., pending, approved"
                  required
                />
                {modalMode === 'edit' && (
                  <p className="mt-1 text-xs text-gray-500">
                    Value cannot be changed after creation
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      display_name: e.target.value,
                    }))
                  }
                  className="w-full p-2 border rounded-md"
                  placeholder="e.g., Pending Approval"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full p-2 border rounded-md"
                  placeholder="Brief description of this value"
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isSubmitting && (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  )}
                  {modalMode === 'add' ? 'Add Value' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminEnums;
