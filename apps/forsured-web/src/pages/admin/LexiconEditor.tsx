/**
 * Admin Lexicon Editor Page
 * REQ-4: Multi-Industry User Set Type System with Configurable Lexicon
 * TASK-10: Build admin lexicon editor UI
 *
 * Allows administrators to:
 * - View all lexicon keys and values for each user set type
 * - Edit lexicon values (override defaults)
 * - Reset values to defaults
 * - Add new custom lexicon entries
 */
import { useState, useMemo } from 'react';
import {
  PlusCircle,
  Edit,
  Trash2,
  RefreshCcw,
  Loader2,
  X,
  RotateCcw,
  Book,
  Check,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { trpc } from '../../lib/trpc';
import { DEFAULT_LEXICON } from '../../contexts/LexiconContext';

interface LexiconEntry {
  id: string;
  key: string;
  value: string;
  isCustom: boolean;
}

function AdminLexiconEditor() {
  // State
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomOnly, setShowCustomOnly] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingEntry, setEditingEntry] = useState<LexiconEntry | null>(null);
  const [formData, setFormData] = useState({ key: '', value: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // tRPC queries
  const {
    data: userSetTypes,
    isLoading: isLoadingTypes,
  } = trpc.userSetTypes.list.useQuery();

  const {
    data: lexiconData,
    isLoading: isLoadingLexicon,
    refetch: refetchLexicon,
  } = trpc.userSetTypes.getLexicon.useQuery(
    { userSetTypeId: selectedTypeId },
    { enabled: !!selectedTypeId }
  );

  const upsertMutation = trpc.userSetTypes.upsertLexiconEntry.useMutation();
  const deleteMutation = trpc.userSetTypes.deleteLexiconEntry.useMutation();

  // Set initial selection when types load
  useMemo(() => {
    if (userSetTypes?.length && !selectedTypeId) {
      const activeType = userSetTypes.find((t) => t.isActive);
      if (activeType) {
        setSelectedTypeId(activeType.id);
      }
    }
  }, [userSetTypes, selectedTypeId]);

  // Build combined lexicon entries (defaults + custom)
  const lexiconEntries = useMemo((): LexiconEntry[] => {
    const entries: LexiconEntry[] = [];
    const customEntries = lexiconData?.entries ?? {};

    // Add all default keys
    for (const [key, defaultValue] of Object.entries(DEFAULT_LEXICON)) {
      const customValue = customEntries[key];
      entries.push({
        id: key,
        key,
        value: customValue ?? defaultValue,
        isCustom: !!customValue,
      });
    }

    // Add any custom entries that aren't in defaults
    for (const [key, value] of Object.entries(customEntries)) {
      if (!DEFAULT_LEXICON[key]) {
        entries.push({
          id: key,
          key,
          value,
          isCustom: true,
        });
      }
    }

    return entries.sort((a, b) => a.key.localeCompare(b.key));
  }, [lexiconData]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return lexiconEntries.filter((entry) => {
      const matchesSearch =
        entry.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.value.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCustom = !showCustomOnly || entry.isCustom;
      return matchesSearch && matchesCustom;
    });
  }, [lexiconEntries, searchTerm, showCustomOnly]);

  const selectedType = userSetTypes?.find((t) => t.id === selectedTypeId);
  const customCount = lexiconEntries.filter((e) => e.isCustom).length;

  const handleRefresh = () => {
    refetchLexicon();
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingEntry(null);
    setFormData({ key: '', value: '' });
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (entry: LexiconEntry) => {
    setModalMode('edit');
    setEditingEntry(entry);
    setFormData({ key: entry.key, value: entry.value });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEntry(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeId) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      await upsertMutation.mutateAsync({
        userSetTypeId: selectedTypeId,
        key: formData.key,
        value: formData.value,
      });

      closeModal();
      refetchLexicon();
    } catch (err) {
      console.error('Failed to save lexicon entry:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetToDefault = async (key: string) => {
    if (!selectedTypeId) return;
    if (!window.confirm('Are you sure you want to reset this value to the default?')) return;

    setActionInProgress(key);
    try {
      await deleteMutation.mutateAsync({
        userSetTypeId: selectedTypeId,
        key,
      });
      refetchLexicon();
    } catch (err) {
      console.error('Failed to reset lexicon entry:', err);
      alert(err instanceof Error ? err.message : 'Failed to reset');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteCustom = async (key: string) => {
    if (!selectedTypeId) return;
    if (!window.confirm('Are you sure you want to delete this custom entry?')) return;

    setActionInProgress(key);
    try {
      await deleteMutation.mutateAsync({
        userSetTypeId: selectedTypeId,
        key,
      });
      refetchLexicon();
    } catch (err) {
      console.error('Failed to delete lexicon entry:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setActionInProgress(null);
    }
  };

  // Get category from key (e.g., "nav.dashboard" -> "nav")
  const getCategory = (key: string): string => {
    const parts = key.split('.');
    return parts[0] ?? 'other';
  };

  // Group entries by category
  const groupedEntries = useMemo(() => {
    const groups: Record<string, LexiconEntry[]> = {};
    for (const entry of filteredEntries) {
      const category = getCategory(entry.key);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(entry);
    }
    return groups;
  }, [filteredEntries]);

  if (isLoadingTypes) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="admin-lexicon-editor-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Lexicon Editor</h1>
          <p className="text-gray-500 text-sm mt-1">
            Customize labels and text for each industry vertical
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTypeId}
            onChange={(e) => setSelectedTypeId(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="">Select Industry...</option>
            {userSetTypes?.filter((t) => t.isActive).map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleRefresh}
            disabled={isLoadingLexicon || !selectedTypeId}
            className="flex items-center px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCcw size={16} className={`mr-2 ${isLoadingLexicon ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {!selectedTypeId ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <Book size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Select an Industry</h2>
          <p className="text-gray-500">
            Choose an industry vertical above to view and edit its lexicon entries.
          </p>
        </div>
      ) : (
        <>
          {/* Summary and Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Book size={20} className="text-blue-600" />
                  <span className="font-medium">{selectedType?.name}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {lexiconEntries.length} entries
                  {customCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                      {customCount} customized
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search keys or values..."
                    className="pl-9 pr-4 py-2 border rounded-md w-64"
                  />
                </div>
                <label className="flex items-center text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={showCustomOnly}
                    onChange={(e) => setShowCustomOnly(e.target.checked)}
                    className="mr-2"
                  />
                  Customized only
                </label>
                <button
                  onClick={openAddModal}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <PlusCircle size={16} className="mr-2" />
                  Add Entry
                </button>
              </div>
            </div>
          </div>

          {/* Lexicon Entries by Category */}
          {isLoadingLexicon ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin h-6 w-6 text-blue-500" />
              <span className="ml-2">Loading lexicon...</span>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <Search size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No entries match your search.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedEntries).map(([category, entries]) => (
                <div key={category} className="bg-white rounded-lg shadow">
                  <div className="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
                    <h3 className="font-medium text-gray-700 capitalize">
                      {category} ({entries.length})
                    </h3>
                  </div>
                  <table className="min-w-full">
                    <thead>
                      <tr className="text-sm text-gray-500">
                        <th className="py-2 px-4 text-left font-medium">Key</th>
                        <th className="py-2 px-4 text-left font-medium">Value</th>
                        <th className="py-2 px-4 text-left font-medium w-24">Status</th>
                        <th className="py-2 px-4 text-left font-medium w-32">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr
                          key={entry.key}
                          className={`border-t ${entry.isCustom ? 'bg-blue-50' : ''}`}
                        >
                          <td className="py-2 px-4 font-mono text-sm text-gray-600">
                            {entry.key}
                          </td>
                          <td className="py-2 px-4">
                            <span className={entry.isCustom ? 'text-blue-700 font-medium' : ''}>
                              {entry.value}
                            </span>
                            {entry.isCustom && DEFAULT_LEXICON[entry.key] && (
                              <span className="ml-2 text-xs text-gray-400">
                                (default: {DEFAULT_LEXICON[entry.key]})
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-4">
                            {entry.isCustom ? (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                Customized
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                Default
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-4">
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => openEditModal(entry)}
                                disabled={actionInProgress === entry.key}
                                className="p-1 text-blue-500 hover:text-blue-700 disabled:opacity-50"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              {entry.isCustom && DEFAULT_LEXICON[entry.key] && (
                                <button
                                  onClick={() => handleResetToDefault(entry.key)}
                                  disabled={actionInProgress === entry.key}
                                  className="p-1 text-orange-500 hover:text-orange-700 disabled:opacity-50"
                                  title="Reset to default"
                                >
                                  {actionInProgress === entry.key ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : (
                                    <RotateCcw size={16} />
                                  )}
                                </button>
                              )}
                              {entry.isCustom && !DEFAULT_LEXICON[entry.key] && (
                                <button
                                  onClick={() => handleDeleteCustom(entry.key)}
                                  disabled={actionInProgress === entry.key}
                                  className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50"
                                  title="Delete"
                                >
                                  {actionInProgress === entry.key ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {modalMode === 'add' ? 'Add Lexicon Entry' : 'Edit Lexicon Entry'}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, key: e.target.value }))
                  }
                  disabled={modalMode === 'edit'}
                  className="w-full p-2 border rounded-md font-mono disabled:bg-gray-100"
                  placeholder="e.g., nav.custom_link"
                  required
                />
                {modalMode === 'edit' && (
                  <p className="mt-1 text-xs text-gray-500">
                    Key cannot be changed
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value
                </label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, value: e.target.value }))
                  }
                  className="w-full p-2 border rounded-md"
                  placeholder="Display text for this key"
                  required
                />
                {editingEntry && DEFAULT_LEXICON[editingEntry.key] && (
                  <p className="mt-1 text-xs text-gray-500">
                    Default value: {DEFAULT_LEXICON[editingEntry.key]}
                  </p>
                )}
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
                  {modalMode === 'add' ? 'Add Entry' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLexiconEditor;
