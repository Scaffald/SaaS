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
import { YStack, XStack, Text, Button, H1, H2, H3, Card, Input, Label } from 'tamagui';
import { EmptyState } from '@unicornlove/ui';
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
      <YStack alignItems="center" justifyContent="center" paddingVertical="$12">
        <XStack alignItems="center" gap="$2">
          <Loader2 size={32} className="animate-spin" color="$blue10" />
          <Text>Loading...</Text>
        </XStack>
      </YStack>
    );
  }

  return (
    <YStack>
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$6">
        <YStack>
          <H1 fontSize="$8" fontWeight="700">Lexicon Editor</H1>
          <Text color="$color11" fontSize="$3" marginTop="$1">
            Customize labels and text for each industry vertical
          </Text>
        </YStack>
        <XStack alignItems="center" gap="$3">
          <select
            value={selectedTypeId}
            onChange={(e) => setSelectedTypeId(e.target.value)}
            style={{
              padding: '8px',
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: 'var(--borderColor)',
              borderRadius: '12px',
              backgroundColor: 'var(--background)',
              fontSize: 14,
            }}
          >
            <option value="">Select Industry...</option>
            {userSetTypes?.filter((t) => t.isActive).map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          <Button
            onPress={handleRefresh}
            disabled={isLoadingLexicon || !selectedTypeId}
            icon={isLoadingLexicon ? <RefreshCcw size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
            paddingHorizontal="$4"
            paddingVertical="$2"
            borderWidth={1}
            borderRadius="$4"
            hoverStyle={{ backgroundColor: "$backgroundHover" }}
            opacity={isLoadingLexicon || !selectedTypeId ? 0.5 : 1}
          >
            Refresh
          </Button>
        </XStack>
      </XStack>

      {!selectedTypeId ? (
        <Card padding="$8" borderRadius="$4" elevation={1} backgroundColor="$background" alignItems="center">
          <Book size={48} color="$color10" style={{ marginBottom: 16 }} />
          <H2 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$2">Select an Industry</H2>
          <Text color="$color11">
            Choose an industry vertical above to view and edit its lexicon entries.
          </Text>
        </Card>
      ) : (
        <>
          {/* Summary and Filters */}
          <Card padding="$4" borderRadius="$4" elevation={1} backgroundColor="$background" marginBottom="$6">
            <XStack alignItems="center" justifyContent="space-between" flexWrap="wrap" gap="$4">
              <XStack alignItems="center" gap="$4">
                <XStack alignItems="center" gap="$2">
                  <Book size={20} color="$blue10" />
                  <Text fontWeight="600">{selectedType?.name}</Text>
                </XStack>
                <XStack alignItems="center" gap="$2">
                  <Text fontSize="$3" color="$color11">
                    {lexiconEntries.length} entries
                  </Text>
                  {customCount > 0 && (
                    <XStack
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      backgroundColor="$blue4"
                      borderRadius="$2"
                    >
                      <Text fontSize="$2" color="$blue11">
                        {customCount} customized
                      </Text>
                    </XStack>
                  )}
                </XStack>
              </XStack>
              <XStack alignItems="center" gap="$3">
                <XStack position="relative" width={256}>
                  <Search
                    size={16}
                    color="$color10"
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}
                  />
                  <Input
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    placeholder="Search keys or values..."
                    paddingLeft="$9"
                    paddingRight="$4"
                    paddingVertical="$2"
                    borderWidth={1}
                    borderRadius="$4"
                    width={256}
                  />
                </XStack>
                <XStack alignItems="center" gap="$2">
                  <input
                    type="checkbox"
                    checked={showCustomOnly}
                    onChange={(e) => setShowCustomOnly(e.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  <Label fontSize="$3" color="$color11">Customized only</Label>
                </XStack>
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
                  Add Entry
                </Button>
              </XStack>
            </XStack>
          </Card>

          {/* Lexicon Entries by Category */}
          {isLoadingLexicon ? (
            <YStack alignItems="center" justifyContent="center" paddingVertical="$12">
              <XStack alignItems="center" gap="$2">
                <Loader2 size={24} className="animate-spin" color="$blue10" />
                <Text>Loading lexicon...</Text>
              </XStack>
            </YStack>
          ) : filteredEntries.length === 0 ? (
            <Card padding="$8" borderRadius="$4" elevation={1} backgroundColor="$background" alignItems="center">
              <Search size={48} color="$color8" style={{ marginBottom: 16 }} />
              <Text color="$color11">No entries match your search.</Text>
            </Card>
          ) : (
            <YStack gap="$6">
              {Object.entries(groupedEntries).map(([category, entries]) => (
                <Card key={category} borderRadius="$4" elevation={1} backgroundColor="$background">
                  <XStack
                    paddingHorizontal="$4"
                    paddingVertical="$3"
                    borderBottomWidth={1}
                    borderColor="$borderColor"
                    backgroundColor="$backgroundHover"
                    borderTopLeftRadius="$4"
                    borderTopRightRadius="$4"
                  >
                    <H3 fontWeight="600" color="$color12" textTransform="capitalize">
                      {category} ({entries.length})
                    </H3>
                  </XStack>
                  <table style={{ width: '100%', minWidth: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Key</th>
                        <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Value</th>
                        <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, fontSize: 14, width: 96 }}>Status</th>
                        <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, fontSize: 14, width: 128 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr
                          key={entry.key}
                          style={{
                            borderTopWidth: 1,
                            borderTopStyle: 'solid',
                            borderTopColor: 'var(--borderColor)',
                            backgroundColor: entry.isCustom ? 'var(--blue4)' : 'transparent',
                          }}
                        >
                          <td style={{ padding: '8px 16px', fontFamily: 'monospace', fontSize: 14 }}>
                            <Text fontFamily="$mono" fontSize="$3" color="$color11">
                              {entry.key}
                            </Text>
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            <XStack alignItems="center" gap="$2">
                              <Text color={entry.isCustom ? '$blue11' : '$color12'} fontWeight={entry.isCustom ? '600' : '400'}>
                                {entry.value}
                              </Text>
                              {entry.isCustom && DEFAULT_LEXICON[entry.key] && (
                                <Text fontSize="$1" color="$color10">
                                  (default: {DEFAULT_LEXICON[entry.key]})
                                </Text>
                              )}
                            </XStack>
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            {entry.isCustom ? (
                              <XStack
                                paddingHorizontal="$2"
                                paddingVertical="$1"
                                backgroundColor="$blue4"
                                borderRadius="$2"
                              >
                                <Text fontSize="$1" color="$blue11">
                                  Customized
                                </Text>
                              </XStack>
                            ) : (
                              <XStack
                                paddingHorizontal="$2"
                                paddingVertical="$1"
                                backgroundColor="$backgroundHover"
                                borderRadius="$2"
                              >
                                <Text fontSize="$1" color="$color11">
                                  Default
                                </Text>
                              </XStack>
                            )}
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            <XStack alignItems="center" gap="$1">
                              <Button
                                onPress={() => openEditModal(entry)}
                                disabled={actionInProgress === entry.key}
                                padding="$1"
                                backgroundColor="transparent"
                                hoverStyle={{ backgroundColor: "$backgroundHover" }}
                                opacity={actionInProgress === entry.key ? 0.5 : 1}
                              >
                                <Edit size={16} color="$blue10" />
                              </Button>
                              {entry.isCustom && DEFAULT_LEXICON[entry.key] && (
                                <Button
                                  onPress={() => handleResetToDefault(entry.key)}
                                  disabled={actionInProgress === entry.key}
                                  padding="$1"
                                  backgroundColor="transparent"
                                  hoverStyle={{ backgroundColor: "$backgroundHover" }}
                                  opacity={actionInProgress === entry.key ? 0.5 : 1}
                                >
                                  {actionInProgress === entry.key ? (
                                    <Loader2 size={16} className="animate-spin" color="$orange10" />
                                  ) : (
                                    <RotateCcw size={16} color="$orange10" />
                                  )}
                                </Button>
                              )}
                              {entry.isCustom && !DEFAULT_LEXICON[entry.key] && (
                                <Button
                                  onPress={() => handleDeleteCustom(entry.key)}
                                  disabled={actionInProgress === entry.key}
                                  padding="$1"
                                  backgroundColor="transparent"
                                  hoverStyle={{ backgroundColor: "$backgroundHover" }}
                                  opacity={actionInProgress === entry.key ? 0.5 : 1}
                                >
                                  {actionInProgress === entry.key ? (
                                    <Loader2 size={16} className="animate-spin" color="$red10" />
                                  ) : (
                                    <Trash2 size={16} color="$red10" />
                                  )}
                                </Button>
                              )}
                            </XStack>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              ))}
            </YStack>
          )}
        </>
      )}

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
                {modalMode === 'add' ? 'Add Lexicon Entry' : 'Edit Lexicon Entry'}
              </H3>
              <Button
                onPress={closeModal}
                backgroundColor="transparent"
                padding="$1"
                hoverStyle={{ backgroundColor: "$backgroundHover" }}
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
                    gap="$2"
                    alignItems="flex-start"
                  >
                    <AlertTriangle size={16} color="$red10" style={{ marginTop: 2, flexShrink: 0 }} />
                    <Text fontSize="$3" color="$red11">{formError}</Text>
                  </XStack>
                )}

                <YStack gap="$1">
                  <Label fontSize="$3" fontWeight="600" color="$color12" marginBottom="$1">
                    Key
                  </Label>
                  <Input
                    value={formData.key}
                    onChangeText={(value) => setFormData((prev) => ({ ...prev, key: value }))}
                    disabled={modalMode === 'edit'}
                    width="100%"
                    padding="$2"
                    borderWidth={1}
                    borderRadius="$4"
                    fontFamily="$mono"
                    backgroundColor={modalMode === 'edit' ? '$backgroundHover' : '$background'}
                    placeholder="e.g., nav.custom_link"
                    required
                  />
                  {modalMode === 'edit' && (
                    <Text fontSize="$1" color="$color11" marginTop="$1">
                      Key cannot be changed
                    </Text>
                  )}
                </YStack>

                <YStack gap="$1">
                  <Label fontSize="$3" fontWeight="600" color="$color12" marginBottom="$1">
                    Value
                  </Label>
                  <Input
                    value={formData.value}
                    onChangeText={(value) => setFormData((prev) => ({ ...prev, value }))}
                    width="100%"
                    padding="$2"
                    borderWidth={1}
                    borderRadius="$4"
                    placeholder="Display text for this key"
                    required
                  />
                  {editingEntry && DEFAULT_LEXICON[editingEntry.key] && (
                    <Text fontSize="$1" color="$color11" marginTop="$1">
                      Default value: {DEFAULT_LEXICON[editingEntry.key]}
                    </Text>
                  )}
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
                    icon={isSubmitting ? <Loader2 size={16} className="animate-spin" /> : undefined}
                  >
                    {modalMode === 'add' ? 'Add Entry' : 'Save Changes'}
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

export default AdminLexiconEditor;
