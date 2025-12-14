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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2">Loading user set types...</span>
      </div>
    );
  }

  return (
    <div className="admin-user-set-types-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Industry Verticals</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage user set types for different industry verticals (Construction, Property Management, etc.)
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="mr-2"
            />
            Show inactive ({totalCount - activeCount})
          </label>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCcw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusCircle size={16} className="mr-2" />
            Add Industry
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Error: {error.message}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Industries</p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Users Assigned</p>
              <p className="text-2xl font-bold">
                {userSetTypes?.reduce((sum, ust) => sum + (ust.userCount ?? 0), 0) ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Set Types Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        {displayedTypes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
            <p>No user set types found.</p>
            <button
              onClick={openAddModal}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Create your first industry vertical
            </button>
          </div>
        ) : (
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">Industry</th>
                <th className="py-2 px-4 border-b text-left">Slug</th>
                <th className="py-2 px-4 border-b text-left">Manager Label</th>
                <th className="py-2 px-4 border-b text-left">Contractor Label</th>
                <th className="py-2 px-4 border-b text-left">Users</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedTypes.map((ust) => (
                <tr
                  key={ust.id}
                  className={!ust.isActive ? 'bg-gray-50 opacity-60' : ''}
                >
                  <td className="py-3 px-4 border-b">
                    <div>
                      <p className="font-medium">{ust.name}</p>
                      {ust.description && (
                        <p className="text-xs text-gray-500 mt-1">{ust.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 border-b font-mono text-sm text-gray-600">
                    {ust.slug}
                  </td>
                  <td className="py-3 px-4 border-b">
                    <div className="text-sm">
                      <p>{ust.managerLabelSingular}</p>
                      <p className="text-gray-500">({ust.managerLabelPlural})</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 border-b">
                    <div className="text-sm">
                      <p>{ust.contractorLabelSingular}</p>
                      <p className="text-gray-500">({ust.contractorLabelPlural})</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 border-b text-center">
                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-sm">
                      {ust.userCount ?? 0}
                    </span>
                  </td>
                  <td className="py-3 px-4 border-b">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        ust.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {ust.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 border-b">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditModal(ust)}
                        disabled={actionInProgress === ust.id}
                        className="p-1 text-blue-500 hover:text-blue-700 disabled:opacity-50"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      {ust.isActive ? (
                        <button
                          onClick={() => handleToggleActive(ust.id, true)}
                          disabled={actionInProgress === ust.id || (ust.userCount ?? 0) > 0}
                          className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50"
                          title={
                            (ust.userCount ?? 0) > 0
                              ? 'Cannot deactivate: users assigned'
                              : 'Deactivate'
                          }
                        >
                          {actionInProgress === ust.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleActive(ust.id, false)}
                          disabled={actionInProgress === ust.id}
                          className="p-1 text-green-500 hover:text-green-700 disabled:opacity-50"
                          title="Activate"
                        >
                          {actionInProgress === ust.id ? (
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">
                {modalMode === 'add' ? 'Add Industry Vertical' : 'Edit Industry Vertical'}
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
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm flex items-start gap-2">
                  <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g., Construction, Property Management"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    disabled={modalMode === 'edit'}
                    className="w-full p-2 border rounded-md font-mono disabled:bg-gray-100"
                    placeholder="e.g., construction"
                    required
                  />
                  {modalMode === 'edit' && (
                    <p className="mt-1 text-xs text-gray-500">
                      Slug cannot be changed after creation
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Manager Role Labels
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Singular *
                    </label>
                    <input
                      type="text"
                      value={formData.managerLabelSingular}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          managerLabelSingular: e.target.value,
                        }))
                      }
                      className="w-full p-2 border rounded-md"
                      placeholder="e.g., General Contractor"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Plural *
                    </label>
                    <input
                      type="text"
                      value={formData.managerLabelPlural}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          managerLabelPlural: e.target.value,
                        }))
                      }
                      className="w-full p-2 border rounded-md"
                      placeholder="e.g., General Contractors"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Contractor Role Labels
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Singular *
                    </label>
                    <input
                      type="text"
                      value={formData.contractorLabelSingular}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          contractorLabelSingular: e.target.value,
                        }))
                      }
                      className="w-full p-2 border rounded-md"
                      placeholder="e.g., Subcontractor"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Plural *
                    </label>
                    <input
                      type="text"
                      value={formData.contractorLabelPlural}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          contractorLabelPlural: e.target.value,
                        }))
                      }
                      className="w-full p-2 border rounded-md"
                      placeholder="e.g., Subcontractors"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
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
                  placeholder="Brief description of this industry vertical"
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
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
                  {modalMode === 'add' ? 'Create Industry' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUserSetTypes;
